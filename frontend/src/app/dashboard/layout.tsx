'use client';

import { useEffect } from 'react';
import InstallPrompt from '@/components/InstallPrompt';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register service worker only in dashboard (after login)
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          console.log('PWA: Service worker registered successfully');
        } catch (error) {
          console.log('PWA: Service worker registration failed:', error);
        }
      });
    }
  }, []);

  return (
    <div>
      {children}
      <InstallPrompt />
    </div>
  );
}