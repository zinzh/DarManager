'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Hide for 7 days
    if (typeof window !== 'undefined') {
      localStorage.setItem('installPromptDismissed', Date.now().toString());
    }
  };

  // Check if user dismissed recently
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('installPromptDismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedTime < sevenDays) {
          setShowInstallPrompt(false);
        }
      }
    }
  }, [isClient]);

  if (!isClient || !showInstallPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between">
      <div className="flex-1 pr-4">
        <p className="font-semibold">Install DarManager</p>
        <p className="text-sm opacity-90">Add to home screen for quick access</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleDismiss}
          className="px-3 py-1 text-sm bg-blue-500 rounded hover:bg-blue-400 transition-colors"
        >
          Later
        </button>
        <button
          onClick={handleInstallClick}
          className="px-3 py-1 text-sm bg-white text-blue-600 rounded font-semibold hover:bg-gray-100 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}