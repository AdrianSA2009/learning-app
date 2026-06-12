```python
import os

readme_content = """# Lany Desktop (Moodle Learning App)

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

```

```text
[file-tag: code-generated-file-readme-1]

```bash
   cd learning-app

```

2. **Instal seluruh dependensi**:
```bash
npm install

```


3. **Jalankan aplikasi (Dev Mode)**:
```bash
npm run dev

```


*(Catatan: Perintah ini akan memicu Vite untuk menjalankan server development React dan sekaligus meluncurkan jendela aplikasi Electron menggunakan `concurrently`.)*

## 📦 Build untuk Produksi

Untuk menghasilkan file *build* yang siap dieksekusi:

```bash
npm run build

```

## 📂 Struktur Direktori Utama

```text
learning-app/
├── electron/
│   ├── main.js         # Entry point untuk main process Electron.
│   ├── preload.js      # Script preload untuk mengekspos API Electron ke React secara aman (Context Isolation).
│   └── moodleAPI.js    # Modul khusus untuk berinteraksi dengan layanan REST API Moodle.
├── src/
│   ├── App.jsx         # Komponen utama React (Routing, UI, Logic Notifikasi, dsb).
│   ├── index.css       # File CSS utama, titik masuk (entry point) Tailwind CSS.
│   └── main.jsx        # Entry point frontend React.
├── public/             # Menyimpan aset statis seperti ikon aplikasi (lear.ico).
├── package.json        # Manifest proyek dan daftar skrip eksekusi.
├── tailwind.config.js  # Konfigurasi kustom untuk Tailwind CSS.
└── vite.config.js      # Konfigurasi bundler frontend.

```

## 📝 Catatan Penting

* **Kustomisasi URL Moodle**: Secara *default*, aplikasi ini disetel untuk terhubung ke E-Learning Moodle Polibatam (`https://learning-if.polibatam.ac.id`). Jika Anda ingin menggunakannya untuk universitas/institusi lain, silakan ubah variabel konstan `MOODLE_URL` yang berada di dalam file `electron/moodleAPI.js`.
* **Keamanan Token**: Aplikasi akan menyimpan sesi login dan *token authentication* secara lokal di direktori `userData` sistem Anda (`sessions.json`).
"""

with open("/mnt/data/README.md", "w", encoding="utf-8") as f:
f.write(readme_content)

print("[file-tag: code-generated-file-readme-1]")

```
File Markdown `README.md` Anda sudah siap!
[file-tag: code-generated-file-0-1781293040491559769]

Saya telah membuatkan file `README.md` yang lengkap dan terstruktur berdasarkan _source code_ dari repositori `learning-app` Anda. File ini memuat berbagai informasi penting untuk dokumentasi proyek Anda, di antaranya:

* **Deskripsi Aplikasi**: Penjelasan tentang **Lany Desktop** sebagai aplikasi e-learning berbasis Electron, Vite, React, dan Tailwind CSS.
* **Fitur Utama**: Penjelasan fitur seperti dashboard interaktif, pengumpulan tugas langsung dari aplikasi desktop, manajemen Moodle API, sistem _To-Do List_, serta push notifikasi pengingat _deadline_ (24 jam, 12 jam, 6 jam).
* **Teknologi yang Digunakan**: Daftar _tech-stack_ yang Anda gunakan di proyek ini.
* **Cara Instalasi & Build**: Panduan untuk menginstal dependensi (`npm install`) dan menjalankan aplikasi mode _development_ (`npm run dev`) serta cara _build_.
* **Struktur Direktori**: Rangkuman folder `electron/`, `src/`, dan kegunaan file utamanya.
* **Catatan Kustomisasi**: Penjelasan untuk mengubah `MOODLE_URL` di file `electron/moodleAPI.js` jika ingin digunakan pada server universitas lain selain Polibatam.

Silakan unduh file di atas dan letakkan di dalam folder *root* proyek Anda. Beritahu saya jika ada bagian dari `README.md` yang ingin diubah atau ditambahkan!

```
