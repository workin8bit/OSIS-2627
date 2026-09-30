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
await db.exec(read('migrations/20260927010000_rename_cabinet.sql'));
await db.exec(read('migrations/20260927020000_add_tiktok_setting.sql'));
await db.exec(read('migrations/20260928000000_dedupe_seed_data.sql'));

const { rows: users } = await db.query(
  `insert into auth.users (email) values ('super@osis.id'), ('admin@osis.id'), ('siswa@osis.id'), ('sekbid@osis.id') returning id, email`
);
const [SUPER, ADMIN, SISWA, SEKBID] = users.map((u) => u.id);
await db.query(
  `insert into public.admins (user_id, name, email, role) values ($1, 'Super', 'super@osis.id', 'superadmin'), ($2, 'Admin', 'admin@osis.id', 'admin')`,
  [SUPER, ADMIN]
);

// Migrasi hak akses dijalankan setelah admin awal ada agar backfill teruji
await db.exec(read('migrations/20260930000000_admin_access.sql'));
await db.exec(read('migrations/20260930000000_admin_access.sql')); // idempoten
await db.exec(read('migrations/20260930010000_division_member_access.sql'));
await db.exec(read('migrations/20260930010000_division_member_access.sql')); // idempoten

// Tiga patch SQL untuk SQL Editor harus valid, idempoten, dan cukup untuk
// menggantikan kedua migrasi hak akses (dijalankan pada kondisi proyek yang
// hanya sudah punya migrasi awal, seperti produksi).
const before = (
  await db.query(
    `select (select count(*) from divisions)::int d, (select count(*) from members)::int m, (select count(*) from posts)::int p`
  )
).rows[0];
for (const f of ['patch-1-skema.sql', 'patch-2-rls.sql', 'patch-3-data.sql']) {
  await db.exec(read(f));
  await db.exec(read(f)); // idempoten
}

