import { useState, useEffect } from 'react';
import logo from '@/assets/logo.png';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(onFinish, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img
        src={logo}
        alt="Dee's Yogo & More"
        className={`w-48 h-48 rounded-full object-cover shadow-2xl transition-all duration-700 ease-out ${
          phase === 'enter'
            ? 'scale-50 opacity-0'
            : phase === 'hold'
            ? 'scale-100 opacity-100'
            : 'scale-110 opacity-0'
        }`}
      />
      <p
        className={`mt-4 text-lg font-extrabold text-primary transition-all duration-700 delay-300 ${
          phase === 'enter' ? 'opacity-0 translate-y-4' : phase === 'hold' ? 'opacity-100 translate-y-0' : 'opacity-0'
        }`}
      >
        Cream Come True
      </p>
    </div>
  );
}
