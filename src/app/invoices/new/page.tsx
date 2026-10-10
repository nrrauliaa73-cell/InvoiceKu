'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const idr=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const today=()=>new Date().toISOString().slice(0,10);
const dueDefault=()=>{const d=new Date();d.setDate(d.getDate()+7);return d.toISOString().slice(0,10)};
const input='mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500';

export default function NewInvoicePage() {
  const router=useRouter(); const supabase=useMemo(()=>createClient(),[]);
  const [userId,setUserId]=useState(''); const [checking,setChecking]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
  const [customer,setCustomer]=useState(''); const [email,setEmail]=useState(''); const [phone,setPhone]=useState('');
  const [issue,setIssue]=useState(today()); const [due,setDue]=useState(dueDefault());
  const [description,setDescription]=useState(''); const [qty,setQty]=useState('1'); const [price,setPrice]=useState('0'); const [discount,setDiscount]=useState('0'); const [tax,setTax]=useState('0'); const [notes,setNotes]=useState('');
  useEffect(()=>{supabase.auth.getUser().then(({data})=>{if(!data.user)router.replace('/login');else setUserId(data.user.id);setChecking(false)})},[router,supabase]);
  const subtotal=Math.max(0,Number(qty)||0)*Math.max(0,Number(price)||0);
  const disc=Math.min(subtotal,Math.max(0,Number(discount)||0));
  const taxAmount=(subtotal-disc)*Math.min(100,Math.max(0,Number(tax)||0))/100;
  const total=subtotal-disc+taxAmount;
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');
    if(!userId||!customer.trim()||!description.trim()){setError('Nama pelanggan dan deskripsi item wajib diisi.');return}
    if(due<issue){setError('Jatuh tempo tidak boleh sebelum tanggal invoice.');return}
    setSaving(true);
    try{
      const {data:c,error:ce}=await supabase.from('customers').insert({owner_id:userId,name:customer.trim(),email:email.trim(),phone:phone.trim()}).select('id').single();
      if(ce)throw ce;
      const invoiceNumber='INV-'+Date.now().toString();
      const {data:i,error:ie}=await supabase.from('invoices').insert({owner_id:userId,customer_id:c.id,invoice_number:invoiceNumber,issue_date:issue,due_date:due,status:'draft',currency:'IDR',subtotal,discount_amount:disc,tax_rate:Number(tax)||0,tax_amount:taxAmount,total_amount:total,notes}).select('id').single();
      if(ie)throw ie;
      const {error:itemError}=await supabase.from('invoice_items').insert({owner_id:userId,invoice_id:i.id,description:description.trim(),quantity:Number(qty),unit:'pcs',unit_price:Number(price),line_total:subtotal});
      if(itemError){await supabase.from('invoices').delete().eq('id',i.id);throw itemError}
      router.push('/invoices');router.refresh();
    }catch(e){setError(e instanceof Error?e.message:'Invoice gagal disimpan.');}finally{setSaving(false)}
  }
  if(checking)return <main className="p-10 text-center">Memeriksa sesi login…</main>;
  return <main className="min-h-screen bg-slate-50 p-5 md:p-9"><div className="mx-auto max-w-3xl">
    <Link href="/invoices" className="text-sm text-slate-500">← Kembali ke invoice</Link><h1 className="mt-6 text-3xl font-bold">Tambah Invoice</h1><p className="mt-2 text-sm text-slate-500">Isi data pelanggan dan rincian tagihan.</p>
    <form onSubmit={submit} className="mt-7 space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><h2 className="font-bold">Data pelanggan</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Nama pelanggan *<input required value={customer} onChange={e=>setCustomer(e.target.value)} className={input} placeholder="Nama pelanggan"/></label>
        <label className="text-sm">Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} className={input} placeholder="email@contoh.com"/></label>
        <label className="text-sm">Nomor telepon<input value={phone} onChange={e=>setPhone(e.target.value)} className={input} placeholder="08xxxxxxxxxx"/></label>
      </div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><h2 className="font-bold">Tanggal</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Tanggal invoice<input required type="date" value={issue} onChange={e=>setIssue(e.target.value)} className={input}/></label>
        <label className="text-sm">Jatuh tempo<input required type="date" min={issue} value={due} onChange={e=>setDue(e.target.value)} className={input}/></label>
      </div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><h2 className="font-bold">Rincian tagihan</h2><div className="mt-4 space-y-4">
        <label className="block text-sm">Deskripsi item *<input required value={description} onChange={e=>setDescription(e.target.value)} className={input} placeholder="Jasa desain, barang, dll."/></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Jumlah<input required type="number" min="0.01" step="0.01" value={qty} onChange={e=>setQty(e.target.value)} className={input}/></label><label className="text-sm">Harga satuan (Rp)<input required type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} className={input}/></label></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Diskon (Rp)<input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(e.target.value)} className={input}/></label><label className="text-sm">Pajak (%)<input type="number" min="0" max="100" step="0.01" value={tax} onChange={e=>setTax(e.target.value)} className={input}/></label></div>
        <label className="block text-sm">Catatan<textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} className={input}/></label>
      </div><div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm"><p className="flex justify-between py-1"><span>Subtotal</span><span>{idr(subtotal)}</span></p><p className="flex justify-between py-1"><span>Diskon</span><span>− {idr(disc)}</span></p><p className="flex justify-between py-1"><span>Pajak</span><span>{idr(taxAmount)}</span></p><p className="mt-2 flex justify-between border-t pt-3 text-base font-bold"><span>Total</span><span className="text-blue-700">{idr(total)}</span></p></div></section>
      {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3"><Link href="/invoices" className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold">Batal</Link><button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving?'Menyimpan…':'Simpan Invoice'}</button></div>
    </form></div></main>;
}
