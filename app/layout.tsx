import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DashboardShell } from './components/DashboardShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Life OS — Modern Habit, Task & Daily Journal System',
  description: 'Operating System harian terpadu untuk kebiasaan, produktivitas, dan refleksi dengan integrasi Telegram.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`dark ${inter.variable}`}>
      <body className={`${inter.className} bg-[#09090b] text-zinc-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200`}>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
