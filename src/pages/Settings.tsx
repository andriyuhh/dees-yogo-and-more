import { useState, useEffect } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useBiometricAuth } from '@/components/PinLock';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Moon, Lock, Eye, EyeOff, Database, LogOut, Shield, Fingerprint, TrendingUp, Calculator, Trash2, FileText, Store, Copy } from 'lucide-react';
import { toast } from 'sonner';


export default function SettingsPage() {
  const { settings, updateSettings, setPin, removePin } = useSettings();
  const { signOut } = useAuth();
  const biometric = useBiometricAuth();
  const { resetData } = useYogurtStore();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [terms, setTerms] = useState(settings.invoicePaymentTerms);
  const [footer, setFooter] = useState(settings.invoiceFooterNotes);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [waNumber, setWaNumber] = useState(settings.whatsappNumber);
  const [shopFee, setShopFee] = useState(String(settings.shopDeliveryFee));
  const [savingShop, setSavingShop] = useState(false);
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopTagline, setShopTagline] = useState(settings.shopTagline);
  const [shopHeaderColor, setShopHeaderColor] = useState(settings.shopHeaderColor);
  const [shopAccentColor, setShopAccentColor] = useState(settings.shopAccentColor);
  const [shopBannerUrl, setShopBannerUrl] = useState(settings.shopBannerUrl);
  const [shopLogoUrl, setShopLogoUrl] = useState(settings.shopLogoUrl);
  const [savingBrand, setSavingBrand] = useState(false);
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

  useEffect(() => {
    setTerms(settings.invoicePaymentTerms);
    setFooter(settings.invoiceFooterNotes);
  }, [settings.invoicePaymentTerms, settings.invoiceFooterNotes]);

  useEffect(() => {
    setWaNumber(settings.whatsappNumber);
    setShopFee(String(settings.shopDeliveryFee));
    setShopName(settings.shopName);
    setShopTagline(settings.shopTagline);
    setShopHeaderColor(settings.shopHeaderColor);
    setShopAccentColor(settings.shopAccentColor);
    setShopBannerUrl(settings.shopBannerUrl);
    setShopLogoUrl(settings.shopLogoUrl);
  }, [settings.whatsappNumber, settings.shopDeliveryFee, settings.shopName, settings.shopTagline, settings.shopHeaderColor, settings.shopAccentColor, settings.shopBannerUrl, settings.shopLogoUrl]);

  const saveBranding = async () => {
    setSavingBrand(true);
    try {
      await updateSettings({
        shopName: shopName.trim() || 'GULP by Andrea',
        shopTagline: shopTagline.trim() || 'Sip. Smile. Repeat.',
        shopHeaderColor: shopHeaderColor || '#ec4899',
        shopAccentColor: shopAccentColor || '#db2777',
        shopBannerUrl: shopBannerUrl.trim(),
        shopLogoUrl: shopLogoUrl.trim(),
      });
      toast.success('Shop branding saved ✨');
    } catch {
      toast.error('Could not save');
    } finally {
      setSavingBrand(false);
    }
  };

  const saveShopSettings = async () => {
    setSavingShop(true);
    try {
      await updateSettings({
        whatsappNumber: waNumber.replace(/[^0-9+]/g, ''),
        shopDeliveryFee: parseFloat(shopFee) || 0,
      });
      toast.success('Shop settings saved ✨');
    } catch {
      toast.error('Could not save');
    } finally {
      setSavingShop(false);
    }
  };

  const shopUrl = `${window.location.origin}/shop`;
  const copyShopUrl = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      toast.success('Shop link copied!');
    } catch {
      toast.error('Could not copy');
    }
  };

  const saveInvoiceSettings = async () => {
    setSavingInvoice(true);
    try {
      await updateSettings({ invoicePaymentTerms: terms, invoiceFooterNotes: footer });
      toast.success('Invoice settings saved ✨');
    } catch {
      toast.error('Could not save');
    } finally {
      setSavingInvoice(false);
    }
  };


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

        {/* Invoice Settings */}
        <div className="card-playful animate-slide-up" style={{ animationDelay: '230ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <Label className="font-bold text-sm">Invoice Settings</Label>
              <p className="text-xs text-muted-foreground">Shown on every PDF & WhatsApp invoice</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Payment Terms</Label>
              <Textarea
                value={terms}
                onChange={e => setTerms(e.target.value)}
                placeholder="e.g. Payment due upon receipt. Mobile Money accepted."
                className="min-h-[70px] mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Footer Notes</Label>
              <Textarea
                value={footer}
                onChange={e => setFooter(e.target.value)}
                placeholder="e.g. Thank you for your patronage!"
                className="min-h-[60px] mt-1 text-sm"
              />
            </div>
            <Button
              onClick={saveInvoiceSettings}
              disabled={savingInvoice || (terms === settings.invoicePaymentTerms && footer === settings.invoiceFooterNotes)}
              size="sm"
              className="gradient-berry text-primary-foreground rounded-full w-full"
            >
              {savingInvoice ? 'Saving…' : 'Save Invoice Settings'}
            </Button>
          </div>
        </div>

        {/* Customer Shop Settings */}
        <div className="card-playful animate-slide-up" style={{ animationDelay: '235ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <Store className="h-5 w-5 text-primary" />
            <div>
              <Label className="font-bold text-sm">Customer Ordering Website</Label>
              <p className="text-xs text-muted-foreground">Share this link so customers can order online</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-secondary rounded-xl p-2">
              <a href="/shop" target="_blank" rel="noreferrer" className="flex-1 text-xs font-mono truncate text-primary underline">
                {shopUrl}
              </a>
              <Button onClick={copyShopUrl} size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Shop is open</Label>
                <p className="text-xs text-muted-foreground">Turn off to hide from customers</p>
              </div>
              <Switch checked={settings.shopEnabled} onCheckedChange={v => updateSettings({ shopEnabled: v })} />
            </div>
            <div>
              <Label className="text-xs font-semibold">WhatsApp number for new orders</Label>
              <Input value={waNumber} onChange={e => setWaNumber(e.target.value)} placeholder="23275266940" className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">Digits only, include country code (no +)</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Default delivery fee (Le)</Label>
              <Input type="number" min={0} value={shopFee} onChange={e => setShopFee(e.target.value)} placeholder="0" className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">Applied when a customer provides a delivery address</p>
            </div>
            <Button
              onClick={saveShopSettings}
              disabled={savingShop || (waNumber === settings.whatsappNumber && parseFloat(shopFee) === settings.shopDeliveryFee)}
              size="sm"
              className="gradient-berry text-primary-foreground rounded-full w-full"
            >
              {savingShop ? 'Saving…' : 'Save Shop Settings'}
            </Button>
          </div>
        </div>

        {/* Shop Branding */}
        <div className="card-playful animate-slide-up" style={{ animationDelay: '238ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <Store className="h-5 w-5 text-primary" />
            <div>
              <Label className="font-bold text-sm">Shop Branding</Label>
              <p className="text-xs text-muted-foreground">Customize how your /shop page looks</p>
            </div>
          </div>

          {/* Live preview */}
          <div
            className="rounded-2xl p-4 mb-3 text-white shadow-inner overflow-hidden relative"
            style={{
              background: shopBannerUrl
                ? `linear-gradient(135deg, ${shopHeaderColor}dd, ${shopAccentColor}dd), url(${shopBannerUrl}) center/cover`
                : `linear-gradient(135deg, ${shopHeaderColor}, ${shopAccentColor})`,
            }}
          >
            <div className="flex items-center gap-2">
              {shopLogoUrl ? (
                <img src={shopLogoUrl} alt="logo" className="h-10 w-10 rounded-xl bg-white/25 p-0.5" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-white/25 flex items-center justify-center text-lg">🍦</div>
              )}
              <div>
                <p className="text-sm font-black leading-tight">{shopName || 'Shop name'}</p>
                <p className="text-[10px] italic opacity-90">{shopTagline || 'Tagline'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Shop name</Label>
              <Input value={shopName} onChange={e => setShopName(e.target.value)} maxLength={60} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Tagline</Label>
              <Input value={shopTagline} onChange={e => setShopTagline(e.target.value)} maxLength={80} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Logo image URL</Label>
              <Input value={shopLogoUrl} onChange={e => setShopLogoUrl(e.target.value)} placeholder="https://…/logo.png" className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">Leave blank to use your app logo</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Banner background image URL</Label>
              <Input value={shopBannerUrl} onChange={e => setShopBannerUrl(e.target.value)} placeholder="https://…/banner.jpg" className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">Optional — sits behind the header colors</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Header color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={shopHeaderColor} onChange={e => setShopHeaderColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer border" />
                  <Input value={shopHeaderColor} onChange={e => setShopHeaderColor(e.target.value)} className="flex-1 text-xs font-mono" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Accent color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={shopAccentColor} onChange={e => setShopAccentColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer border" />
                  <Input value={shopAccentColor} onChange={e => setShopAccentColor(e.target.value)} className="flex-1 text-xs font-mono" />
                </div>
              </div>
            </div>
            <Button
              onClick={saveBranding}
              disabled={savingBrand}
              size="sm"
              className="gradient-berry text-primary-foreground rounded-full w-full"
            >
              {savingBrand ? 'Saving…' : 'Save Branding'}
            </Button>
          </div>
        </div>

          <AlertDialogTrigger asChild>
            <button className="card-playful w-full text-left flex items-center gap-3 animate-slide-up border border-destructive/30" style={{ animationDelay: '240ms' }}>
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-bold text-sm text-destructive">Clear All Data</p>
                <p className="text-xs text-muted-foreground">Reset orders, stock, customers & more</p>
              </div>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start fresh? 🧹</AlertDialogTitle>
              <AlertDialogDescription>
                Pick what to wipe. This <strong>cannot be undone</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2.5 py-2">
              {[
                { key: 'orders', label: 'Orders' },
                { key: 'sales', label: 'Sales history' },
                { key: 'customers', label: 'Customers (CRM)' },
                { key: 'expenses', label: 'Expenses' },
                { key: 'notes', label: 'Notes' },
                { key: 'resetFlavorStock', label: 'Reset stock to 0 (keep flavors)' },
                { key: 'flavors', label: 'Delete flavors entirely' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 text-sm cursor-pointer">
                  <Checkbox
                    checked={(resetOpts as any)[key]}
                    onCheckedChange={(v) => setResetOpts(prev => ({
                      ...prev,
                      [key]: !!v,
                      ...(key === 'flavors' && v ? { resetFlavorStock: false } : {}),
                      ...(key === 'resetFlavorStock' && v ? { flavors: false } : {}),
                    }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="pt-1">
              <Label className="text-xs">Type <strong>RESET</strong> to confirm</Label>
              <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="RESET" autoCapitalize="characters" />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); handleReset(); }} disabled={resetting || confirmText !== 'RESET'} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {resetting ? 'Clearing…' : 'Clear data'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
