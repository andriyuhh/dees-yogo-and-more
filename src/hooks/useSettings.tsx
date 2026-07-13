import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Settings {
  pinHash: string | null;
  hideProfit: boolean;
  darkMode: boolean;
  lastBackupReminder: string;
  invoicePaymentTerms: string;
  invoiceFooterNotes: string;
  whatsappNumber: string;
  shopEnabled: boolean;
  shopDeliveryFee: number;
  shopName: string;
  shopTagline: string;
  shopHeaderColor: string;
  shopAccentColor: string;
  shopBannerUrl: string;
  shopLogoUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  pinLocked: boolean;
  setPinLocked: (v: boolean) => void;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => boolean;
  removePin: () => Promise<void>;
  shouldShowBackupReminder: () => boolean;
  dismissBackupReminder: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    pinHash: null, hideProfit: false, darkMode: false, lastBackupReminder: new Date().toISOString(),
    invoicePaymentTerms: 'Payment due upon receipt. Mobile Money: Orange Money, AfriMoney, QMoney. Cash accepted on delivery.',
    invoiceFooterNotes: 'Thank you for choosing GULP by Andrea. For orders & inquiries, reach out on WhatsApp.',
    whatsappNumber: '23275266940',
    shopEnabled: true,
    shopDeliveryFee: 0,
    shopName: 'GULP by Andrea',
    shopTagline: 'Sip. Smile. Repeat.',
    shopHeaderColor: '#ec4899',
    shopAccentColor: '#db2777',
    shopBannerUrl: '',
    shopLogoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [pinLocked, setPinLocked] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setSettings({
          pinHash: data.pin_hash,
          hideProfit: data.hide_profit,
          darkMode: data.dark_mode,
          lastBackupReminder: data.last_backup_reminder,
          invoicePaymentTerms: (data as any).invoice_payment_terms ?? '',
          invoiceFooterNotes: (data as any).invoice_footer_notes ?? '',
          whatsappNumber: (data as any).whatsapp_number ?? '23275266940',
          shopEnabled: (data as any).shop_enabled ?? true,
          shopDeliveryFee: Number((data as any).shop_delivery_fee) || 0,
          shopName: (data as any).shop_name ?? 'GULP by Andrea',
          shopTagline: (data as any).shop_tagline ?? 'Sip. Smile. Repeat.',
          shopHeaderColor: (data as any).shop_header_color ?? '#ec4899',
          shopAccentColor: (data as any).shop_accent_color ?? '#db2777',
          shopBannerUrl: (data as any).shop_banner_url ?? '',
          shopLogoUrl: (data as any).shop_logo_url ?? '',
        });
        if (data.pin_hash) setPinLocked(true);
      }
      setLoading(false);
    });
  }, [user]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  const ensureRow = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('user_settings').select('id').eq('user_id', user.id).maybeSingle();
    if (!data) {
      await supabase.from('user_settings').insert({ user_id: user.id });
    }
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    if (!user) return;
    await ensureRow();
    const dbUpdates: any = {};
    if (updates.hideProfit !== undefined) dbUpdates.hide_profit = updates.hideProfit;
    if (updates.darkMode !== undefined) dbUpdates.dark_mode = updates.darkMode;
    if (updates.lastBackupReminder !== undefined) dbUpdates.last_backup_reminder = updates.lastBackupReminder;
    if (updates.pinHash !== undefined) dbUpdates.pin_hash = updates.pinHash;
    if (updates.invoicePaymentTerms !== undefined) dbUpdates.invoice_payment_terms = updates.invoicePaymentTerms;
    if (updates.invoiceFooterNotes !== undefined) dbUpdates.invoice_footer_notes = updates.invoiceFooterNotes;
    if (updates.whatsappNumber !== undefined) dbUpdates.whatsapp_number = updates.whatsappNumber;
    if (updates.shopEnabled !== undefined) dbUpdates.shop_enabled = updates.shopEnabled;
    if (updates.shopDeliveryFee !== undefined) dbUpdates.shop_delivery_fee = updates.shopDeliveryFee;
    if (updates.shopName !== undefined) dbUpdates.shop_name = updates.shopName;
    if (updates.shopTagline !== undefined) dbUpdates.shop_tagline = updates.shopTagline;
    if (updates.shopHeaderColor !== undefined) dbUpdates.shop_header_color = updates.shopHeaderColor;
    if (updates.shopAccentColor !== undefined) dbUpdates.shop_accent_color = updates.shopAccentColor;
    if (updates.shopBannerUrl !== undefined) dbUpdates.shop_banner_url = updates.shopBannerUrl;
    if (updates.shopLogoUrl !== undefined) dbUpdates.shop_logo_url = updates.shopLogoUrl;
    await supabase.from('user_settings').update(dbUpdates).eq('user_id', user.id);
    setSettings(prev => ({ ...prev, ...updates }));
  }, [user, ensureRow]);

  const setPin = useCallback(async (pin: string) => {
    const hash = simpleHash(pin);
    await updateSettings({ pinHash: hash });
    setPinLocked(false);
  }, [updateSettings]);

  const verifyPin = useCallback((pin: string) => {
    return simpleHash(pin) === settings.pinHash;
  }, [settings.pinHash]);

  const removePin = useCallback(async () => {
    await updateSettings({ pinHash: null });
    setPinLocked(false);
  }, [updateSettings]);

  const shouldShowBackupReminder = useCallback(() => {
    const last = new Date(settings.lastBackupReminder);
    const now = new Date();
    const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  }, [settings.lastBackupReminder]);

  const dismissBackupReminder = useCallback(async () => {
    await updateSettings({ lastBackupReminder: new Date().toISOString() });
  }, [updateSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, pinLocked, setPinLocked, updateSettings, setPin, verifyPin, removePin, shouldShowBackupReminder, dismissBackupReminder }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
