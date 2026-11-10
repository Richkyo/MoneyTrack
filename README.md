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
- Unduh dan pulihkan cadangan transaksi dalam format JSON.
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

Transaksi disimpan otomatis di browser dan perangkat yang sedang digunakan.
Data tidak disinkronkan ke server atau perangkat lain, sehingga tetap ada saat
situs dibuka kembali melalui browser dan alamat yang sama, tetapi dapat hilang
jika data situs/browser dihapus. Gunakan **Unduh cadangan** secara berkala dan
simpan file JSON di tempat yang aman. **Pulihkan data** akan mengganti
transaksi di browser dengan isi file cadangan.
