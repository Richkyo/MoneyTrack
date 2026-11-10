# MoneyTrack

Aplikasi pencatat keuangan pribadi dengan desain mobile-first. Catat pemasukan
dan pengeluaran, lihat ringkasan bulanan, serta simpan transaksi secara lokal
di browser.

## Fitur

- Ringkasan saldo bersih, pemasukan, dan pengeluaran per bulan.
- Transaksi dikelompokkan berdasarkan tanggal.
- Tambah dan hapus transaksi dengan kategori, tanggal, nominal, dan catatan.
- Privacy mode untuk menyembunyikan nominal.
- Penyimpanan otomatis menggunakan `localStorage`.
- Tampilan responsif dengan React, Tailwind CSS, dan Lucide icons.

## Menjalankan secara lokal

Persyaratan: Node.js dan npm.

```bash
npm install
npm run dev
```

Buka URL lokal yang ditampilkan Vite di terminal.

## Pemeriksaan

```bash
npm run lint
npm run build
```

Transaksi disimpan di browser yang sedang digunakan dan tidak disinkronkan ke
server atau perangkat lain.
