import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import db, { DATA_DIR } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || getOrCreateSecret();
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function getOrCreateSecret() {
  const f = path.join(DATA_DIR, '.jwt_secret');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const s = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(f, s);
  return s;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// ---------- Helpers ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error('Hanya file gambar (png, jpg, webp, gif) yang diizinkan'), ok);
  },
});

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Silakan login terlebih dahulu' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesi berakhir, silakan login ulang' });
  }
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function pick(obj, fields) {
  const out = {};
  for (const f of fields) if (obj[f] !== undefined) out[f] = obj[f] === '' ? null : obj[f];
  return out;
}

/**
 * Router CRUD generik untuk admin.
 */
function crudRouter(table, fields, { orderBy = 'id DESC', required = [], beforeSave } = {}) {
  const r = express.Router();
  r.get('/', (_req, res) => res.json(db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all()));
  r.get('/:id', (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    row ? res.json(row) : res.status(404).json({ error: 'Data tidak ditemukan' });
  });
  r.post('/', (req, res) => {
    let data = pick(req.body, fields);
    for (const f of required) if (!data[f]) return res.status(400).json({ error: `Kolom "${f}" wajib diisi` });
    if (beforeSave) data = beforeSave(data, null);
    const keys = Object.keys(data);
    const info = db
      .prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`)
      .run(...keys.map((k) => data[k]));
    res.status(201).json(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid));
  });
  r.put('/:id', (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Data tidak ditemukan' });
    let data = pick(req.body, fields);
    if (beforeSave) data = beforeSave(data, existing);
    const keys = Object.keys(data);
    if (keys.length) {
      db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(
        ...keys.map((k) => data[k]),
        req.params.id
      );
    }
    res.json(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id));
  });
  r.delete('/:id', (req, res) => {
    const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    info.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Data tidak ditemukan' });
  });
  return r;
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  try {
    s.missions = JSON.parse(s.missions || '[]');
  } catch {
    s.missions = [];
  }
  return s;
}

// ---------- Public API ----------
const api = express.Router();

api.get('/health', (_req, res) => res.json({ ok: true }));

api.get('/settings', (_req, res) => res.json(getSettings()));

api.get('/home', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    settings: getSettings(),
    stats: {
      members: db.prepare('SELECT COUNT(*) c FROM members').get().c,
      divisions: db.prepare('SELECT COUNT(*) c FROM divisions').get().c,
      programs: db.prepare('SELECT COUNT(*) c FROM programs').get().c,
      aspirations_done: db.prepare("SELECT COUNT(*) c FROM aspirations WHERE status = 'selesai'").get().c,
    },
    core: db.prepare('SELECT * FROM members WHERE is_core = 1 ORDER BY sort_order, id LIMIT 3').all(),
    posts: db.prepare('SELECT id,title,slug,excerpt,cover,category,created_at FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT 3').all(),
    events: db.prepare('SELECT * FROM events WHERE date >= ? ORDER BY date, time LIMIT 4').all(today),
    programs: db.prepare(`SELECT p.*, d.short division_short FROM programs p LEFT JOIN divisions d ON d.id = p.division_id WHERE p.status = 'berjalan' ORDER BY p.progress DESC LIMIT 4`).all(),
  });
});

api.get('/structure', (_req, res) => {
  const divisions = db.prepare('SELECT * FROM divisions ORDER BY sort_order, id').all();
  const members = db.prepare('SELECT * FROM members ORDER BY sort_order, id').all();
  res.json({
    core: members.filter((m) => m.is_core),
    divisions: divisions.map((d) => ({ ...d, members: members.filter((m) => m.division_id === d.id && !m.is_core) })),
  });
});

api.get('/divisions', (_req, res) => res.json(db.prepare('SELECT * FROM divisions ORDER BY sort_order, id').all()));

api.get('/programs', (_req, res) => {
  res.json(
    db.prepare(`SELECT p.*, d.name division_name, d.short division_short
                FROM programs p LEFT JOIN divisions d ON d.id = p.division_id
                ORDER BY d.sort_order, p.start_date`).all()
  );
});

api.get('/posts', (req, res) => {
  const { q = '', category = '', page = 1, limit = 9 } = req.query;
  const lim = Math.min(Number(limit) || 9, 50);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * lim;
  const where = ['published = 1'];
  const params = [];
  if (q) { where.push('(title LIKE ? OR excerpt LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (category) { where.push('category = ?'); params.push(category); }
  const w = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) c FROM posts WHERE ${w}`).get(...params).c;
  const items = db
    .prepare(`SELECT id,title,slug,excerpt,cover,category,author,created_at,views FROM posts WHERE ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, lim, offset);
  const categories = db.prepare('SELECT DISTINCT category FROM posts WHERE published = 1').all().map((r) => r.category);
  res.json({ items, total, page: Number(page), pages: Math.max(1, Math.ceil(total / lim)), categories });
});

api.get('/posts/:slug', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE slug = ? AND published = 1').get(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Berita tidak ditemukan' });
  db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id);
  const related = db
    .prepare('SELECT id,title,slug,cover,created_at FROM posts WHERE published = 1 AND id != ? ORDER BY created_at DESC LIMIT 3')
    .all(post.id);
  res.json({ ...post, related });
});

api.get('/events', (_req, res) => res.json(db.prepare('SELECT * FROM events ORDER BY date, time').all()));
api.get('/gallery', (_req, res) => res.json(db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all()));

// Aspirasi: kirim & lacak
const aspirationRate = new Map();
api.post('/aspirations', (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const hits = (aspirationRate.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (hits.length >= 5) return res.status(429).json({ error: 'Terlalu banyak kiriman. Coba lagi beberapa menit lagi.' });
  hits.push(now);
  aspirationRate.set(ip, hits);

  const { name, class_name, category = 'Umum', message, anonymous } = req.body || {};
  if (!message || String(message).trim().length < 10)
    return res.status(400).json({ error: 'Pesan aspirasi minimal 10 karakter' });
  if (String(message).length > 2000) return res.status(400).json({ error: 'Pesan maksimal 2000 karakter' });
  const anon = anonymous ? 1 : 0;
  const ticket = 'ASP-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  db.prepare('INSERT INTO aspirations (ticket, name, class_name, category, message, anonymous) VALUES (?,?,?,?,?,?)').run(
    ticket,
    anon ? null : String(name || '').slice(0, 100) || null,
    anon ? null : String(class_name || '').slice(0, 20) || null,
    String(category).slice(0, 50),
    String(message).trim(),
    anon
  );
  res.status(201).json({ ticket });
});

api.get('/aspirations/track/:ticket', (req, res) => {
  const row = db
    .prepare('SELECT ticket, category, message, status, response, created_at, updated_at FROM aspirations WHERE ticket = ?')
    .get(String(req.params.ticket).toUpperCase().trim());
  row ? res.json(row) : res.status(404).json({ error: 'Kode tiket tidak ditemukan' });
});

api.get('/aspirations/public', (_req, res) => {
  res.json(
    db.prepare(`SELECT ticket, category, message, status, response, updated_at FROM aspirations
                WHERE status = 'selesai' AND response IS NOT NULL ORDER BY updated_at DESC LIMIT 6`).all()
  );
});

// ---------- Auth ----------
api.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
  if (!user || !bcrypt.compareSync(password || '', user.password_hash))
    return res.status(401).json({ error: 'Username atau password salah' });
  const token = jwt.sign({ id: user.id, username: user.username, name: user.name, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

api.get('/auth/me', auth, (req, res) => res.json(req.user));

api.post('/auth/password', auth, (req, res) => {
  const { current, next } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(current || '', user.password_hash))
    return res.status(400).json({ error: 'Password lama salah' });
  if (!next || next.length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), user.id);
  res.json({ ok: true });
});

// ---------- Admin API ----------
const admin = express.Router();
admin.use(auth);

admin.get('/dashboard', (_req, res) => {
  const count = (sql) => db.prepare(sql).get().c;
  res.json({
    counts: {
      posts: count('SELECT COUNT(*) c FROM posts'),
      members: count('SELECT COUNT(*) c FROM members'),
      programs: count('SELECT COUNT(*) c FROM programs'),
      events: count('SELECT COUNT(*) c FROM events'),
      gallery: count('SELECT COUNT(*) c FROM gallery'),
      aspirations: count('SELECT COUNT(*) c FROM aspirations'),
      aspirations_new: count("SELECT COUNT(*) c FROM aspirations WHERE status = 'baru'"),
    },
    program_status: db.prepare('SELECT status, COUNT(*) c FROM programs GROUP BY status').all(),
    latest_aspirations: db.prepare('SELECT * FROM aspirations ORDER BY created_at DESC LIMIT 5').all(),
    upcoming_events: db
      .prepare('SELECT * FROM events WHERE date >= ? ORDER BY date LIMIT 5')
      .all(new Date().toISOString().slice(0, 10)),
  });
});

admin.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

admin.put('/settings', (req, res) => {
  const up = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction((obj) => {
    for (const [k, v] of Object.entries(obj)) {
      if (!/^[a-z_]+$/.test(k)) continue;
      up.run(k, Array.isArray(v) ? JSON.stringify(v) : v == null ? '' : String(v));
    }
  });
  tx(req.body || {});
  res.json(getSettings());
});

admin.use(
  '/posts',
  crudRouter('posts', ['title', 'slug', 'excerpt', 'content', 'cover', 'category', 'author', 'published', 'created_at'], {
    orderBy: 'created_at DESC',
    required: ['title'],
    beforeSave: (d, existing) => {
      if (d.title || d.slug) {
        const base = slugify(d.slug || d.title || existing?.title) || 'berita';
        let slug = base;
        let i = 2;
        while (db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(slug, existing?.id ?? -1)) slug = `${base}-${i++}`;
        d.slug = slug;
      }
      if (d.published !== undefined) d.published = d.published ? 1 : 0;
      return d;
    },
  })
);
admin.use(
  '/members',
  crudRouter('members', ['name', 'position', 'class_name', 'division_id', 'is_core', 'photo', 'instagram', 'quote', 'sort_order'], {
    orderBy: 'is_core DESC, division_id, sort_order, id',
    required: ['name', 'position'],
    beforeSave: (d) => {
      if (d.is_core !== undefined) d.is_core = d.is_core ? 1 : 0;
      return d;
    },
  })
);
admin.use('/divisions', crudRouter('divisions', ['name', 'short', 'description', 'icon', 'sort_order'], { orderBy: 'sort_order, id', required: ['name'] }));
admin.use(
  '/programs',
  crudRouter('programs', ['title', 'description', 'division_id', 'target', 'start_date', 'end_date', 'status', 'progress'], {
    orderBy: 'start_date DESC',
    required: ['title'],
  })
);
admin.use('/events', crudRouter('events', ['title', 'description', 'date', 'time', 'location', 'category'], { orderBy: 'date DESC', required: ['title', 'date'] }));
admin.use('/gallery', crudRouter('gallery', ['title', 'image', 'album'], { orderBy: 'created_at DESC', required: ['image'] }));
admin.use(
  '/aspirations',
  crudRouter('aspirations', ['status', 'response'], {
    orderBy: 'created_at DESC',
    beforeSave: (d) => ({ ...d, updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19) }),
  })
);

// Manajemen admin (khusus superadmin)
admin.get('/users', (_req, res) => res.json(db.prepare('SELECT id, username, name, role, created_at FROM users').all()));
admin.post('/users', (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Hanya superadmin' });
  const { username, password, name, role = 'admin' } = req.body || {};
  if (!username || !password || !name) return res.status(400).json({ error: 'Lengkapi username, password, dan nama' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  try {
    const info = db
      .prepare('INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)')
      .run(username, bcrypt.hashSync(password, 10), name, role === 'superadmin' ? 'superadmin' : 'admin');
    res.status(201).json({ id: info.lastInsertRowid, username, name, role });
  } catch {
    res.status(400).json({ error: 'Username sudah digunakan' });
  }
});
admin.delete('/users/:id', (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Hanya superadmin' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

api.use('/admin', admin);
app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));

// ---------- Frontend (hasil build) ----------
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^(?!\/(api|uploads)\/).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 400).json({ error: err.message || 'Terjadi kesalahan' });
});

app.listen(PORT, HOST, () => console.log(`OSIS SMAN 3 Rembang berjalan di http://${HOST}:${PORT}`));
