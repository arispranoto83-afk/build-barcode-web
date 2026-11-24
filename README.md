# URL2Code — Aplikasi PWA Full-Stack (URL ke QR & Barcode)

Aplikasi Progressive Web App (PWA) full-stack untuk mengubah alamat halaman web menjadi **QR Code** (siap scan langsung dengan kamera bawaan Android & iPhone) dan **Barcode 1D (Code 128)**, lengkap dengan ikon futuristik, dukungan offline (Service Worker), Web Share Target, serta backend **Node.js + Express REST API** dengan pelacak scan short-link (`/r/:shortCode`).

## Struktur Proyek

- `server.js` — Backend Express REST API (`/api/barcodes`, `/api/health`, `/r/:shortCode`) dan penyimpanan data persisten `data/barcodes.json`.
- `public/index.html` — Antarmuka PWA responsif dengan encoder QR ISO/IEC 18004 & Code 128B bawaan.
- `public/manifest.webmanifest` — Manifest PWA lengkap (ikon 192px & 512px, `display: standalone`, `share_target`).
- `public/sw.js` — Service Worker untuk caching aset statis dan dukungan mode offline.
- `public/icons/` — Ikon aplikasi futuristik (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).

## Cara Menjalankan

```bash
npm install
npm start
```

Buka `http://localhost:3000` di browser (atau deploy ke layanan HTTPS seperti Render, Railway, Fly.io, atau VPS agar dapat diinstal langsung sebagai PWA di HP Android/iOS).
