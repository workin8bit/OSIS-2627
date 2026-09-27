// Uji skema, RLS, dan fungsi RPC Supabase secara lokal menggunakan PGlite
// (Postgres asli yang berjalan di WASM). Skema `auth` & `storage` Supabase
// disimulasikan secukupnya. Jalankan: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(path.join(dir, '..', p), 'utf8');

const SUPABASE_STUB = `
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text unique);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;
`;

const db = new PGlite();
let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

/** Jalankan query sebagai role tertentu (anon / authenticated dengan user id). */
async function as(role, userId, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId || '']);
    await tx.query(`select set_config('request.headers', $1, true)`, [JSON.stringify({ 'x-forwarded-for': '10.0.0.1' })]);
    await tx.exec(`set local role ${role}`);
    return tx.query(sql, params);
  });
}
async function rejects(p, re) {
  await assert.rejects(p, re);
}

await db.exec(SUPABASE_STUB);
await db.exec(read('migrations/20260927000000_init.sql'));
await db.exec(read('seed.sql'));
// Jalankan migrasi dua kali untuk memastikan idempoten
await db.exec(read('migrations/20260927000000_init.sql'));

const { rows: users } = await db.query(
  `insert into auth.users (email) values ('super@osis.id'), ('admin@osis.id'), ('siswa@osis.id') returning id, email`
);
const [SUPER, ADMIN, SISWA] = users.map((u) => u.id);
await db.query(
  `insert into public.admins (user_id, name, email, role) values ($1, 'Super', 'super@osis.id', 'superadmin'), ($2, 'Admin', 'admin@osis.id', 'admin')`,
  [SUPER, ADMIN]
);

console.log('Seed & migrasi');
await test('data contoh termuat', async () => {
  const { rows } = await db.query(`select (select count(*) from divisions)::int d, (select count(*) from members)::int m, (select count(*) from programs)::int p`);
  assert.deepEqual(rows[0], { d: 10, m: 37, p: 13 });
});
await test('bucket media dibuat', async () => {
  const { rows } = await db.query(`select public from storage.buckets where id = 'media'`);
  assert.equal(rows[0].public, true);
});

console.log('Akses publik (anon)');
await test('anon dapat membaca konten publik', async () => {
  const { rows } = await as('anon', null, `select count(*)::int n from programs`);
  assert.equal(rows[0].n, 13);
});
await test('anon tidak dapat mengubah konten', async () => {
  await rejects(as('anon', null, `insert into divisions (name) values ('x')`), /permission denied|row-level security/);
  const { rows } = await as('anon', null, `update programs set progress = 1 returning id`).catch(() => ({ rows: [] }));
  assert.equal(rows.length, 0);
});
await test('anon tidak dapat membaca tabel aspirasi & admin', async () => {
  await rejects(as('anon', null, `select * from aspirations`), /permission denied/);
  await rejects(as('anon', null, `select * from admins`), /permission denied/);
});
await test('berita draf tersembunyi dari publik', async () => {
  await db.query(`insert into posts (title, published) values ('Draf Rahasia', false)`);
  const { rows } = await as('anon', null, `select title from posts where title = 'Draf Rahasia'`);
  assert.equal(rows.length, 0);
  const { rows: r2 } = await as('authenticated', ADMIN, `select title from posts where title = 'Draf Rahasia'`);
  assert.equal(r2.length, 1);
});
await test('public_stats mengembalikan statistik', async () => {
  const { rows } = await as('anon', null, `select public_stats() s`);
  assert.equal(rows[0].s.members, 37);
  assert.equal(rows[0].s.aspirations_done, 1);
});

console.log('Aspirasi');
let ticket;
await test('submit_aspiration membuat tiket & menyembunyikan identitas anonim', async () => {
  const { rows } = await as('anon', null, `select submit_aspiration($1, 'Kebersihan', 'Budi', 'X-1', true) t`, ['Mohon tambah tempat sampah di kantin']);
  ticket = rows[0].t;
  assert.match(ticket, /^ASP-[0-9A-F]{6}$/);
  const { rows: r } = await db.query(`select name, class_name, anonymous from aspirations where ticket = $1`, [ticket]);
  assert.deepEqual(r[0], { name: null, class_name: null, anonymous: true });
});
await test('submit_aspiration menolak pesan terlalu pendek', async () => {
  await rejects(as('anon', null, `select submit_aspiration('pendek')`), /minimal 10 karakter/);
});
await test('track_aspiration dapat dipakai publik (tidak peka huruf besar/kecil)', async () => {
  const { rows } = await as('anon', null, `select * from track_aspiration($1)`, [ticket.toLowerCase()]);
  assert.equal(rows[0].status, 'baru');
  assert.equal(rows[0].name, undefined);
});
await test('rate limit 5 kiriman / 10 menit / IP', async () => {
  for (let i = 0; i < 4; i++) await as('anon', null, `select submit_aspiration('Aspirasi uji rate limit ${i}')`);
  await rejects(as('anon', null, `select submit_aspiration('Aspirasi keenam harus ditolak')`), /Terlalu banyak/);
});
await test('admin menanggapi, updated_at diperbarui, tampil di public_aspirations', async () => {
  const { rows } = await as('authenticated', ADMIN, `update aspirations set status = 'selesai', response = 'Sudah ditambah' where ticket = $1 returning updated_at > created_at ok`, [ticket]);
  assert.equal(rows.length, 1);
  const { rows: pub } = await as('anon', null, `select * from public_aspirations()`);
  assert.ok(pub.some((p) => p.ticket === ticket));
  assert.ok(pub.every((p) => p.name === undefined));
});
await test('user login non-admin tidak dapat membaca aspirasi', async () => {
  const { rows } = await as('authenticated', SISWA, `select * from aspirations`);
  assert.equal(rows.length, 0);
});

