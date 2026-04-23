# Panduan Menjalankan KataSaham

KataSaham adalah aplikasi pelacak portofolio saham Indonesia dengan fitur kalkulasi Average Price, Dividen, dan Advisor DCA.

## 1. Persiapan Database (PostgreSQL)

Aplikasi ini telah menyediakan skema database di `/db/schema.sql`.

### Cara Setup:
1. Pastikan Anda sudah menginstal **PostgreSQL**.
2. Buat database baru bernama `katasaham`:
   ```bash
   createdb katasaham
   ```
3. Impor skema database:
   ```bash
   psql -d katasaham -f db/schema.sql
   ```
4. Database siap digunakan sebagai struktur backend di masa depan.

---

## 2. Menjalankan Aplikasi Frontend

Aplikasi ini menggunakan **Vanilla JavaScript (ES Modules)**, sehingga membutuhkan local server agar fitur `import/export` berjalan lancar.

### Opsi A: Menggunakan NPM (Rekomendasi)
Jika Anda memiliki Node.js, Anda bisa menggunakan `serve` atau runner lainnya:
1. Jalankan perintah untuk menginstal dependencies (untuk local server):
   ```bash
   npm install
   ```
2. Jalankan aplikasi:
   ```bash
   npm start
   ```
3. Buka `http://localhost:3000` di browser.

### Opsi B: Membuka Langsung via Browser
Jika Anda tidak menggunakan Node.js, gunakan ekstensi seperti **Live Server** di VS Code atau buka dengan local server apa pun yang Anda miliki. 

> [!WARNING]
> Membuka file `index.html` langsung (file://) mungkin menyebabkan error CORS pada modul JavaScript. Gunakan local server.

---

## 3. Fitur Khusus: Sinkronisasi Harga (Google Sheets)

Untuk mendapatkan harga pasar (Market Price) secara otomatis:
1. Buat Google Sheets.
2. Gunakan rumus: `=GOOGLEFINANCE("IDX:BBRI", "price")`.
3. Klik **File > Share > Publish to Web**.
4. Pilih **Whole Document** dan formatnya adalah **Comma-separated values (.csv)**.
5. Klik **Publish** dan salin link yang muncul.
6. Di aplikasi KataSaham, buka menu **Pengaturan** dan tempel link tersebut di bagian **Google Sheets CSV URL**.
7. Buka halaman **DCA Advisor** dan klik **Sinkronkan Harga**.

---

## 4. Struktur Proyek

- `/index.html`: Entry point aplikasi.
- `/style.css`: Desain dan gaya aplikasi (Premium Dark Theme).
- `/js/`: Folder logika JavaScript (Store, Logic, App, PriceFetcher).
- `/db/`: Skrip database PostgreSQL.
- `/plan/`: Dokumentasi dan rencana implementasi.
