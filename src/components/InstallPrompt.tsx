import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import logo from '@/assets/logo.jpg';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 3 * 24 * 60 * 60 * 1000) return;

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((navigator as any).standalone) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isiOS);

    if (isiOS) {
      // Show iOS-specific banner after a delay
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop - listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('install-prompt-dismissed', String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] animate-slide-up">
      <div className="mx-3 mt-3 rounded-2xl border border-border bg-card shadow-xl p-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Dee's Yogo" className="w-12 h-12 rounded-xl object-cover shadow-md" />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-sm">Install Dee's Yogo & More</p>
            {isIOS ? (
              <p className="text-xs text-muted-foreground">
                Tap <Share className="inline h-3 w-3 -mt-0.5" /> then <span className="font-semibold">"Add to Home Screen"</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Get the full app experience on your device</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="gradient-berry text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Install
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