console.log('Admin & berita');
await test('admin dapat CRUD konten', async () => {
  const { rows } = await as('authenticated', ADMIN, `insert into events (title, date, time) values ('Uji', '2026-12-01', '08:00') returning id`);
  await as('authenticated', ADMIN, `delete from events where id = $1`, [rows[0].id]);
});
await test('user non-admin tidak dapat CRUD konten', async () => {
  await rejects(as('authenticated', SISWA, `insert into events (title, date) values ('X', '2026-12-01')`), /row-level security/);
});
await test('slug berita dibuat otomatis & unik', async () => {
  const a = await as('authenticated', ADMIN, `insert into posts (title) values ('Pelantikan Pengurus OSIS 2026/2027') returning slug`);
  assert.equal(a.rows[0].slug, 'pelantikan-pengurus-osis-2026-2027-2');
  const b = await as('authenticated', ADMIN, `update posts set title = 'Judul Baru' where slug = 'pelantikan-pengurus-osis-2026-2027-2' returning slug`);
  assert.equal(b.rows[0].slug, 'pelantikan-pengurus-osis-2026-2027-2', 'slug tidak berubah saat judul diedit');
});
await test('increment_post_views menambah jumlah baca', async () => {
  await as('anon', null, `select increment_post_views('semarak-maulid-nabi-smaga')`);
  const { rows } = await db.query(`select views from posts where slug = 'semarak-maulid-nabi-smaga'`);
  assert.equal(rows[0].views, 1);
});
await test('pengaturan dapat di-upsert admin, tidak oleh anon', async () => {
  await as('authenticated', ADMIN, `insert into settings (key, value) values ('tagline', '"Baru"') on conflict (key) do update set value = excluded.value`);
  const { rows } = await db.query(`select value from settings where key = 'tagline'`);
  assert.equal(rows[0].value, 'Baru');
  await rejects(as('anon', null, `insert into settings (key, value) values ('x', '"y"')`), /permission denied|row-level security/);
});

console.log('Manajemen admin');
await test('admin biasa dapat melihat daftar admin tapi tidak menambah', async () => {
  const { rows } = await as('authenticated', ADMIN, `select * from admins`);
  assert.equal(rows.length, 2);
  await rejects(as('authenticated', ADMIN, `insert into admins (user_id, name) values ($1, 'X')`, [SISWA]), /row-level security/);
});
await test('superadmin dapat menambah & menghapus admin, tapi tidak menghapus diri sendiri', async () => {
  await as('authenticated', SUPER, `insert into admins (user_id, name) values ($1, 'Siswa')`, [SISWA]);
  const del = await as('authenticated', SUPER, `delete from admins where user_id = $1 returning user_id`, [SISWA]);
  assert.equal(del.rows.length, 1);
  const self = await as('authenticated', SUPER, `delete from admins where user_id = $1 returning user_id`, [SUPER]);
  assert.equal(self.rows.length, 0);
});

console.log('Storage');
await test('hanya admin yang dapat mengunggah ke bucket media', async () => {
  await as('authenticated', ADMIN, `insert into storage.objects (bucket_id, name) values ('media', 'a.jpg')`);
  await rejects(as('authenticated', SISWA, `insert into storage.objects (bucket_id, name) values ('media', 'b.jpg')`), /row-level security/);
  await rejects(as('anon', null, `insert into storage.objects (bucket_id, name) values ('media', 'c.jpg')`), /row-level security/);
  const { rows } = await as('anon', null, `select name from storage.objects where bucket_id = 'media'`);
  assert.equal(rows.length, 1);
});

console.log(`\n${passed} tes lulus${process.exitCode ? ', ada yang GAGAL' : ''}.`);
