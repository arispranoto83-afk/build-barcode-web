const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'barcodes.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ items: [] }, null, 2));

app.use(express.json({ limit: '1mb' }));

function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed : { items: [] };
  } catch {
    return { items: [] };
  }
}

function writeDb(db) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_FILE);
}

function generateShortCode() {
  return crypto.randomBytes(4).toString('base64url').slice(0, 6).toLowerCase();
}

// PWA Manifest & Service Worker headers
app.get('/manifest.webmanifest', (req, res) => {
  res.type('application/manifest+json');
  res.sendFile(path.join(__dirname, 'public', 'manifest.webmanifest'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Service-Worker-Allowed', '/');
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'url2code-pwa-fullstack', timestamp: new Date().toISOString() });
});

app.get('/api/barcodes', (req, res) => {
  const db = readDb();
  const totalScans = db.items.reduce((sum, item) => sum + (item.scans || 0), 0);
  res.json({ items: db.items, totalSaved: db.items.length, totalScans });
});

app.post('/api/barcodes', (req, res) => {
  const { url, mode = 'qr', caption = '' } = req.body || {};
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'URL wajib diisi.' });
  }
  const cleanUrl = url.trim();
  const cleanMode = mode === 'barcode' ? 'barcode' : 'qr';
  const db = readDb();

  const existingIdx = db.items.findIndex((it) => it.url === cleanUrl && it.mode === cleanMode);
  let scans = 0;
  let shortCode = generateShortCode();
  if (existingIdx !== -1) {
    scans = db.items[existingIdx].scans || 0;
    shortCode = db.items[existingIdx].shortCode || shortCode;
    db.items.splice(existingIdx, 1);
  }

  const record = {
    id: crypto.randomUUID(),
    url: cleanUrl,
    mode: cleanMode,
    caption: String(caption || '').slice(0, 80),
    shortCode,
    scans,
    createdAt: new Date().toISOString(),
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };

  db.items.unshift(record);
  if (db.items.length > 100) db.items.pop();
  writeDb(db);
  res.status(201).json({ item: record });
});

app.delete('/api/barcodes/:id', (req, res) => {
  const db = readDb();
  const before = db.items.length;
  db.items = db.items.filter((it) => it.id !== req.params.id);
  writeDb(db);
  res.json({ deleted: before - db.items.length });
});

app.delete('/api/barcodes', (req, res) => {
  writeDb({ items: [] });
  res.json({ cleared: true });
});

// Short-link Redirector & Scan Counter
app.get('/r/:shortCode', (req, res) => {
  const db = readDb();
  const item = db.items.find((it) => it.shortCode === req.params.shortCode);
  if (!item) {
    return res.status(404).send('Tautan pendek tidak ditemukan.');
  }
  item.scans = (item.scans || 0) + 1;
  writeDb(db);
  res.redirect(302, item.url);
});

// Static PWA Frontend
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`URL2Code PWA Full-Stack berjalan di http://localhost:${PORT}`);
});
