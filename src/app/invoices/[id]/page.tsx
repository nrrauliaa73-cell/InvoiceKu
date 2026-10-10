'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Invoice = {id:string;invoice_number:string;status:string;issue_date:string;due_date:string;currency:string;subtotal:number;discount_amount:number;tax_rate:number;tax_amount:number;total_amount:number;notes:string;terms:string;customer_id:string};
type Customer = {name:string;email:string;phone:string;address:string;tax_number:string};
type Item = {id:string;description:string;quantity:number;unit:string;unit_price:number;line_total:number};
type Profile = {company_name:string;full_name:string;company_email:string;company_phone:string;company_address:string;tax_number:string;bank_name:string;bank_account_name:string;bank_account_number:string};
const idr=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
const dateId=(s:string)=>s?new Date(`${s}T00:00:00`).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}):'—';
const statusLabel:Record<string,string>={draft:'Draft',sent:'Terkirim',partial:'Dibayar sebagian',paid:'Lunas',overdue:'Terlambat',cancelled:'Dibatalkan'};

export default function InvoiceDetailPage(){
 const params=useParams<{id:string}>(); const router=useRouter(); const supabase=useMemo(()=>createClient(),[]);
 const [invoice,setInvoice]=useState<Invoice|null>(null);const [customer,setCustomer]=useState<Customer|null>(null);const [items,setItems]=useState<Item[]>([]);const [profile,setProfile]=useState<Profile|null>(null);
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user){router.replace('/login');return}
  const {data:inv,error:invError}=await supabase.from('invoices').select('id,invoice_number,status,issue_date,due_date,currency,subtotal,discount_amount,tax_rate,tax_amount,total_amount,notes,terms,customer_id').eq('id',params.id).single();
  if(invError||!inv){setError(invError?.message||'Invoice tidak ditemukan atau kamu tidak memiliki akses.');setLoading(false);return}
  const [{data:c,error:ce},{data:it,error:ite},{data:p}]=await Promise.all([
   supabase.from('customers').select('name,email,phone,address,tax_number').eq('id',inv.customer_id).single(),
   supabase.from('invoice_items').select('id,description,quantity,unit,unit_price,line_total').eq('invoice_id',inv.id).order('created_at',{ascending:true}),
   supabase.from('profiles').select('company_name,full_name,company_email,company_phone,company_address,tax_number,bank_name,bank_account_name,bank_account_number').eq('id',user.id).maybeSingle()
  ]);
  if(ce){setError(`Data pelanggan gagal dimuat: ${ce.message}`);setLoading(false);return}
  if(ite){setError(`Rincian invoice gagal dimuat: ${ite.message}`);setLoading(false);return}
  setInvoice(inv as Invoice);setCustomer(c as Customer);setItems((it||[]) as Item[]);setProfile(p as Profile|null);setLoading(false);
 },[params.id,router,supabase]);
 useEffect(()=>{void load()},[load]);

 function downloadPdf(){
  if(!invoice||!customer)return;
  void import('jspdf').then(({jsPDF})=>{
   const doc=new jsPDF({unit:'mm',format:'a4'});const left=18;const right=192;let y=20;
   const line=(yy:number)=>{doc.setDrawColor(220,225,232);doc.line(left,yy,right,yy)};
   const company=profile?.company_name||profile?.full_name||'Perusahaan Anda';
   doc.setFont('helvetica','bold');doc.setFontSize(20);doc.setTextColor(30,64,175);doc.text('INVOICE',left,y);
   doc.setFontSize(10);doc.setTextColor(30,41,59);doc.text(company,left, y+9);
   doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(90,100,115);
   let cy=y+14;
   for(const s of [profile?.company_address,profile?.company_email,profile?.company_phone,profile?.tax_number?`NPWP: ${profile.tax_number}`].filter(Boolean)){doc.text(String(s),left,cy);cy+=4.5}
   doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(30,41,59);doc.text(`No. ${invoice.invoice_number}`,right,29,{align:'right'});
   doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(`Tanggal: ${dateId(invoice.issue_date)}`,right,35,{align:'right'});doc.text(`Jatuh tempo: ${dateId(invoice.due_date)}`,right,40,{align:'right'});doc.text(`Status: ${statusLabel[invoice.status]||invoice.status}`,right,45,{align:'right'});
   y=Math.max(cy+7,58);line(y);y+=8;
   doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('TAGIHAN KEPADA',left,y);y+=6;doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(customer.name,left,y);y+=5;
   for(const s of [customer.address,customer.email,customer.phone,customer.tax_number?`NPWP: ${customer.tax_number}`].filter(Boolean)){doc.setFontSize(9);doc.text(String(s),left,y);y+=4.5}
   y+=5;line(y);y+=7;
   doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('DESKRIPSI',left,y);doc.text('QTY',124,y,{align:'right'});doc.text('HARGA',158,y,{align:'right'});doc.text('JUMLAH',right,y,{align:'right'});y+=4;line(y);y+=6;
   doc.setFont('helvetica','normal');doc.setFontSize(9);
   for(const item of items){
    const lines=doc.splitTextToSize(item.description,85) as string[];
    if(y+Math.max(lines.length*4.5,7)>270){doc.addPage();y=20}
    doc.text(lines,left,y);doc.text(String(Number(item.quantity)),124,y,{align:'right'});doc.text(idr(Number(item.unit_price)),158,y,{align:'right'});doc.text(idr(Number(item.line_total)),right,y,{align:'right'});y+=Math.max(lines.length*4.5,7);line(y-2);y+=3;
   }
   y+=3;const totalRows=[['Subtotal',idr(Number(invoice.subtotal))],['Diskon',`− ${idr(Number(invoice.discount_amount))}`],[`Pajak (${Number(invoice.tax_rate)||0}%)`,idr(Number(invoice.tax_amount))],['TOTAL',idr(Number(invoice.total_amount))]];
   for(const [label,value] of totalRows){doc.setFont('helvetica',label==='TOTAL'?'bold':'normal');doc.setFontSize(label==='TOTAL'?11:9);doc.text(label,left+105,y);doc.text(value,right,y,{align:'right'});y+=6}
   if(invoice.notes){y+=5;doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('Catatan',left,y);y+=5;doc.setFont('helvetica','normal');doc.text(doc.splitTextToSize(invoice.notes,170),left,y)}
   if(profile?.bank_name||profile?.bank_account_number){y+=15;doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('Informasi pembayaran',left,y);y+=5;doc.setFont('helvetica','normal');for(const s of [profile.bank_name,profile.bank_account_name,profile.bank_account_number].filter(Boolean)){doc.text(String(s),left,y);y+=4.5}}
   doc.save(`${invoice.invoice_number}.pdf`);
  });
 }
 if(loading)return <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">Memuat detail invoice…</main>;
 if(error||!invoice||!customer)return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-6"><p className="text-red-700">{error||'Invoice tidak ditemukan.'}</p><Link href="/invoices" className="mt-4 inline-block text-blue-700">← Kembali ke daftar invoice</Link></div></main>;
 return <main className="min-h-screen bg-slate-50 p-4 md:p-8 print:bg-white print:p-0"><style jsx global>{`@media print{body{background:white!important}.no-print{display:none!important}.invoice-paper{box-shadow:none!important;border:0!important;margin:0!important;max-width:none!important}.invoice-paper *{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`}</style>
  <div className="no-print mx-auto mb-5 flex max-w-4xl flex-wrap items-center justify-between gap-3"><Link href="/invoices" className="text-sm text-slate-500 hover:text-slate-900">← Kembali ke invoice</Link><div className="flex flex-wrap gap-2"><button onClick={()=>window.print()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Cetak</button><button onClick={downloadPdf} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Unduh PDF</button></div></div>
  <article className="invoice-paper mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-12">
   <div className="flex flex-wrap justify-between gap-8 border-b border-slate-200 pb-7"><div><p className="text-sm font-bold tracking-widest text-blue-700">INVOICE</p><h1 className="mt-3 text-2xl font-bold text-slate-900">{profile?.company_name||profile?.full_name||'Perusahaan Anda'}</h1><div className="mt-2 space-y-1 text-sm text-slate-500">{profile?.company_address&&<p>{profile.company_address}</p>}{profile?.company_email&&<p>{profile.company_email}</p>}{profile?.company_phone&&<p>{profile.company_phone}</p>}{profile?.tax_number&&<p>NPWP: {profile.tax_number}</p>}</div></div><div className="min-w-52"><p className="text-sm text-slate-500">Nomor invoice</p><p className="mt-1 text-lg font-bold">{invoice.invoice_number}</p><p className="mt-4 text-sm text-slate-500">Tanggal invoice</p><p className="font-medium">{dateId(invoice.issue_date)}</p><p className="mt-3 text-sm text-slate-500">Jatuh tempo</p><p className="font-medium">{dateId(invoice.due_date)}</p><p className="mt-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{statusLabel[invoice.status]||invoice.status}</span></p></div></div>
   <section className="py-7"><p className="text-xs font-bold tracking-widest text-slate-500">TAGIHAN KEPADA</p><h2 className="mt-2 text-lg font-bold">{customer.name}</h2><div className="mt-1 space-y-1 text-sm text-slate-500">{customer.address&&<p>{customer.address}</p>}{customer.email&&<p>{customer.email}</p>}{customer.phone&&<p>{customer.phone}</p>}{customer.tax_number&&<p>NPWP: {customer.tax_number}</p>}</div></section>
   <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Deskripsi</th><th className="px-3 py-3 text-right">Qty</th><th className="px-3 py-3 text-right">Harga satuan</th><th className="px-3 py-3 text-right">Jumlah</th></tr></thead><tbody>{items.map(it=><tr key={it.id} className="border-b border-slate-100"><td className="px-3 py-4 font-medium text-slate-800">{it.description}</td><td className="px-3 py-4 text-right">{Number(it.quantity)} {it.unit}</td><td className="px-3 py-4 text-right whitespace-nowrap">{idr(Number(it.unit_price))}</td><td className="px-3 py-4 text-right font-medium whitespace-nowrap">{idr(Number(it.line_total))}</td></tr>)}</tbody></table></div>
   <div className="ml-auto mt-6 max-w-sm space-y-3 text-sm"><div className="flex justify-between gap-4 text-slate-600"><span>Subtotal</span><span>{idr(Number(invoice.subtotal))}</span></div><div className="flex justify-between gap-4 text-slate-600"><span>Diskon</span><span>− {idr(Number(invoice.discount_amount))}</span></div><div className="flex justify-between gap-4 text-slate-600"><span>Pajak ({Number(invoice.tax_rate)||0}%)</span><span>{idr(Number(invoice.tax_amount))}</span></div><div className="flex justify-between gap-4 border-t border-slate-200 pt-4 text-lg font-bold"><span>Total</span><span className="text-blue-700">{idr(Number(invoice.total_amount))}</span></div></div>
   {invoice.notes&&<section className="mt-8 border-t border-slate-200 pt-5"><h3 className="font-bold">Catatan</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{invoice.notes}</p></section>}
   {(profile?.bank_name||profile?.bank_account_number)&&<section className="mt-8 rounded-xl bg-slate-50 p-4"><h3 className="font-bold">Informasi pembayaran</h3><div className="mt-2 space-y-1 text-sm text-slate-600">{profile.bank_name&&<p>Bank: {profile.bank_name}</p>}{profile.bank_account_name&&<p>Atas nama: {profile.bank_account_name}</p>}{profile.bank_account_number&&<p>Nomor rekening: {profile.bank_account_number}</p>}</div></section>}
   {invoice.terms&&<section className="mt-6 text-sm text-slate-500"><h3 className="font-semibold text-slate-700">Syarat dan ketentuan</h3><p className="mt-1 whitespace-pre-wrap">{invoice.terms}</p></section>}
   <footer className="mt-12 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">Terima kasih atas kepercayaan Anda.</footer>
  </article>
 </main>;
}
