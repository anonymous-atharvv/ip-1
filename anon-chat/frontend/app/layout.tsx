import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ANON-CHAT Terminal',
  description: 'Anonymous privacy-first terminal chat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
