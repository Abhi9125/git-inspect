import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'GitForensics — Git History Authenticity & Bot Detection',
  description: 'Forensic analysis engine to verify whether a GitHub contribution graph was created by a real human developer or by automated bots.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-bg text-white antialiased flex flex-col bg-grid-subtle">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-dark-border/50 py-6 text-center text-[12px] text-dark-muted">
            <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>GitForensics &bull; Open Source Authenticity Engine</span>
              <span>Inspired by Vibrant UI &bull; Zero Server Overhead</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
