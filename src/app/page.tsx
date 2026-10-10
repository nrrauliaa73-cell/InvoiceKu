import Link from 'next/link';
import { ArrowRight, FileText, ShieldCheck, Wallet } from 'lucide-react';

export default function HomePage() {
  return <main className="min-h-screen px-5 py-10 md:px-10">
    <nav className="mx-auto flex max-w-6xl items-center justify-between">
      <div className="flex items-center gap-2 text-xl font-bold"><span className="rounded-xl bg-blue-600 p-2 text-white"><FileText size={21}/></span> InvoiceKu</div>
      <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Masuk Admin</Link>
    </nav>
    <section className="mx-auto grid max-w-6xl items-center gap-12 py-20 md:grid-cols-2 md:py-28">
      <div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">SISTEM INVOICE DIGITAL</span>
        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-6xl">Tagihan bisnis, <span className="text-blue-600">lebih mudah</span> dikelola.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Buat invoice profesional, kelola pelanggan, catat pembayaran, dan pantau status tagihan dari satu tempat.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Buka aplikasi <ArrowRight size={18}/></Link><a href="#fitur" className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold">Lihat fitur</a></div>
        <div className="mt-8 flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={18} className="text-emerald-600"/> Data tersimpan di database dengan akses terkontrol</div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 md:p-7">
        <div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Ringkasan keuangan</p><h2 className="mt-1 text-xl font-bold">Dashboard invoice</h2></div><span className="rounded-lg bg-blue-50 p-3 text-blue-600"><Wallet size={22}/></span></div>
        <div className="mt-6 grid grid-cols-2 gap-3"><Stat label="Total invoice" value="—"/><Stat label="Belum dibayar" value="—"/><Stat label="Sudah dibayar" value="—"/><Stat label="Terlambat" value="—"/></div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold">Aktivitas terbaru</span><span className="text-xs text-slate-500">Contoh tampilan</span></div><div className="mt-4 space-y-3">{['Invoice pelanggan','Pembayaran diterima','Invoice baru dibuat'].map((label, i) => <div key={label} className="flex items-center gap-3"><span className="h-9 w-9 rounded-xl bg-white p-2 text-blue-600"><FileText size={20}/></span><div className="flex-1"><p className="text-sm font-medium">{label}</p><p className="text-xs text-slate-500">Akan muncul setelah data tersedia</p></div><span className="text-xs text-slate-400">—</span></div>)}</div></div>
      </div>
    </section>
    <section id="fitur" className="mx-auto max-w-6xl pb-16"><h2 className="text-center text-2xl font-bold">Fitur untuk operasional harian</h2><div className="mt-7 grid gap-4 md:grid-cols-3"><Feature title="Invoice profesional" desc="Nomor invoice, item, jatuh tempo, diskon, pajak opsional, dan PDF."/><Feature title="Data terpusat" desc="Kelola pelanggan, katalog produk/jasa, serta riwayat transaksi."/><Feature title="Pantau pembayaran" desc="Catat pembayaran penuh atau sebagian dan lihat status tagihan."/></div></section>
    <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">InvoiceKu · Sistem invoice untuk bisnis Indonesia</footer>
  </main>;
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-100 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function Feature({ title, desc }: { title: string; desc: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><span className="inline-flex rounded-xl bg-blue-50 p-2 text-blue-600"><FileText size={20}/></span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p></div>; }
