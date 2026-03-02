import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { ShieldCheck, Delete, Fingerprint } from 'lucide-react';
import logo from '@/assets/logo.jpg';

function useBiometricAuth() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Check if WebAuthn credential is stored
    const hasCred = !!localStorage.getItem('biometric_cred_id');
    if (hasCred && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(ok => setAvailable(ok));
    }
  }, []);

  const enroll = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.PublicKeyCredential) return false;
      const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!ok) return false;

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Dee's Yogo & More" },
          user: { id: userId, name: 'owner', displayName: 'Store Owner' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (credential) {
        localStorage.setItem('biometric_cred_id', btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
        setAvailable(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const credId = localStorage.getItem('biometric_cred_id');
      if (!credId) return false;

      const rawId = Uint8Array.from(atob(credId), c => c.charCodeAt(0));
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: rawId, type: 'public-key', transports: ['internal'] }],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      return !!assertion;
    } catch {
      return false;
    }
  }, []);

  const remove = useCallback(() => {
    localStorage.removeItem('biometric_cred_id');
    setAvailable(false);
  }, []);

  return { available, enroll, authenticate, remove };
}

export { useBiometricAuth };

export default function PinLock() {
  const { verifyPin, setPinLocked } = useSettings();
  const biometric = useBiometricAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Auto-prompt biometric on mount
  useEffect(() => {
    if (biometric.available) {
      handleBiometric();
    }
  }, [biometric.available]);

  const handleBiometric = async () => {
    if (unlocking) return;
    setUnlocking(true);
    const ok = await biometric.authenticate();
    if (ok) {
      setPinLocked(false);
    }
    setUnlocking(false);
  };

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (verifyPin(next)) {
        setPinLocked(false);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => { setPin(''); setShake(false); }, 500);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-[-120px] left-[-80px] w-72 h-72 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-[-100px] right-[-60px] w-64 h-64 rounded-full bg-accent/8 blur-[80px]" />
      <div className="absolute top-1/3 right-[-40px] w-40 h-40 rounded-full bg-yogurt-strawberry/6 blur-[60px]" />

      {/* Logo with glow ring */}
      <div className="relative mb-6 animate-bounce-in">
        <div className="absolute -inset-4 rounded-full bg-primary/15 blur-2xl animate-pulse" />
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-sm" />
          <img src={logo} alt="Logo" className="w-20 h-20 rounded-full object-cover shadow-2xl ring-2 ring-primary/40 relative" />
        </div>
      </div>

      <h1 className="text-xl font-extrabold tracking-tight mb-0.5 animate-fade-in">Dee's Yogo & More</h1>
      <p className="text-xs text-muted-foreground/70 font-medium mb-6 animate-fade-in italic">Cream Come True ✨</p>

      <div className="flex items-center gap-2 text-muted-foreground mb-8 animate-fade-in">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Enter your PIN</span>
      </div>

      {/* PIN dots */}
      <div className={`flex gap-5 mb-8 ${shake ? 'animate-wiggle' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="relative">
            {i < pin.length && (
              <div className={`absolute -inset-2 rounded-full blur-md ${error ? 'bg-destructive/30' : 'bg-primary/25'}`} />
            )}
            <div
              className={`w-4 h-4 rounded-full transition-all duration-300 relative ${
                i < pin.length
                  ? error
                    ? 'bg-destructive scale-[1.3]'
                    : 'bg-primary scale-[1.3]'
                  : 'border-2 border-muted-foreground/20'
              }`}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-destructive text-xs font-bold mb-5 animate-fade-in">
          Wrong PIN — try again
        </p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2.5 w-64">
        {digits.map(n => (
          <button
            key={n}
            onClick={() => handleDigit(String(n))}
            className="h-14 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 text-foreground text-xl font-bold hover:bg-secondary active:scale-90 transition-all duration-150"
          >
            {n}
          </button>
        ))}

        {/* Bottom row: biometric / 0 / delete */}
        {biometric.available ? (
          <button
            onClick={handleBiometric}
            disabled={unlocking}
            className="h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-90 transition-all duration-150"
          >
            <Fingerprint className="h-6 w-6" />
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={() => handleDigit('0')}
          className="h-14 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 text-foreground text-xl font-bold hover:bg-secondary active:scale-90 transition-all duration-150"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-14 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 text-muted-foreground flex items-center justify-center hover:bg-secondary active:scale-90 transition-all duration-150"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>

      {biometric.available && (
        <p className="text-[10px] text-muted-foreground/60 mt-5 animate-fade-in">
          Tap 👆 for fingerprint / face unlock
        </p>
      )}
    </div>
  );
}
