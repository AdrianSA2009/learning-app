Lany Desktop adalah aplikasi desktop interaktif berbasis Electron dan React yang dirancang untuk mempermudah mahasiswa dalam mengakses dan mengelola *e-learning* (berbasis Moodle, terkonfigurasi awal untuk Polibatam). Aplikasi ini memungkinkan pengguna untuk memonitor tugas, mengumpulkan file tugas, mendapatkan notifikasi tenggat waktu (deadline), dan mengelola To-Do list secara terpusat tanpa harus membuka browser web.

## ✨ Fitur Utama

- **Integrasi Moodle API**: Login langsung menggunakan akun E-Learning Moodle (mendukung penyimpanan sesi yang aman).
- **Dashboard Tugas yang Cerdas**: Menampilkan metrik tugas yang sudah dan belum dikerjakan, lengkap dengan persentase kemajuan (progress).
- **Notifikasi Desktop (Pengingat Deadline)**: Secara otomatis mengirimkan *push notification* pada OS Anda saat deadline tersisa 24 jam, 12 jam, dan 6 jam.
- **Pengumpulan Tugas Cepat**: Memungkinkan pengguna untuk mengumpulkan tugas (baik berupa unggahan file maupun entri teks) langsung dari antarmuka aplikasi.
- **Filter Mata Kuliah**: Kemampuan untuk memfilter tugas dan materi berdasarkan mata kuliah yang sedang diambil.
- **To-Do List Pribadi**: Manajemen tugas pribadi (local storage) di luar tugas Moodle untuk mencatat kegiatan harian.
- **Tema Gelap/Terang (Dark/Light Mode)**: Penyesuaian tema antarmuka sesuai preferensi pengguna.

## 🚀 Teknologi yang Digunakan

- **Frontend**: [React.js](https://reactjs.org/) di-build dengan [Vite](https://vitejs.dev/) untuk performa yang sangat cepat.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dan komponen ikon dari [Lucide React](https://lucide.dev/).
- **Desktop Engine**: [Electron.js](https://www.electronjs.org/) untuk merender aplikasi web sebagai aplikasi desktop native.
- **Backend / Integrasi**: Komunikasi IPC Electron, Node.js (`fs`, `path`), serta Axios/Fetch untuk berinteraksi dengan Moodle REST API.

## ⚙️ Prasyarat

Pastikan komputer/laptop Anda sudah terinstal:
- [Node.js](https://nodejs.org/) (Rekomendasi: Versi 18 LTS atau yang lebih baru).
- `npm` (biasanya sudah termasuk (bundled) dengan Node.js).

## 🛠️ Cara Instalasi dan Pengembangan

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di lingkungan pengembangan (development):

1. **Buka direktori proyek** di terminal Anda:
