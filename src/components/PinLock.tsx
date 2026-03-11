import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { ShieldCheck, Delete, Fingerprint } from 'lucide-react';
import logo from '@/assets/logo.png';

// Biometric hook that uses platform authenticator directly (no Google passkey)
function useBiometricAuth() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const hasCred = !!localStorage.getItem('bio_cred_id');
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
          rp: { name: "Dee's Yogo & More", id: window.location.hostname },
          user: { id: userId, name: 'owner', displayName: 'Store Owner' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'discouraged',        // <-- avoids passkey manager
            requireResidentKey: false,
          },
          attestation: 'none',
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (credential) {
        localStorage.setItem('bio_cred_id', btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
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
      const credId = localStorage.getItem('bio_cred_id');
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
    localStorage.removeItem('bio_cred_id');
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

  useEffect(() => {
    if (biometric.available) handleBiometric();
  }, [biometric.available]);

  const handleBiometric = async () => {
    if (unlocking) return;
    setUnlocking(true);
    const ok = await biometric.authenticate();
    if (ok) setPinLocked(false);
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

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-[-120px] left-[-80px] w-72 h-72 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-[-100px] right-[-60px] w-64 h-64 rounded-full bg-accent/8 blur-[80px]" />

      <div className="relative mb-5">
        <div className="absolute -inset-3 rounded-full bg-primary/15 blur-2xl animate-pulse" />
        <img src={logo} alt="Logo" className="w-16 h-16 rounded-full object-cover shadow-2xl ring-2 ring-primary/40 relative" />
      </div>

      <p className="text-xs text-muted-foreground/70 font-medium mb-6 italic">Cream Come True ✨</p>

      <div className="flex items-center gap-2 text-muted-foreground mb-5">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Enter Passcode</span>
      </div>

      {/* PIN dots */}
      <div className={`flex gap-6 mb-8 ${shake ? 'animate-wiggle' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="relative">
            {i < pin.length && (
              <div className={`absolute -inset-1.5 rounded-full blur-md ${error ? 'bg-destructive/30' : 'bg-primary/25'}`} />
            )}
            <div
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 relative ${
                i < pin.length
                  ? error ? 'bg-destructive scale-125' : 'bg-primary scale-125'
                  : 'border-2 border-muted-foreground/30'
              }`}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-destructive text-xs font-bold mb-4 animate-fade-in">
          Wrong PIN — try again
        </p>
      )}

      {/* iPhone-style round keypad */}
      <div className="grid grid-cols-3 gap-4 w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            onClick={() => handleDigit(String(n))}
            className="w-[80px] h-[80px] rounded-full bg-card/60 backdrop-blur-sm border border-border/40 text-foreground flex flex-col items-center justify-center hover:bg-secondary active:bg-muted active:scale-95 transition-all duration-100 mx-auto"
          >
            <span className="text-2xl font-light leading-none">{n}</span>
            <span className="text-[8px] tracking-[3px] text-muted-foreground/60 mt-0.5 uppercase">
              {n === 1 ? '' : n === 2 ? 'ABC' : n === 3 ? 'DEF' : n === 4 ? 'GHI' : n === 5 ? 'JKL' : n === 6 ? 'MNO' : n === 7 ? 'PQRS' : n === 8 ? 'TUV' : 'WXYZ'}
            </span>
          </button>
        ))}

        {/* Bottom row: biometric / 0 / delete */}
        {biometric.available ? (
          <button
            onClick={handleBiometric}
            disabled={unlocking}
            className="w-[80px] h-[80px] rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all duration-100 mx-auto"
          >
            <Fingerprint className="h-7 w-7" />
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={() => handleDigit('0')}
          className="w-[80px] h-[80px] rounded-full bg-card/60 backdrop-blur-sm border border-border/40 text-foreground flex items-center justify-center hover:bg-secondary active:bg-muted active:scale-95 transition-all duration-100 mx-auto"
        >
          <span className="text-2xl font-light">0</span>
        </button>
        <button
          onClick={handleDelete}
          className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-100 mx-auto"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>

      {biometric.available && (
        <p className="text-[10px] text-muted-foreground/60 mt-5">
          Tap 👆 for fingerprint / face unlock
        </p>
      )}
    </div>
  );
}
