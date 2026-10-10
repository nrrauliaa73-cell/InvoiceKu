'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileText, LoaderCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const router = useRouter();
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try { const supabase = createClient(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; router.push('/dashboard'); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Login gagal. Periksa konfigurasi Supabase.'); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center px-5 py-10"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
    <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold"><span className="rounded-xl bg-blue-600 p-2 text-white"><FileText size={20}/></span> InvoiceKu</Link>
    <h1 className="mt-8 text-2xl font-bold">Masuk ke akun</h1><p className="mt-2 text-sm text-slate-500">Gunakan akun admin yang sudah dibuat di Supabase Auth.</p>
    <form onSubmit={handleSubmit} className="mt-7 space-y-4"><div><label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label><input id="email" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="admin@perusahaan.com"/></div>
    <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium">Kata sandi</label><input id="password" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="Masukkan kata sandi"/></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy&&<LoaderCircle size={18} className="animate-spin"/>}{busy?'Memproses...':'Masuk'}</button></form>
    <p className="mt-6 text-xs leading-5 text-slate-500">Akun admin dibuat melalui Supabase Dashboard. Pendaftaran publik sengaja tidak disediakan pada versi awal.</p><Link href="/" className="mt-5 inline-block text-sm font-medium text-blue-600">← Kembali ke halaman utama</Link>
  </div></main>;
}
