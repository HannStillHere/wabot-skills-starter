# ⚡ Wabot Skills Starter

> **Modern, Lightweight & Modular WhatsApp Bot Template** powered by [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys).  
> **100% Non-AI & Zero API Keys Required.** Clone, install, and run out-of-the-box on Windows, Linux VPS, or Android Termux.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-blue.svg)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-Multi--Device-orange.svg)](https://github.com/WhiskeySockets/Baileys)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/HannStillHere/wabot-skills-starter/pulls)

---

## 🌟 Mengapa Memilih Template Ini?

* 🚫 **Zero API Keys & 100% Gratis**: Tidak membutuhkan kunci API berbayar atau langganan apa pun. Semua fitur cuaca, kripto, Al-Qur'an, kamus, dan downloader berjalan dengan API publik bebas autentikasi.
* 🧩 **Plug-and-Play Skill Architecture**: Ingin menambah fitur baru? Cukup buat 1 file `.js` di dalam folder `skills/`, bot akan langsung memuat perintah tersebut secara otomatis tanpa perlu mengubah core server.
* 🎨 **In-Memory WebP Sticker Engine**: Pembuatan stiker super cepat menggunakan library native C++ `sharp` dan `node-webpmux` dengan metadata EXIF kustom (Packname & Author).
* 🌐 **Dual QR Code Pairing**: QR Code otomatis muncul di terminal (CLI) **DAN** di halaman web lokal (`http://localhost:3000`) untuk memudahkan scan pada VPS tanpa GUI (headless).
* 🛡️ **Anti-Crash & Robust**: Penanganan unwrap pesan mendalam untuk pesan sekali lihat (*view-once*), pesan terenkripsi sementara (*ephemeral*), dan dokumen gambar.

---

## 📋 Daftar Fitur & Skill Bawaan

| Kategori | Perintah | Deskripsi |
|---|---|---|
| **🎨 Stiker & Grafis** | `.s` / `.stiker` | Konversi gambar/video/dokumen ke stiker WebP dengan EXIF metadata |
| | `.toimg` | Mengembalikan stiker menjadi gambar normal (PNG/JPEG) |
| | `.brat <teks>` | Generator stiker teks aesthetic Brat typography dengan blur |
| | `.emojimix <e1><e2>` | Menggabungkan 2 emoji menjadi stiker Google Kitchen |
| **📥 Media Downloader** | `.tiktok <url>` | Unduh video TikTok kualitas HD tanpa watermark |
| | `.ytmp3 <url>` | Unduh audio lagu dari YouTube / platform media |
| | `.dl <url>` | Deteksi dan unduh media otomatis dari tautan |
| **👥 Manajemen Grup** | `.tagall <pesan>` | Mention seluruh anggota grup dengan pesan khusus |
| | `.hidetag <pesan>` | Kirim pesan broadcast invisible mention ke semua anggota |
| | `.kick @user` | Mengeluarkan anggota dari grup (memerlukan hak admin) |
| | `.promote` / `.demote` | Mengangkat atau mencopot hak akses Admin grup |
| | `.group open / close` | Membuka atau menutup perizinan chat grup |
| | `.del` / `.hapus` | Menghapus pesan bot atau anggota (reply deletion) |
| **🛠️ Utility & Info** | `.cuaca <kota>` | Prakiraan cuaca global real-time (Open-Meteo) |
| | `.kripto <coin>` | Harga aset kripto live dalam USD & IDR (CoinGecko) |
| | `.kurs <mata_uang>` | Kurs mata uang dunia terhadap Rupiah IDR (Frankfurter) |
| | `.quran <surah:ayat>` | Teks Arab & terjemahan ayat suci Al-Qur'an |
| | `.arti <kata>` | Definisi kamus kata bahasa Inggris/Indonesia |
| | `.tts <teks>` | Mengubah teks menjadi audio Voice Note WhatsApp |
| **🎮 Game & Interaktif** | `.afk <alasan>` | Menandai status AFK (otomatis alert saat di-tag) |
| | `.pilih <opsi1 \| opsi2>` | Bot memilihkan salah satu opsi secara acak |
| | `.rate <sesuatu>` | Rating persentase 1-100% terhadap suatu hal |
| | `.kuis` & `.jawab` | Kuis asah otak dengan petunjuk huruf (*clue*) & timer |
| **⚙️ Sistem & Menu** | `.menu` / `.help` | Menampilkan menu interaktif yang dibuat otomatis dari modul |
| | `.ping` | Menguji latensi respon bot dalam milidetik (ms) |
| | `.sysinfo` | Informasi penggunaan RAM, platform OS, dan waktu aktif |

---

## 🚀 Panduan Instalasi Cepat

### 1. Prasyarat
Pastikan komputer atau server Anda sudah terpasang **Node.js versi 18 atau lebih baru**.
* Cek versi Node.js: `node -v`

### 2. Clone Repositori & Install Dependensi
```bash
# Clone repositori ini
git clone https://github.com/HannStillHere/wabot-skills-starter.git

# Masuk ke folder proyek
cd wabot-skills-starter

# Install seluruh dependensi yang diperlukan
npm install
```

### 3. Konfigurasi Bot
Salin file konfigurasi contoh menjadi `config.json`:
```bash
# Di Windows PowerShell / CMD:
copy config.example.json config.json

# Di Linux / MacOS / Termux:
cp config.example.json config.json
```

Buka `config.json` dan sesuaikan nilainya:
```json
{
  "botName": "Wabot Starter",
  "ownerName": "Nama Anda",
  "ownerNumber": "628xxxxxxxxxx",
  "prefix": ".",
  "packname": "Wabot Skills Starter",
  "author": "Hann.67",
  "port": 3000,
  "autoRead": false
}
```

### 4. Jalankan Bot
```bash
npm start
```
* **Scan QR Terminal**: Scan kode QR yang muncul langsung di terminal Anda menggunakan menu **Perangkat Tertaut** di WhatsApp.
* **Scan QR Web**: Bila menjalankan di VPS tanpa layar, buka browser Anda di `http://IP_VPS:3000` untuk melihat dan men-scan kode QR secara visual.

---

## 🧩 Cara Membuat Skill Baru (Plug & Play)

Anda dapat memperluas kemampuan bot ini tanpa menyentuh file utama (`index.js`). Cukup tambahkan berkas baru di dalam folder `skills/`.

Contoh membuat file `skills/halo.js`:
```javascript
export default {
  name: "Halo Dunia",
  category: "utility",
  commands: ["halo", "hi", "sapa"],
  description: "Menyapa pengguna yang mengirim perintah",
  run: async ({ sock, m, args, senderName, remoteJid }) => {
    await sock.sendMessage(
      remoteJid,
      { text: `Halo @${senderName}! Senang bertemu denganmu 👋` },
      { quoted: m }
    );
  }
};
```
Simpan file tersebut dan restart bot, perintah `.halo` akan langsung aktif dan otomatis terdaftar di menu!

---

## 📁 Struktur Direktori

```text
wabot-skills-starter/
├── config.example.json     # Contoh file konfigurasi bot
├── index.js                # Core socket Baileys & dynamic skill loader
├── package.json            # Daftar dependensi Node.js
├── lib/
│   ├── exif.js             # Inject metadata EXIF stiker WhatsApp
│   ├── helpers.js          # Pembantu unwrap message & permission grup
│   └── public_apis.js      # Modul API publik gratis tanpa otentikasi
└── skills/                 # Koleksi skill modular (Plug-and-Play)
    ├── downloader.js       # Fitur unduhan media
    ├── games.js            # Permainan dan status AFK
    ├── group.js            # Moderasi grup WhatsApp
    ├── sticker.js          # Generator stiker, Brat, dan Emojimix
    ├── system.js           # Sistem informasi dan menu dinamis
    └── tools.js            # Kumpulan alat utilitas publik
```

---

## 🤝 Berkontribusi

Kontribusi dari komunitas sangat terbuka! Jika Anda memiliki skill baru yang bermanfaat (non-AI), silakan buat *Pull Request* atau laporkan ide di tab *Issues*.

1. *Fork* repositori ini
2. Buat branch fitur baru (`git checkout -b fitur/skill-keren`)
3. *Commit* perubahan Anda (`git commit -m 'Menambahkan skill baru'`)
4. *Push* ke branch Anda (`git push origin fitur/skill-keren`)
5. Buat *Pull Request* baru

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT License](LICENSE). Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan pribadi maupun komersial.

Dibuat dengan ❤️ oleh [HannStillHere](https://github.com/HannStillHere).
