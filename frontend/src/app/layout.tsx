import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TenantProvider } from '@/contexts/TenantContext';
import InstallPrompt from '@/components/InstallPrompt';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DarManager - Property Management',
  description: 'Modern property management system for guesthouses and hotels',
  keywords: 'guesthouse, hotel, management, booking, property, hospitality',
  authors: [{ name: 'DarManager Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DarManager',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'DarManager',
    title: 'DarManager - Property Management',
    description: 'Modern property management system for guesthouses and hotels',
  },
  twitter: {
    card: 'summary',
    title: 'DarManager - Property Management',
    description: 'Modern property management system for guesthouses and hotels',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3B82F6',
  colorScheme: 'light',
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
          <TenantProvider>
            {children}
            <InstallPrompt />
          </TenantProvider>
        </div>
      </body>
    </html>
  );
}
