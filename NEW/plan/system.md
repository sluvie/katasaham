# System Requirement - KataSaham

KataSaham adalah sistem pencatatan portofolio saham (IDX) yang dirancang untuk pelacakan performa per periode tahunan dengan dukungan multi-akun.

## 1. Core Portfolio & Accounting
* **Periode Tahunan**: Perhitungan Profit/Loss direalisasikan per tahun (Jan-Des). Transaksi tahun sebelumnya mempengaruhi saldo awal (Average Price) namun profitnya sudah dibukukan.
* **Kalkulasi**: Menghitung Average Price, Realized Profit, dan Turnover secara otomatis berdasarkan data transaksi.
* **Dividen**: Pencatatan dividen manual/semi-otomatis yang terintegrasi ke dalam total profit portofolio.
* **DCA Advisor**: Alat simulasi Dollar Cost Averaging berdasarkan harga pasar terkini (sinkronisasi via Google Sheets).

## 2. Multi-Account Support
* Sistem mendukung lebih dari satu akun sekuritas (pembeda akun).
* **Fee Management**: Setiap akun memiliki konfigurasi fee (Buy/Sell %) yang berbeda dengan dukungan tanggal efektif (Effective Date) untuk akurasi perhitungan histori.

## 3. Manajemen Data (Terpisah/Disendirikan)
Sesuai kebutuhan fitur terbaru, manajemen master data dikelompokkan secara mandiri:
* **Master Emiten**: Kelola ticker saham, nama perusahaan, dan sektor industri.
* **Master Account**: Kelola profil sekuritas, nama akun, dan warna tema.
* **Google Sheets Sync**: Pengaturan integrasi link CSV Google Sheets untuk penarikan harga pasar.
* **Import CSV**: Modul khusus untuk mengunggah data transaksi massal per akun.

## 4. Alur Input Transaksi & OCR
* **Input Manual**: Form standar untuk menambah transaksi beli/jual secara cepat.
* **OCR Screenshot**: 
    - Fitur ini tersedia sebagai opsi saat menambahkan transaksi.
    - User dapat mengunggah screenshot dari aplikasi sekuritas.
    - Sistem melakukan pembacaan teks (OCR) dan menampilkan hasil deteksi.
    - **Workflow Review**: User harus meninjau hasil pembacaan, melakukan koreksi jika perlu, sebelum melakukan "Posting" ke database.

## 5. Pelaporan & Analisis
* **Dashboard Global**: Ringkasan performa seluruh akun dan periode.
* **Laporan Tahunan & Bulanan**: Rekapitulasi profit dan turnover per periode.
* **Analisis Industri**: Visualisasi distribusi portofolio dan profit berdasarkan sektor industri.

---
*Terakhir diperbarui: 2026-04-26*