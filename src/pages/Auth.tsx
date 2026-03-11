import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/assets/logo.png';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account! 📧');
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo & branding */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block">
            <div className="absolute -inset-2 gradient-berry rounded-full blur-lg opacity-30 animate-pulse" />
            <img src={logo} alt="Dee's Yogo & More" className="w-20 h-20 rounded-full object-cover shadow-lg relative" />
          </div>
          <h1 className="text-2xl font-extrabold mt-4 text-foreground">Dee's Yogo & More</h1>
          <p className="text-sm text-muted-foreground mt-1">Cream Come True ✨</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-scale-in">
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <h2 className="text-lg font-bold mb-4 text-center">
              {isSignUp ? 'Create Account 🎉' : 'Welcome Back 👋'}
            </h2>

            <div className="space-y-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="dee@yogurt.com"
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 p-2 rounded-lg bg-destructive/10 text-destructive text-sm text-center animate-fade-in">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-3 p-2 rounded-lg bg-success/10 text-success text-sm text-center animate-fade-in">
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-4 gradient-berry text-primary-foreground font-bold rounded-xl h-11 shadow-md hover:shadow-lg transition-shadow"
            >
              {loading ? '⏳ Please wait...' : isSignUp ? 'Sign Up' : 'Log In'}
            </Button>
          </div>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
          className="w-full text-center mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
