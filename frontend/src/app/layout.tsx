import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DarManager - Guesthouse Management',
  description: 'Modern guesthouse management system for Lebanon',
  keywords: 'guesthouse, management, lebanon, booking, property',
  authors: [{ name: 'DarManager Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <div id="root" className="h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
