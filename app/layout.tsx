import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Life OS — Personal Habit & Task Manager',
  description: 'Operating System harian untuk produktivitas, habits, dan jurnal terintegrasi Telegram.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#0b0f19] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
