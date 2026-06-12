```markdown
# 🎓 Lany Desktop

Aplikasi desktop untuk manajemen tugas dan materi perkuliahan yang terintegrasi dengan Moodle LMS. Dirancang untuk membantu mahasiswa mengelola tugas, memantau deadline, dan mengakses materi kuliah dalam satu tempat.

![Lany Desktop](https://img.shields.io/badge/Version-1.0.0-blue) ![React](https://img.shields.io/badge/React-19.2.6-61dafb) ![Electron](https://img.shields.io/badge/Electron-42.4.0-47848f) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.19-38bdf8)

---

## ✨ Fitur Utama

### 📊 Dashboard
- Statistik lengkap tugas: total tugas, sudah dikumpul, belum dikumpul, dan tugas urgent (deadline < 24 jam)
- Progress bar pengumpulan tugas
- Daftar tugas yang segera dikumpulkan (urgent)
- Daftar tugas yang sudah dikumpulkan
- Daftar semua tugas dalam 10 hari ke depan

### 📚 Daftar Mata Kuliah
- Menampilkan seluruh mata kuliah yang terdaftar di Moodle
- Tampilan kartu (card) yang informatif dengan nama dan kode mata kuliah
- Navigasi ke detail mata kuliah

### 📋 Detail Mata Kuliah
- **Daftar Tugas**: Semua tugas per mata kuliah, diurutkan berdasarkan prioritas (belum selesai → sudah lewat → selesai)
- **Materi & Dokumen**: Akses materi perkuliahan dalam format PDF dan Word
- Status badge untuk setiap tugas (Selesai, Belum Selesai, Sudah Lewat)

### ✅ Todo List (Tugas Pribadi)
- Tambah tugas pribadi dengan judul, mata kuliah/kategori, deadline, dan keterangan
- Filter tugas: Semua, Belum Selesai, Selesai
- Pencarian tugas
- Indikator visual berdasarkan urgensi deadline:
  - 🔴 Merah: < 6 jam lagi / lewat deadline
  - 🟠 Oranye: 6–12 jam lagi
  - 🟡 Kuning: 12–24 jam lagi
  - 🔵 Biru: > 24 jam lagi
- Tandai tugas selesai / belum selesai
- Hapus tugas

### 📤 Pengumpulan Tugas
- Submit tugas melalui **teks jawaban** (online text)
- Submit tugas melalui **upload file**
- Edit pengumpulan yang sudah dikirim

### 🔧 Filter Kelas
- Filter tugas berdasarkan kata kunci per mata kuliah (misal: "2c pagi", "IF2C")
- Menyembunyikan tugas yang tidak relevan dari kelas lain
- Konfigurasi filter tersimpan secara lokal

---

## 🛠️ Tech Stack

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| React | 19.2.6 | UI Library |
| Vite | 8.0.12 | Build Tool & Dev Server |
| Electron | 42.4.0 | Desktop Application Framework |
| Tailwind CSS | 3.4.19 | Utility-first CSS Framework |
| PostCSS | 8.5.15 | CSS Processing |
| Axios | 1.17.0 | HTTP Client |
| Lucide React | 1.18.0 | Icon Library |
| ESLint | 10.3.0 | Code Linting |

---

## 📁 Struktur Proyek

```
learning-app/
├── electron/                 # Electron main process
├── public/                   # Static assets
├── src/
│   ├── assets/               # Images, fonts, dll.
│   ├── App.jsx               # Komponen utama aplikasi
│   ├── App.css               # Styling komponen utama
│   ├── CourseFilterSettings.jsx  # Komponen filter kelas
│   ├── index.css             # Global styles (Tailwind)
│   └── main.jsx              # Entry point React
├── index.html                # HTML template
├── package.json              # Dependencies & scripts
├── vite.config.js            # Konfigurasi Vite
├── tailwind.config.js        # Konfigurasi Tailwind CSS
├── postcss.config.js         # Konfigurasi PostCSS
└── eslint.config.js          # Konfigurasi ESLint
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru)
- [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)

### Instalasi

1. **Clone repository:**
   ```bash
   git clone https://github.com/AdrianSA2009/learning-app.git
   cd learning-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Jalankan aplikasi (development mode):**
   ```bash
   npm run dev
   ```
   Aplikasi akan terbuka di window Electron secara otomatis.

4. **Build untuk production:**
   ```bash
   npm run build
   ```

5. **Preview build production:**
   ```bash
   npm run preview
   ```

---

## 📜 Scripts

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Menjalankan aplikasi dalam mode development dengan HMR |
| `npm run build` | Build aplikasi untuk production |
| `npm run preview` | Preview hasil build production |

---

## 🎨 UI/UX

Aplikasi ini menggunakan tema **dark mode** dengan palet warna Catppuccin Mocha:
- Background utama: `#1e1e2e`
- Card background: `#181825`
- Input background: `#11111b`
- Border: `#313244`
- Primary color: `#89b4fa` (biru)
- Text: `#cdd6f4` (terang) / `#a6adc8` (muted)

---

## 🔐 Login & Koneksi

Aplikasi ini terhubung ke server Moodle. Pengguna perlu login menggunakan kredensial Moodle mereka untuk mengakses data tugas dan materi.

> ⚠️ **Catatan Keamanan:** Form login dikirim ke Lany Assistant. Jangan bagikan password atau informasi sensitif lainnya.

---

## 📝 Lisensi

Proyek ini dibuat untuk keperluan pembelajaran.

---

## 👨‍💻 Author

**AdrianSA2009** — [GitHub](https://github.com/AdrianSA2009)

---

<div align="center">
  <sub>Dibuat menggunakan React + Electron + Tailwind CSS</sub>
</div>
```
