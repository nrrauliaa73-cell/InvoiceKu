import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InvoiceKu — Sistem Invoice',
  description: 'Kelola invoice, pelanggan, dan pembayaran bisnis Anda.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
