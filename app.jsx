import { useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bus,
  CalendarDays,
  Check,
  ChevronDown,
  Coffee,
  Download,
  Eye,
  EyeOff,
  Gift,
  HardDrive,
  Heart,
  Home,
  MoreHorizontal,
  Plus,
  ShoppingBag,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";

const STORAGE_KEY = "dompet-pribadi-transactions-v1";

const CATEGORIES = [
  { name: "Transportasi", type: "expense", icon: Bus, color: "bg-sky-100 text-sky-600" },
  { name: "Makanan", type: "expense", icon: Coffee, color: "bg-orange-100 text-orange-600" },
  { name: "Belanja", type: "expense", icon: ShoppingBag, color: "bg-pink-100 text-pink-600" },
  { name: "Tagihan", type: "expense", icon: Home, color: "bg-violet-100 text-violet-600" },
  { name: "Kesehatan", type: "expense", icon: Heart, color: "bg-rose-100 text-rose-600" },
  { name: "Hiburan", type: "expense", icon: Gift, color: "bg-amber-100 text-amber-600" },
  { name: "Gaji", type: "income", icon: Wallet, color: "bg-emerald-100 text-emerald-600" },
  { name: "Bonus", type: "income", icon: Gift, color: "bg-teal-100 text-teal-600" },
  { name: "Lainnya", type: "both", icon: MoreHorizontal, color: "bg-slate-100 text-slate-600" },
];

const INITIAL_TRANSACTIONS = [
  {
    id: "seed-1",
    type: "expense",
    amount: 50000,
    category: "Transportasi",
    note: "Ojek online",
    date: "2026-11-10",
  },
  {
    id: "seed-2",
    type: "expense",
    amount: 50000,
    category: "Makanan",
    note: "Makan siang",
    date: "2026-11-10",
  },
  {
    id: "seed-3",
    type: "income",
    amount: 5000000,
    category: "Gaji",
    note: "Gaji bulanan",
    date: "2026-11-01",
  },
  {
    id: "seed-4",
    type: "expense",
    amount: 185000,
    category: "Belanja",
    note: "Kebutuhan rumah",
    date: "2026-11-04",
  },
];

const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatAmountInput = (value) => value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const isValidTransaction = (transaction) => {
  if (!transaction || typeof transaction !== "object") return false;
  const dateValue = new Date(`${transaction.date}T00:00:00`);
  return (
    (typeof transaction.id === "string" || typeof transaction.id === "number") &&
    (transaction.type === "income" || transaction.type === "expense") &&
    Number.isFinite(Number(transaction.amount)) &&
    Number(transaction.amount) > 0 &&
    typeof transaction.category === "string" &&
    typeof transaction.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(transaction.date) &&
    !Number.isNaN(dateValue.getTime()) &&
    dateValue.toISOString().startsWith(transaction.date) &&
    (transaction.note === undefined || typeof transaction.note === "string")
  );
};

const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const readTransactions = () => {
  if (typeof window === "undefined") return INITIAL_TRANSACTIONS;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return INITIAL_TRANSACTIONS;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
    console.error("Data transaksi tersimpan tidak valid; menggunakan data awal.");
  } catch (error) {
    console.error("Gagal membaca transaksi dari localStorage.", error);
  }
  return INITIAL_TRANSACTIONS;
};

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

