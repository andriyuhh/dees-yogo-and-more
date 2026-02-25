import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Lock } from 'lucide-react';
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
      <div className="relative mb-6">
        <div className="absolute -inset-2 gradient-berry rounded-full blur opacity-30 animate-pulse" />
        <img src={logo} alt="Logo" className="w-20 h-20 rounded-full object-cover shadow-lg relative" />
      </div>
      <h1 className="text-xl font-extrabold mb-1">Dee's Yogo & More</h1>
      <div className="flex items-center gap-2 text-muted-foreground mb-8">
        <Lock className="h-4 w-4" />
        <span className="text-sm font-medium">Enter PIN to unlock</span>
      </div>

      <div className={`flex gap-3 mb-8 ${shake ? 'animate-wiggle' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? (error ? 'bg-destructive scale-110' : 'bg-primary scale-110') : 'border-2 border-muted-foreground/30'}`} />
        ))}
      </div>

      {error && <p className="text-destructive text-sm font-semibold mb-4 animate-fade-in">Wrong PIN — try again</p>}

      <div className="grid grid-cols-3 gap-3 w-64">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} onClick={() => handleDigit(String(n))} className="h-14 rounded-2xl bg-secondary text-foreground text-xl font-bold hover:bg-secondary/80 active:scale-95 transition-all">
            {n}
          </button>
        ))}
        <div />
        <button onClick={() => handleDigit('0')} className="h-14 rounded-2xl bg-secondary text-foreground text-xl font-bold hover:bg-secondary/80 active:scale-95 transition-all">0</button>
        <button onClick={handleDelete} className="h-14 rounded-2xl bg-muted text-muted-foreground text-sm font-bold hover:bg-muted/80 active:scale-95 transition-all">⌫</button>
      </div>
    </div>
  );
}
