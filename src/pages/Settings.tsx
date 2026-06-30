import { useState } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useBiometricAuth } from '@/components/PinLock';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Moon, Lock, Eye, EyeOff, Database, LogOut, Shield, Fingerprint, TrendingUp, Calculator, Trash2 } from 'lucide-react';
import { toast } from 'sonner';


export default function SettingsPage() {
  const { settings, updateSettings, setPin, removePin } = useSettings();
  const { signOut } = useAuth();
  const biometric = useBiometricAuth();
  const { resetData } = useYogurtStore();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetOpts, setResetOpts] = useState({
    orders: true,
    sales: true,
    customers: true,
    expenses: true,
    notes: false,
    resetFlavorStock: true,
    flavors: false,
  });
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (confirmText !== 'RESET') return toast.error('Type RESET to confirm');
    setResetting(true);
    try {
      await resetData(resetOpts);
      toast.success('Data cleared. Fresh start! ✨');
      setResetOpen(false);
      setConfirmText('');
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setResetting(false);
    }
  };


  const handleSetPin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    setPin(newPin);
    setNewPin(''); setConfirmPin('');
    setShowPinForm(false);
    toast.success('PIN set successfully! 🔒');
  };

  const handleRemovePin = () => {
    removePin();
    toast.success('PIN removed');
  };

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-extrabold mb-6 animate-fade-in">Settings ⚙️</h1>

      <div className="space-y-4">
        {/* Dark Mode */}
        <div className="card-playful flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5 text-primary" />
            <div>
              <Label className="font-bold text-sm">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Easier on the eyes at night</p>
            </div>
          </div>
          <Switch checked={settings.darkMode} onCheckedChange={v => updateSettings({ darkMode: v })} />
        </div>

        {/* Hide Profit */}
        <div className="card-playful flex items-center justify-between animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3">
            {settings.hideProfit ? <EyeOff className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-primary" />}
            <div>
              <Label className="font-bold text-sm">Hide Profit</Label>
              <p className="text-xs text-muted-foreground">Hide profit info when staff help</p>
            </div>
          </div>
          <Switch checked={settings.hideProfit} onCheckedChange={v => updateSettings({ hideProfit: v })} />
        </div>

        {/* PIN Lock */}
        <div className="card-playful animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <Label className="font-bold text-sm">PIN Lock</Label>
                <p className="text-xs text-muted-foreground">{settings.pinHash ? 'PIN is active' : 'Protect your app with a PIN'}</p>
              </div>
            </div>
            {settings.pinHash ? (
              <Button variant="destructive" size="sm" onClick={handleRemovePin} className="rounded-full text-xs">Remove</Button>
            ) : (
              <Button size="sm" onClick={() => setShowPinForm(true)} className="gradient-berry text-primary-foreground rounded-full text-xs">Set PIN</Button>
            )}
          </div>
          {showPinForm && !settings.pinHash && (
            <div className="mt-3 space-y-2 animate-fade-in">
              <Input type="password" maxLength={4} inputMode="numeric" pattern="[0-9]*" placeholder="Enter 4-digit PIN" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <Input type="password" maxLength={4} inputMode="numeric" pattern="[0-9]*" placeholder="Confirm PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <div className="flex gap-2">
                <Button onClick={handleSetPin} size="sm" className="gradient-berry text-primary-foreground rounded-full flex-1">Confirm</Button>
                <Button variant="outline" size="sm" onClick={() => { setShowPinForm(false); setNewPin(''); setConfirmPin(''); }} className="rounded-full">Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Biometric Unlock */}
        {settings.pinHash && (
          <div className="card-playful flex items-center justify-between animate-slide-up" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center gap-3">
              <Fingerprint className="h-5 w-5 text-primary" />
              <div>
                <Label className="font-bold text-sm">Biometric Unlock</Label>
                <p className="text-xs text-muted-foreground">{biometric.available ? 'Face / fingerprint enabled' : 'Use fingerprint or face to unlock'}</p>
              </div>
            </div>
            {biometric.available ? (
              <Button variant="destructive" size="sm" onClick={() => { biometric.remove(); toast.success('Biometric removed'); }} className="rounded-full text-xs">Remove</Button>
            ) : (
              <Button size="sm" onClick={async () => { const ok = await biometric.enroll(); if (ok) toast.success('Biometric set up! 🎉'); else toast.error('Not supported on this device'); }} className="gradient-berry text-primary-foreground rounded-full text-xs">Enable</Button>
            )}
          </div>
        )}

        {/* Backup Reminder */}
        <div className="card-playful flex items-center justify-between animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <Label className="font-bold text-sm">Backup Reminder</Label>
              <p className="text-xs text-muted-foreground">Weekly reminder to backup data</p>
            </div>
          </div>
          <Shield className="h-4 w-4 text-success" />
        </div>

        {/* Sales & Reports */}
        <RouterNavLink to="/sales" className="card-playful w-full flex items-center gap-3 animate-slide-up no-underline" style={{ animationDelay: '200ms' }}>
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <p className="font-bold text-sm">Sales & Reports</p>
            <p className="text-xs text-muted-foreground">View sales history, trends & analytics</p>
          </div>
        </RouterNavLink>

        {/* Pricing Calculator */}
        <RouterNavLink to="/pricing" className="card-playful w-full flex items-center gap-3 animate-slide-up no-underline" style={{ animationDelay: '225ms' }}>
          <Calculator className="h-5 w-5 text-primary" />
          <div>
            <p className="font-bold text-sm">Pricing Calculator</p>
            <p className="text-xs text-muted-foreground">Smart pricing based on cost + margin</p>
          </div>
        </RouterNavLink>

        {/* Sign Out */}
        <button onClick={signOut} className="card-playful w-full text-left flex items-center gap-3 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <LogOut className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-bold text-sm text-destructive">Sign Out</p>
            <p className="text-xs text-muted-foreground">Log out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );
}
