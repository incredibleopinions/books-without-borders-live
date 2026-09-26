import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Books Without Borders Club',
  description: 'Live interactive host dashboard and member experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}