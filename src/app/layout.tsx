import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="theme-bookclub-warm">
      <body className="min-h-screen antialiased bg-main text-primary" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}