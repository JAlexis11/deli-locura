const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const db = require('./server/db');

const app = express();
const PORT = process.env.PORT || 4000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'cambia-este-secreto-en-produccion';

app.use(express.json());
app.use(cookieSession({
  name: 'session',
  secret: SESSION_SECRET,
  maxAge: 12 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax'
}));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'No autorizado' });
}

function getMenu() {
  const row = db.prepare('SELECT json FROM menu_data WHERE id = 1').get();
  return JSON.parse(row.json);
}

function validateMenu(menu) {
  if (!menu || typeof menu !== 'object') return 'Formato inválido';
  if (!menu.header || typeof menu.header.title !== 'string') return 'Falta header.title';
  if (!Array.isArray(menu.sections)) return 'sections debe ser una lista';
  for (const s of menu.sections) {
    if (typeof s.id !== 'string' || typeof s.title !== 'string') return 'Cada sección necesita id y title';
    if (!Array.isArray(s.items)) return `La sección "${s.title}" necesita items`;
    if (s.type === 'menu') {
      for (const it of s.items) {
        if (typeof it.name !== 'string' || typeof it.price !== 'string') {
          return `Cada item de "${s.title}" necesita name y price`;
        }
      }
    }
  }
  if (!menu.contact || typeof menu.contact !== 'object') return 'Falta contact';
  return null;
}

// --- API pública ---
app.get('/api/menu', (req, res) => {
  res.json(getMenu());
});

app.get('/api/session', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.isAdmin) });
});

// --- Auth ---
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Falta contraseña' });

  const row = db.prepare('SELECT password_hash FROM admin WHERE id = 1').get();
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.post('/api/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Faltan datos' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });

  const row = db.prepare('SELECT password_hash FROM admin WHERE id = 1').get();
  if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin SET password_hash = ? WHERE id = 1').run(hash);
  res.json({ ok: true });
});

// --- API protegida ---
app.put('/api/menu', requireAdmin, (req, res) => {
  const menu = req.body;
  const error = validateMenu(menu);
  if (error) return res.status(400).json({ error });

  db.prepare('UPDATE menu_data SET json = ? WHERE id = 1').run(JSON.stringify(menu));
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`[deli-locura] Servidor corriendo en http://localhost:${PORT}`);
  console.log(`[deli-locura] Panel admin en http://localhost:${PORT}/admin.html`);
});
