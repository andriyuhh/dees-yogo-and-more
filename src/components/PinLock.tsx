import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { ShieldCheck, Delete } from 'lucide-react';
import logo from '@/assets/logo.jpg';

export default function PinLock() {
  const { verifyPin, setPinLocked } = useSettings();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

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
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
      {/* Decorative blurred circles */}
      <div className="absolute top-[-80px] left-[-60px] w-60 h-60 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute bottom-[-60px] right-[-40px] w-48 h-48 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mb-8 animate-bounce-in">
        <div className="absolute -inset-3 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <img src={logo} alt="Logo" className="w-24 h-24 rounded-full object-cover shadow-xl ring-4 ring-primary/30 relative" />
      </div>

      <h1 className="text-2xl font-extrabold mb-1 animate-fade-in">Dee's Yogo & More</h1>
      <div className="flex items-center gap-2 text-muted-foreground mb-10 animate-fade-in">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold tracking-wide">Enter your PIN</span>
      </div>

      <div className={`flex gap-4 mb-10 ${shake ? 'animate-wiggle' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full transition-all duration-300 ${
              i < pin.length
                ? error
                  ? 'bg-destructive scale-125 shadow-lg shadow-destructive/30'
                  : 'bg-primary scale-125 shadow-lg shadow-primary/30'
                : 'border-2 border-muted-foreground/25'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-destructive text-sm font-bold mb-6 animate-fade-in">
          Incorrect PIN — try again
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 w-72">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            onClick={() => handleDigit(String(n))}
            className="h-16 rounded-2xl bg-card border border-border text-foreground text-2xl font-bold hover:bg-secondary active:scale-90 transition-all duration-150 shadow-sm"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-card border border-border text-foreground text-2xl font-bold hover:bg-secondary active:scale-90 transition-all duration-150 shadow-sm"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-16 rounded-2xl bg-card border border-border text-muted-foreground flex items-center justify-center hover:bg-secondary active:scale-90 transition-all duration-150 shadow-sm"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
