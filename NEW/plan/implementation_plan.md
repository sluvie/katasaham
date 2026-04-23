# Implementation Plan - KataSaham

KataSaham adalah aplikasi pencatatan portofolio saham (khusus emiten Indonesia) yang fokus pada perhitungan harga rata-rata (Average Price), profitabilitas per transaksi, dan pelaporan per periode tahunan.

## User Review Required

> [!IMPORTANT]
> **Metode Closing Tahunan**: Laporan Profit/Loss di-reset per tahun transaksi, namun tersedia Global Summary untuk performa kumulatif.
> - **Dividen**: Dividen diinput secara manual per emiten dan akan otomatis menambah nilai profit berdasarkan tanggal pembagian dan jumlah kepemilikan saham di tanggal tersebut. Tersedia fitur koreksi manual.
> - **DCA Tool**: Fitur kalkulasi probabilitas/rekomendasi DCA berdasarkan perbandingan Harga Rata-rata saat ini vs Harga Pasar hari ini.
> - **Integrasi Harga (Google Sheets)**: Dukungan pengambilan harga hari ini dari Google Sheets (via CSV export) untuk mendukung keputusan DCA secara non-realtime.

## Proposed Changes

### 1. Dasar Teknologi
Aplikasi akan dibangun menggunakan **Vanilla HTML, CSS, dan Javascript** (SPA). Penyimpanan data akan diarahkan ke **PostgreSQL** untuk persistensi jangka panjang (Scripts tersedia di folder `/db`). 

> [!NOTE]
> Saat ini aplikasi menggunakan `localStorage` sebagai prototype, namun skema PostgreSQL sudah dipersiapkan untuk migrasi ke backend.

### 2. Struktur Data (Data Model)

#### `Transaction`
```typescript
interface Transaction {
  id: string;
  date: string; // ISO Format
  emiten: string; // Ticker (e.g. BBCA)
  industry: string; // E.g. Banking
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee: number;
  totalValue: number; // (quantity * price) + fee (buy) or - fee (sell)
}
```

#### `FeeSetting`
```typescript
interface FeeSetting {
  id: string;
  buyFee: number; // percentage
  sellFee: number; // percentage
  effectiveFrom: string; // ISO Date
  effectiveTo: string | null; // null if active
}
```

#### `Dividend`
```typescript
interface Dividend {
  id: string;
  emiten: string;
  cumDate: string;
  valuePerShare: number;
  totalReceived: number; // Auto-calc or manual adjust
  status: 'PENDING' | 'RECEIVED';
}
```

#### `Summary`
Data akumulasi per tahun, Dividen total, dan Global Summary.

### 3. Komponen Utama & UI/UX

#### [NEW] [Dashboard/Overview](file:///Users/sluvie/Works/SLUVIE/SAHAM/KATASAHAM/src/components/Dashboard.jsx)
- Ringkasan total aset dan total profit/loss periode berjalan.
- **Global Portfolio Summary**: Performa gabungan dari seluruh periode transaksi.
- Visualisasi alokasi industri (Pie Chart).

#### [NEW] [Transaction Entry](file:///Users/sluvie/Works/SLUVIE/SAHAM/KATASAHAM/src/components/TransactionForm.jsx)
- Form input manual untuk pembelian dan penjualan.
- Fitur auto-calculate total value berdasarkan fee.

#### [NEW] [Settings](file:///Users/sluvie/Works/SLUVIE/SAHAM/KATASAHAM/src/components/Settings.jsx)
- Pengaturan Fee berdasarkan rentang tanggal efektif.
- Manajemen daftar Emiten dan Industri.

#### [NEW] [Reports Engine](file:///Users/sluvie/Works/SLUVIE/SAHAM/KATASAHAM/src/utils/reportLogic.js)
- Logika perhitungan Average Price.
- Logika pemisahan profit per tahun serta agregasi Global Summary.

#### [NEW] [DCA Advisor](file:///Users/sluvie/Works/SLUVIE/SAHAM/KATASAHAM/src/components/DCAAdvisor.jsx)
- Input harga pasar (manual atau fetch dari GS).
- Kalkulasi simulasi Average Price baru jika melakukan pembelian tambahan.
- Indikator "Worth to DCA" (misal: jika harga pasar < Avg Price > 10%).

#### [NEW] [Dividend Tracker](file:///Users/sluvie/Works/SLUVIE/SAHAM/KATASAHAM/src/components/Dividends.jsx)
- Pencatatan jadwal Dividen.
- Integrasi ke P&L: Menambah Realized Profit secara otomatis.

#### [NEW] [Price Integration](file:///Users/sluvie/Works/SLUVIE/SAHAM/KATASAHAM/src/utils/priceFetcher.js)
- Sinkronisasi harga dari Google Sheets (Publish to Web as CSV).
- Fallback ke input manual.

## Fitur Unggulan (Premium Aesthetics)
- **Dark Mode by Default**: Tema gelap elegan dengan aksen warna hijau (profit) dan merah (loss) yang subtle.
- **Micro-interactions**: Animasi halus saat menambahkan transaksi atau berganti periode.
- **Responsive Design**: Optimal untuk desktop dan mobile browser.

## Verification Plan

### Automated Tests
- Unit test untuk `calculateAvgPrice()` dan `calculateRealizedProfit()`.
- Validasi logika fee berdasarkan tanggal transaksi.
- Validasi Global Summary vs Yearly Booking (pembukuan).

### Manual Verification
1. Input transaksi pembelian BBCA di 2025.
2. Input transaksi penjualan di 2025 (cek profit).
3. Ganti periode ke 2026.
4. Pastikan saldo saham BBCA terbawa, tapi profit 2025 sudah "dibukukan" (tidak muncul di laporan 2026).