console.log('Seed & migrasi');
await test('patch skema hak akses idempoten', async () => {
  const { rows } = await db.query(
    `select (select count(*) from information_schema.columns
              where table_schema = 'public' and table_name = 'admins' and column_name = 'member_id')::int c,
            (select count(*) from information_schema.tables
              where table_schema = 'public' and table_name in ('admin_permissions', 'division_permissions'))::int t,
            (select count(*) from public.members)::int m,
            (select count(*) from public.admin_permissions)::int ap,
            (select count(*) from public.division_permissions)::int dp`
  );
  assert.equal(rows[0].c, 1, 'kolom admins.member_id harus ada');
  assert.equal(rows[0].t, 2, 'dua tabel izin harus ada');
  assert.equal(rows[0].m, 27, 'data contoh dibersihkan & dedupe');
  assert.ok(rows[0].ap > 0, 'izin admin lama dibackfill');
  assert.equal(rows[0].dp, 50, 'template 10 sekbid x 5 modul');
});
await test('patch tidak merusak atau menggandakan data', async () => {
  const { rows } = await db.query(
    `select (select count(*) from divisions)::int d, (select count(*) from members)::int m, (select count(*) from posts)::int p`
  );
  assert.deepEqual(rows[0], { ...before, m: 27 }); // anggota didedupe, sisanya utuh
});
await test('data contoh termuat', async () => {
  const { rows } = await db.query(`select (select count(*) from divisions)::int d, (select count(*) from members)::int m, (select count(*) from programs)::int p`);
  assert.deepEqual(rows[0], { d: 10, m: 27, p: 13 }); // 7 pengurus inti + 10 koordinator + 10 anggota
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
  assert.equal(rows[0].s.members, 27);
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
await test('admin biasa dapat melihat daftar admin, menambah admin biasa, tapi tidak superadmin', async () => {
  const { rows } = await as('authenticated', ADMIN, `select * from admins`);
  assert.equal(rows.length, 2);
  const add = await as('authenticated', ADMIN, `insert into admins (user_id, name) values ($1, 'X') returning user_id`, [SISWA]);
  assert.equal(add.rows.length, 1);
  await db.query(`delete from admins where user_id = $1`, [SISWA]);
  await rejects(
    as('authenticated', ADMIN, `insert into admins (user_id, name, role) values ($1, 'X', 'superadmin')`, [SISWA]),
    /row-level security|superadmin/
  );
});
await test('superadmin dapat menambah & menghapus admin, tapi tidak menghapus diri sendiri', async () => {
  await as('authenticated', SUPER, `insert into admins (user_id, name) values ($1, 'Siswa')`, [SISWA]);
  const del = await as('authenticated', SUPER, `delete from admins where user_id = $1 returning user_id`, [SISWA]);
  assert.equal(del.rows.length, 1);
  const self = await as('authenticated', SUPER, `delete from admins where user_id = $1 returning user_id`, [SUPER]);
  assert.equal(self.rows.length, 0);
});

console.log('Hak akses berbasis modul & seksi bidang');
const { rows: divRows } = await db.query(`select id from divisions order by sort_order limit 1`);
const DIV = divRows[0].id;
const { rows: memRows } = await db.query(`select id from members where division_id = $1 order by id limit 1`, [DIV]);
const MEMBER = memRows[0].id;
await db.query(`insert into admins (user_id, name, email, role, member_id) values ($1, 'Sekbid', 'sekbid@osis.id', 'admin', $2)`, [SEKBID, MEMBER]);

await test('admin lama mendapat akses penuh setiap modul', async () => {
  const { rows } = await as('authenticated', ADMIN, `select public.can_access('berita', 'write') a, public.can_access('akun', 'write') b`);
  assert.deepEqual(rows[0], { a: true, b: true });
});
await test('superadmin selalu punya akses penuh', async () => {
  const { rows } = await as('authenticated', SUPER, `select public.can_access('akun', 'write') a, public.can_access('galeri', 'write') b`);
  assert.deepEqual(rows[0], { a: true, b: true });
});
await test('template awal terisi untuk setiap seksi bidang', async () => {
  const { rows } = await db.query(`select (select count(*) from division_permissions)::int n, (select count(distinct division_id) from division_permissions)::int d`);
  assert.deepEqual(rows[0], { n: 50, d: 10 });
});
await test('admin tanpa izin tidak dapat mengelola konten', async () => {
  const { rows } = await as('authenticated', SEKBID, `select public.can_access('agenda', 'read') a`);
  assert.equal(rows[0].a, false);
  await rejects(as('authenticated', SEKBID, `insert into events (title, date) values ('X', '2026-12-01')`), /row-level security/);
});
await test('template seksi bidang dapat diterapkan ke anggota admin', async () => {
  const { rows } = await as('authenticated', SUPER, `select public.apply_division_template($1) n`, [SEKBID]);
  assert.equal(rows[0].n, 5);
  const { rows: r } = await as('authenticated', SEKBID, `select public.can_access('berita', 'read') a, public.can_access('berita', 'write') b`);
  assert.deepEqual(r[0], { a: true, b: false });
  await rejects(as('authenticated', SEKBID, `insert into events (title, date) values ('X', '2026-12-01')`), /row-level security/);
});
await test('admin tidak dapat menerapkan template untuk dirinya sendiri', async () => {
  await rejects(as('authenticated', ADMIN, `select public.apply_division_template($1)`, [ADMIN]), /42501|hak akses/);
});
await test('admin berizin dapat mengubah hak akses admin lain', async () => {
  await as(
    'authenticated',
    ADMIN,
    `insert into admin_permissions (user_id, module, access) values ($1, 'agenda', 'write')
     on conflict (user_id, module) do update set access = excluded.access`,
    [SEKBID]
  );
  const { rows } = await as('authenticated', SEKBID, `select public.can_access('agenda', 'write') a`);
  assert.equal(rows[0].a, true);
  const ins = await as('authenticated', SEKBID, `insert into events (title, date, time) values ('Latihan', '2026-12-02', '09:00') returning id`);
  assert.equal(ins.rows.length, 1);
  await db.query(`delete from events where id = $1`, [ins.rows[0].id]);
});
await test('admin tidak dapat mengubah hak akses sendiri', async () => {
  const { rows } = await as('authenticated', ADMIN, `update admin_permissions set access = 'write' where user_id = $1 returning user_id`, [ADMIN]);
  assert.equal(rows.length, 0, 'baris sendiri harus tersembunyi dari RLS');
});
await test('admin biasa tidak dapat menaikkan peran menjadi superadmin', async () => {
  await rejects(as('authenticated', ADMIN, `update admins set role = 'superadmin' where user_id = $1`, [SEKBID]), /superadmin|row-level security/);
});
await test('admin biasa tidak dapat menghapus akun superadmin', async () => {
  await rejects(as('authenticated', ADMIN, `delete from admins where user_id = $1`, [SUPER]), /superadmin/);
});
await test('admin berizin dapat menautkan anggota pengurus ke akun admin', async () => {
  const { rows } = await as('authenticated', ADMIN, `update admins set member_id = $1 where user_id = $2 returning member_id`, [MEMBER, SEKBID]);
  assert.deepEqual(rows, [{ member_id: MEMBER }]);
});

console.log('Kelola anggota per seksi bidang');
const { rows: divRows2 } = await db.query(`select id from divisions order by sort_order limit 2 offset 1`);
const [DIV_A, DIV_B] = divRows2.map((d) => d.id);

await test('nama anggota contoh tanpa sufiks A/B, satu per sekbid', async () => {
  const { rows } = await db.query(
    `select count(*)::int total,
            count(*) filter (where name ~ '^Anggota Sekbid [0-9]+$')::int polos,
            count(*) filter (where name ~ '\\s[AB]$')::int bersufiks
     from members where position = 'Anggota'`
  );
  assert.deepEqual(rows[0], { total: 10, polos: 10, bersufiks: 0 });
});
await test('admin sekbid boleh menambah anggota sekbidnya sendiri', async () => {
  const ins = await as(
    'authenticated',
    SEKBID,
    `insert into members (name, position, division_id) values ('Anggota Uji', 'Anggota', $1) returning id, division_id`,
    [DIV]
  );
  assert.equal(ins.rows.length, 1);
  await db.query(`delete from members where id = $1`, [ins.rows[0].id]);
});
await test('admin sekbid tidak boleh menambah anggota sekbid lain', async () => {
  await rejects(
    as('authenticated', SEKBID, `insert into members (name, position, division_id) values ('Anggota Terobosan', 'Anggota', $1)`, [DIV_A]),
    /row-level security/
  );
  await rejects(
    as('authenticated', SEKBID, `insert into members (name, position) values ('Tanpa Sekbid', 'Anggota')`),
    /row-level security/
  );
});
await test('admin sekbid tidak dapat menghapus anggota sekbid lain', async () => {
  const { rows } = await db.query(`select id from members where division_id = $1 limit 1`, [DIV_A]);
  const del = await as('authenticated', SEKBID, `delete from members where id = $1 returning id`, [rows[0].id]);
  assert.equal(del.rows.length, 0);
  const { rows: left } = await db.query(`select id from members where id = $1`, [rows[0].id]);
  assert.equal(left.length, 1);
});
await test('superadmin tetap dapat menambah anggota di sekbid mana pun', async () => {
  const ins = await as('authenticated', SUPER, `insert into members (name, position, division_id) values ('Anggota Super', 'Anggota', $1) returning id`, [DIV_B]);
  assert.equal(ins.rows.length, 1);
  await db.query(`delete from members where id = $1`, [ins.rows[0].id]);
});

console.log('Storage');
await test('hanya admin yang dapat mengunggah ke bucket media', async () => {
  await as('authenticated', ADMIN, `insert into storage.objects (bucket_id, name) values ('media', 'a.jpg')`);
  await rejects(as('authenticated', SISWA, `insert into storage.objects (bucket_id, name) values ('media', 'b.jpg')`), /row-level security/);
  await rejects(as('anon', null, `insert into storage.objects (bucket_id, name) values ('media', 'c.jpg')`), /row-level security/);
  const { rows } = await as('anon', null, `select name from storage.objects where bucket_id = 'media'`);
  assert.equal(rows.length, 1);
});

// Skenario produksi: hanya migrasi awal yang terpasang, lalu ketiga patch
// dipakai sebagai satu-satunya cara memasang hak akses.
console.log('Skenario produksi (patch saja, tanpa migrasi hak akses)');
{
  const fresh = new PGlite();
  await fresh.exec(SUPABASE_STUB);
  await fresh.exec(read('migrations/20260927000000_init.sql'));
  await fresh.exec(read('migrations/20260927010000_rename_cabinet.sql'));
  await fresh.exec(read('migrations/20260927020000_add_tiktok_setting.sql'));
  await fresh.exec(read('migrations/20260928000000_dedupe_seed_data.sql'));
  await fresh.exec(read('seed.sql'));
  await fresh.query(`insert into auth.users (email) values ('super@osis.id'), ('admin@osis.id')`);
  await fresh.query(
    `insert into public.admins (user_id, name, email, role)
     select u.id, 'Super', u.email, 'superadmin' from auth.users u where u.email = 'super@osis.id'`
  );
  await fresh.query(
    `insert into public.admins (user_id, name, email, role)
     select u.id, 'Admin', u.email, 'admin' from auth.users u where u.email = 'admin@osis.id'`
  );

  await test('ketiga patch berhasil pada skema produksi', async () => {
    for (const f of ['patch-1-skema.sql', 'patch-2-rls.sql', 'patch-3-data.sql']) await fresh.exec(read(f));
    const { rows } = await fresh.query(
      `select (select count(*) from information_schema.columns
                where table_schema = 'public' and table_name = 'admins' and column_name = 'member_id')::int c,
              (select count(*) from public.admin_permissions)::int ap,
              (select count(*) from public.division_permissions)::int dp,
              (select count(*) from public.members)::int m`
    );
    assert.equal(rows[0].c, 1);
    assert.equal(rows[0].ap, 10, '1 admin biasa x 10 modul (superadmin tidak butuh baris izin)');
    assert.equal(rows[0].dp, 50, '10 sekbid x 5 modul');
    assert.equal(rows[0].m, 27);
  });

  await test('apply_division_template berfungsi setelah patch', async () => {
    const { rows: admins } = await fresh.query(`select user_id from public.admins where role = 'admin'`);
    const { rows: koordinator } = await fresh.query(
      `select id from public.members where name like 'Koordinator%' order by id limit 1`
    );
    await fresh.query(`update public.admins set member_id = $1 where user_id = $2`, [koordinator[0].id, admins[0].user_id]);
    // Panggil sebagai superadmin agar can_manage_access()true
    const { rows: sup } = await fresh.query(`select user_id from public.admins where role = 'superadmin'`);
    const call = await fresh.transaction(async (tx) => {
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [sup[0].user_id]);
      await tx.query(`set local role authenticated`);
      return tx.query(`select public.apply_division_template($1) as n`, [admins[0].user_id]);
    });
    assert.equal(call.rows[0].n, 5, 'template seksi bidang = 5 modul read');
    const { rows: perms } = await fresh.query(
      `select module, access from public.admin_permissions where user_id = $1 order by module`,
      [admins[0].user_id]
    );
    assert.equal(perms.length, 5);
    assert.ok(perms.every((p) => p.access === 'read'));
  });
}

console.log(`\n${passed} tes lulus${process.exitCode ? ', ada yang GAGAL' : ''}.`);
