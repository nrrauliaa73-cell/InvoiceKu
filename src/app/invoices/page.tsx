import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const idr = (n:number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: invoices, error } = await supabase.from('invoices')
    .select('id,invoice_number,status,issue_date,due_date,total_amount,customers(name)')
    .order('created_at',{ascending:false});
  return <main className="min-h-screen bg-slate-50 p-5 md:p-9"><div className="mx-auto max-w-6xl">
    <Link href="/dashboard" className="text-sm text-slate-500">← Kembali ke dashboard</Link>
    <header className="mt-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Invoice</h1><p className="mt-2 text-sm text-slate-500">Kelola tagihan untuk pelanggan.</p></div><Link href="/invoices/new" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">+ Tambah Invoice</Link></header>
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
    {error ? <p className="p-6 text-sm text-red-600">Gagal memuat invoice: {error.message}. Pastikan schema.sql sudah dijalankan di Supabase.</p> : !invoices?.length ? <div className="p-12 text-center"><h2 className="font-semibold">Belum ada invoice</h2><p className="mt-2 text-sm text-slate-500">Buat invoice pertama kamu.</p><Link href="/invoices/new" className="mt-5 inline-block rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Buat invoice</Link></div> :
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{['Nomor','Pelanggan','Tanggal','Jatuh tempo','Status','Total'].map(x=><th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr></thead><tbody>{invoices.map((inv:any)=><tr key={inv.id} className="border-t border-slate-100"><td className="px-4 py-4 font-semibold">{inv.invoice_number}</td><td className="px-4 py-4">{Array.isArray(inv.customers)?inv.customers[0]?.name:inv.customers?.name||'—'}</td><td className="px-4 py-4">{inv.issue_date}</td><td className="px-4 py-4">{inv.due_date}</td><td className="px-4 py-4">{inv.status}</td><td className="px-4 py-4 text-right font-semibold">{idr(Number(inv.total_amount))}</td></tr>)}</tbody></table></div>}
    </section></div></main>;
}