function App() {
  const [transactions, setTransactions] = useState(readTransactions);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date(2026, 10, 1));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState("expense");
  const [amount, setAmount] = useState("");
  const amountInputRef = useRef(null);
  const backupInputRef = useRef(null);
  const [storageStatus, setStorageStatus] = useState("saved");
  const [backupMessage, setBackupMessage] = useState(null);
  const [category, setCategory] = useState("Makanan");
  const [date, setDate] = useState(() => localDateString());
  const [note, setNote] = useState("");

  const saveTransactions = (nextTransactions) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTransactions));
      setStorageStatus("saved");
      setTransactions(nextTransactions);
      return true;
    } catch (error) {
      console.error("Gagal menyimpan transaksi ke localStorage.", error);
      setStorageStatus("error");
      setTransactions(nextTransactions);
      return false;
    }
  };

  const monthTransactions = useMemo(
    () => transactions
      .filter((transaction) => transaction.date?.startsWith(monthKey(selectedMonth)))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id))),
    [transactions, selectedMonth],
  );

  const totals = useMemo(
    () => monthTransactions.reduce(
      (result, transaction) => {
        if (transaction.type === "income") result.income += Number(transaction.amount) || 0;
        else result.expense += Number(transaction.amount) || 0;
        return result;
      },
      { income: 0, expense: 0 },
    ),
    [monthTransactions],
  );

  const groupedTransactions = useMemo(() => {
    const groups = new Map();
    monthTransactions.forEach((transaction) => {
      if (!groups.has(transaction.date)) groups.set(transaction.date, []);
      groups.get(transaction.date).push(transaction);
    });
    return [...groups.entries()];
  }, [monthTransactions]);

  const displayAmount = (value) => (isPrivate ? "••••••" : formatRupiah(value));

  const changeMonth = (offset) => {
    setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const openForm = () => {
    setDate(localDateString());
    setAmount("");
    setNote("");
    setIsFormOpen(true);
  };

  const availableCategories = CATEGORIES.filter(
    (item) => item.type === formType || item.type === "both",
  );

  const handleTypeChange = (nextType) => {
    setFormType(nextType);
    const firstCategory = CATEGORIES.find(
      (item) => item.type === nextType || item.type === "both",
    );
    setCategory(firstCategory.name);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const numericAmount = Number(amount.replace(/\D/g, ""));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

    saveTransactions([
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: formType,
        amount: numericAmount,
        category,
        note: note.trim() || category,
        date,
      },
      ...transactions,
    ]);
    setIsFormOpen(false);
  };

  const handleAmountChange = (event) => {
    const input = event.currentTarget;
    const digitsBeforeCursor = input.value
      .slice(0, input.selectionStart ?? input.value.length)
      .replace(/\D/g, "").length;
    const formattedAmount = formatAmountInput(input.value);

    setAmount(formattedAmount);
    requestAnimationFrame(() => {
      const field = amountInputRef.current;
      if (!field) return;

      let digitsSeen = 0;
      let cursorPosition = 0;
      while (cursorPosition < formattedAmount.length && digitsSeen < digitsBeforeCursor) {
        if (/\d/.test(formattedAmount[cursorPosition])) digitsSeen += 1;
        cursorPosition += 1;
      }
      field.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const deleteTransaction = (id) => {
    saveTransactions(transactions.filter((transaction) => transaction.id !== id));
  };

  const downloadBackup = () => {
    try {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        transactions,
      };
      const file = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moneytrack-backup-${localDateString()}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupMessage({ type: "success", text: "Cadangan berhasil diunduh." });
    } catch (error) {
      console.error("Gagal membuat cadangan transaksi.", error);
      setBackupMessage({ type: "error", text: "Cadangan gagal dibuat. Coba lagi." });
    }
  };

  const restoreBackup = async (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      const backup = JSON.parse(await file.text());
      const restoredTransactions = Array.isArray(backup)
        ? backup
        : backup?.version === 1 && Array.isArray(backup.transactions)
          ? backup.transactions
          : null;

      if (!restoredTransactions || !restoredTransactions.every(isValidTransaction)) {
        setBackupMessage({
          type: "error",
          text: "File cadangan tidak valid atau formatnya tidak didukung.",
        });
        return;
      }

      const normalizedTransactions = restoredTransactions.map((transaction) => ({
        ...transaction,
        id: String(transaction.id),
        amount: Number(transaction.amount),
        note: transaction.note || "",
      }));
      const ids = new Set(normalizedTransactions.map((transaction) => transaction.id));
      if (ids.size !== normalizedTransactions.length) {
        setBackupMessage({ type: "error", text: "Cadangan berisi ID transaksi duplikat." });
        return;
      }

      if (
        transactions.length > 0 &&
        !window.confirm("Pulihkan cadangan? Data transaksi saat ini akan diganti.")
      ) {
        return;
      }

      const saved = saveTransactions(normalizedTransactions);
      setBackupMessage(saved
        ? {
          type: "success",
          text: `${normalizedTransactions.length} transaksi berhasil dipulihkan.`,
        }
        : {
          type: "error",
          text: "Data dipulihkan sementara, tetapi gagal disimpan oleh browser. Unduh cadangan dan periksa ruang penyimpanan.",
        });
    } catch (error) {
      console.error("Gagal membaca file cadangan.", error);
      setBackupMessage({
        type: "error",
        text: "File tidak dapat dibaca. Pastikan file cadangan berupa JSON yang valid.",
      });
    }
  };

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(selectedMonth);

  return (
    <main className="min-h-screen bg-[#fff9fb] px-4 pb-28 pt-6 font-sans text-slate-800 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-xl">
        <header className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
              <Wallet size={23} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Dompet Pribadi</p>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">Halo, Richky <span aria-hidden="true">👋</span></h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate((value) => !value)}
            aria-label={isPrivate ? "Tampilkan nominal" : "Sembunyikan nominal"}
            title={isPrivate ? "Tampilkan nominal" : "Sembunyikan nominal"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-pink-100 transition hover:text-pink-600"
          >
            {isPrivate ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </header>

        <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-pink-100/80">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
              <HardDrive size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700">
                {storageStatus === "error" ? "Penyimpanan bermasalah" : "Tersimpan di perangkat ini"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {storageStatus === "error"
                  ? "Browser gagal menyimpan data. Segera unduh cadangan dan periksa ruang penyimpanan."
                  : "Data tersimpan otomatis di browser ini. Unduh cadangan untuk memindahkan atau memulihkan data."}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2 pl-12">
            <button
              type="button"
              onClick={downloadBackup}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-600 transition hover:bg-pink-100"
            >
              <Download size={15} />
              Unduh cadangan
            </button>
            <button
              type="button"
              onClick={() => backupInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              <Upload size={15} />
              Pulihkan data
            </button>
            <input
              ref={backupInputRef}
              type="file"
              accept="application/json,.json"
              onChange={restoreBackup}
              className="hidden"
              aria-label="Pilih file cadangan MoneyTrack"
            />
          </div>
          {backupMessage && (
            <p
              role="status"
              className={`mt-3 pl-12 text-xs ${
                backupMessage.type === "error" ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {backupMessage.text}
            </p>
          )}
        </section>

        <section className="rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-rose-400 p-6 text-white shadow-xl shadow-pink-200/60 sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-medium text-white/80">Saldo bersih bulan ini</p>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white/90">
              RINGKASAN
            </span>
          </div>
          <p className="mb-7 text-3xl font-bold tracking-tight sm:text-4xl">
            {displayAmount(totals.income - totals.expense)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2 text-sm text-white/85">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-300/25">
                  <ArrowDownLeft size={16} />
                </span>
                Pemasukan
              </div>
              <p className="text-base font-bold">{displayAmount(totals.income)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2 text-sm text-white/85">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-200/25">
                  <ArrowUpRight size={16} />
                </span>
                Pengeluaran
              </div>
              <p className="text-base font-bold">{displayAmount(totals.expense)}</p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Transaksi</h2>
            <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1.5 shadow-sm ring-1 ring-pink-100">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Bulan sebelumnya"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-pink-50 hover:text-pink-600"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="min-w-[122px] text-center text-sm font-semibold capitalize text-slate-700">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Bulan berikutnya"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-pink-50 hover:text-pink-600"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {groupedTransactions.length ? (
            <div className="space-y-6">
              {groupedTransactions.map(([transactionDate, items]) => {
                const parsedDate = new Date(`${transactionDate}T00:00:00`);
                const dateLabel = new Intl.DateTimeFormat("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(parsedDate);

                return (
                  <section key={transactionDate} aria-label={dateLabel}>
                    <div className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <CalendarDays size={14} />
                      {dateLabel}
                    </div>
                    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-pink-100/80">
                      {items.map((transaction, index) => {
                        const categoryInfo = CATEGORIES.find(
                          (item) => item.name === transaction.category,
                        ) || CATEGORIES[CATEGORIES.length - 1];
                        const CategoryIcon = categoryInfo.icon;
                        const isIncome = transaction.type === "income";

                        return (
                          <article
                            key={transaction.id}
                            className={`flex items-center gap-3.5 px-4 py-4 sm:px-5 ${
                              index < items.length - 1 ? "border-b border-slate-100" : ""
                            }`}
                          >
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${categoryInfo.color}`}>
                              <CategoryIcon size={19} strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {transaction.category}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-400">
                                {transaction.note || transaction.category}
                              </p>
                            </div>
                            <p className={`whitespace-nowrap text-sm font-bold ${isIncome ? "text-emerald-600" : "text-rose-500"}`}>
                              {isPrivate ? "••••••" : `${isIncome ? "+" : "−"}${formatRupiah(Number(transaction.amount) || 0)}`}
                            </p>
                            <button
                              type="button"
                              onClick={() => deleteTransaction(transaction.id)}
                              aria-label={`Hapus transaksi ${transaction.category}`}
                              className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                            >
                              <Trash2 size={15} />
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-pink-200 bg-white/70 px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-400">
                <Wallet size={22} />
              </div>
              <p className="font-semibold text-slate-700">Belum ada transaksi</p>
              <p className="mt-1 text-sm text-slate-400">Catat transaksi pertamamu di bulan ini.</p>
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={openForm}
        aria-label="Tambah transaksi"
        className="fixed bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500 text-white shadow-lg shadow-pink-300/70 transition hover:-translate-y-0.5 hover:bg-pink-600 sm:bottom-8 sm:right-[max(2rem,calc((100vw-36rem)/2))]"
      >
        <Plus size={27} strokeWidth={2.5} />
      </button>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/35 sm:items-center sm:px-4 sm:py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsFormOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-form-title"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-[#fffdfd] px-5 pb-8 pt-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:px-7"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-500">Catat dengan mudah</p>
                <h2 id="transaction-form-title" className="mt-1 text-xl font-bold tracking-tight">
                  Transaksi baru
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Tutup formulir"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                    formType === "expense" ? "bg-white text-rose-500 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                    formType === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nominal (Rupiah)</span>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-100">
                  <span className="mr-3 font-semibold text-slate-400">Rp</span>
                  <input
                    ref={amountInputRef}
                    type="text"
                    pattern="[0-9.]*"
                    required
                    inputMode="numeric"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full border-0 bg-transparent py-3.5 text-lg font-bold outline-none placeholder:text-slate-300 focus:ring-0"
                  />
                </div>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Kategori</span>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                    >
                      {availableCategories.map((item) => (
                        <option key={item.name} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Tanggal</span>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3.5 text-sm font-medium outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Catatan <span className="font-normal text-slate-400">(opsional)</span>
                </span>
                <input
                  type="text"
                  maxLength={80}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Contoh: makan siang bersama teman"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                />
              </label>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-600"
              >
                <Check size={18} />
                Simpan transaksi
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;