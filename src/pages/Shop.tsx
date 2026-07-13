import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Minus, Plus, ShoppingBag, Sparkles, Truck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import fallbackLogo from '@/assets/logo.png';

const SUPABASE_URL = 'https://conmajmzzzveawxzwjwn.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbm1ham16enp2ZWF3eHp3anduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTI3ODEsImV4cCI6MjA4Njk4ODc4MX0.xRpO3BmP3qgD4LYdGStMkP_wYNDW-mHgGc9gJRhpNIs';

interface ShopFlavor {
  id: string;
  name: string;
  emoji: string;
  price_per_unit: number;
  stock: number;
}

interface MenuResponse {
  business_name: string;
  tagline: string;
  header_color?: string;
  accent_color?: string;
  banner_url?: string;
  logo_url?: string;
  whatsapp_number: string;
  delivery_fee: number;
  flavors: ShopFlavor[];
  error?: string;
}

const PAYMENT_METHODS = [
  { key: 'cash', label: '💵 Cash on delivery' },
  { key: 'orange_money', label: '🟠 Orange Money' },
  { key: 'afrimoney', label: '📱 AfriMoney' },
  { key: 'qmoney', label: '💜 QMoney' },
];

type Step = 'menu' | 'details' | 'done';

export default function Shop() {
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('menu');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<null | { orderId: string; total: number; waHref: string }>(null);

  useEffect(() => {
    document.title = 'Order online — GULP by Andrea';
    fetch(`${SUPABASE_URL}/functions/v1/shop-menu`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    })
      .then(async (r) => {
        const data = (await r.json()) as MenuResponse;
        if (!r.ok) throw new Error(data.error || 'Could not load menu');
        setMenu(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const subtotal = useMemo(() => {
    if (!menu) return 0;
    return menu.flavors.reduce((s, f) => s + (cart[f.id] || 0) * f.price_per_unit, 0);
  }, [cart, menu]);

  const deliveryFee = address.trim() && menu ? menu.delivery_fee : 0;
  const total = subtotal + deliveryFee;
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const headerColor = menu?.header_color || '#ec4899';
  const accentColor = menu?.accent_color || '#db2777';
  const logoSrc = menu?.logo_url || fallbackLogo;

  const setQty = (id: string, qty: number) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!menu) return;
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Please add your name and phone', variant: 'destructive' });
      return;
    }
    if (cartCount === 0) {
      toast({ title: 'Add at least one item to your cart', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/place-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          deliveryAddress: address.trim() || undefined,
          paymentMethod: payment,
          notes: notes.trim() || undefined,
          items: Object.entries(cart).map(([flavorId, quantity]) => ({ flavorId, quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not place order');

      const itemLines = (data.items as { flavorName: string; quantity: number; unitPrice: number }[])
        .map((i) => `• ${i.quantity}x ${i.flavorName} — Le ${(i.quantity * i.unitPrice).toLocaleString()}`)
        .join('\n');
      const paymentLabel = PAYMENT_METHODS.find(p => p.key === payment)?.label || payment;
      const msg =
        `🍦 *New GULP Order!*\n\n` +
        `👤 ${name.trim()}\n📞 ${phone.trim()}\n\n` +
        `*Items:*\n${itemLines}\n\n` +
        `Subtotal: Le ${(data.subtotal as number).toLocaleString()}` +
        (data.delivery_fee > 0 ? `\nDelivery: Le ${(data.delivery_fee as number).toLocaleString()}` : '') +
        `\n*TOTAL: Le ${(data.total_amount as number).toLocaleString()}*\n\n` +
        `💰 Payment: ${paymentLabel}\n` +
        (address.trim() ? `📍 Address: ${address.trim()}` : '🏪 Pickup') +
        (notes.trim() ? `\n📝 Notes: ${notes.trim()}` : '') +
        `\n\nOrder #${(data.order_id as string).slice(0, 8).toUpperCase()}`;
      const waHref = `https://wa.me/${menu.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;

      setPlaced({ orderId: data.order_id, total: data.total_amount, waHref });
      // Auto-open WhatsApp so the owner is notified
      window.open(waHref, '_blank');
      setCart({});
      setStep('done');
    } catch (e) {
      toast({ title: 'Order failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 p-6 text-center">
        <div>
          <p className="text-4xl mb-3">😢</p>
          <p className="font-bold text-pink-700">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">Please try again shortly.</p>
        </div>
      </div>
    );
  }
  if (!menu) return null;

  // ------- Done screen -------
  if (step === 'done' && placed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: `linear-gradient(180deg, ${headerColor}22, #ffffff 60%)` }}
      >
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-scale-in">
          <div
            className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${headerColor}, ${accentColor})` }}
          >
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: accentColor }}>
            Thank you for ordering from {menu.business_name}! 🎉
          </h1>
          <p className="text-muted-foreground mb-4">
            Hi {name.split(' ')[0]}, your order{' '}
            <span className="font-mono font-bold">#{placed.orderId.slice(0, 8).toUpperCase()}</span>{' '}
            is on its way to us. We'll confirm on WhatsApp shortly.
          </p>
          <p className="text-3xl font-black mb-6" style={{ color: accentColor }}>
            Le {placed.total.toLocaleString()}
          </p>
          <a
            href={placed.waHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-full mb-2 shadow-md"
          >
            <MessageCircle className="h-5 w-5" /> Confirm on WhatsApp
          </a>
          <Button
            variant="ghost"
            onClick={() => {
              setPlaced(null);
              setName(''); setPhone(''); setAddress(''); setNotes('');
              setStep('menu');
            }}
          >
            Place another order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: `linear-gradient(180deg, ${headerColor}0f 0%, #ffffff 40%, ${headerColor}0a 100%)` }}>
      {/* Hero header */}
      <header
        className="relative overflow-hidden text-white px-5 pt-10 pb-16 rounded-b-[36px] shadow-2xl"
        style={{
          background: menu.banner_url
            ? `linear-gradient(135deg, ${headerColor}dd, ${accentColor}dd), url(${menu.banner_url}) center/cover`
            : `linear-gradient(135deg, ${headerColor}, ${accentColor})`,
        }}
      >
        {/* decorative blobs */}
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt={menu.business_name}
              className="h-16 w-16 rounded-2xl bg-white/25 backdrop-blur-sm p-1 shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-black leading-tight drop-shadow">{menu.business_name}</h1>
              <p className="text-white/90 text-sm italic">{menu.tagline}</p>
            </div>
          </div>
          <div className="mt-5 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
            <p className="text-sm font-medium leading-snug">
              🍦 Fresh yogurt, made with love. Pick your favorites — we'll deliver joy.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <StepDot active={step === 'menu'} label="1" />
            <div className="h-0.5 w-8 bg-white/40" />
            <StepDot active={step === 'details'} label="2" />
          </div>
          <p className="text-center text-xs text-white/90 mt-2 font-semibold">
            {step === 'menu' ? 'Step 1 · Choose your treats' : 'Step 2 · Your details'}
          </p>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-8 relative">
        {step === 'menu' && (
          <section className="bg-white rounded-3xl shadow-xl p-5 mb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-lg" style={{ color: accentColor }}>
                🍦 Our Menu
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: accentColor }}>
                {menu.flavors.length} flavors
              </span>
            </div>

            {menu.flavors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No flavors available right now — check back soon! 💫
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              {menu.flavors.map((f) => {
                const qty = cart[f.id] || 0;
                const active = qty > 0;
                return (
                  <div
                    key={f.id}
                    className={`relative rounded-2xl p-3 border-2 transition-all ${
                      active ? 'shadow-lg -translate-y-0.5' : 'shadow-sm'
                    }`}
                    style={{
                      borderColor: active ? accentColor : `${headerColor}22`,
                      background: active ? `${headerColor}10` : '#fff',
                    }}
                  >
                    <div className="text-4xl text-center mb-1">{f.emoji || '🍦'}</div>
                    <p className="font-extrabold text-sm text-center leading-tight line-clamp-2 min-h-[2.5rem]">
                      {f.name}
                    </p>
                    <p className="text-center text-xs font-bold mt-1" style={{ color: accentColor }}>
                      Le {f.price_per_unit.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <button
                        onClick={() => setQty(f.id, qty - 1)}
                        disabled={qty === 0}
                        className="h-7 w-7 rounded-full bg-white border-2 disabled:opacity-40 flex items-center justify-center"
                        style={{ borderColor: `${accentColor}55`, color: accentColor }}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center font-black text-sm">{qty}</span>
                      <button
                        onClick={() => setQty(f.id, Math.min(f.stock, qty + 1))}
                        disabled={qty >= f.stock}
                        className="h-7 w-7 rounded-full text-white disabled:opacity-40 flex items-center justify-center shadow-sm"
                        style={{ background: accentColor }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {step === 'details' && (
          <section className="bg-white rounded-3xl shadow-xl p-5 space-y-3 animate-fade-in">
            <button
              onClick={() => setStep('menu')}
              className="flex items-center gap-1 text-sm font-bold mb-1"
              style={{ color: accentColor }}
            >
              <ArrowLeft className="h-4 w-4" /> Back to menu
            </button>

            <h2 className="font-black text-lg" style={{ color: accentColor }}>
              📝 Your details
            </h2>

            {/* Cart preview */}
            <div className="rounded-2xl p-3 space-y-1" style={{ background: `${headerColor}12` }}>
              {menu.flavors.filter(f => cart[f.id]).map(f => (
                <div key={f.id} className="flex justify-between text-sm">
                  <span className="font-semibold">{f.emoji} {cart[f.id]}× {f.name}</span>
                  <span className="font-bold">Le {(cart[f.id] * f.price_per_unit).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div>
              <Label>Full name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Andrea Kamara" />
            </div>
            <div>
              <Label>WhatsApp / Phone *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="+232 76 000 000" />
            </div>
            <div>
              <Label>Delivery address <span className="text-muted-foreground font-normal">(leave blank for pickup)</span></Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} placeholder="Street, area, landmark" className="min-h-[60px]" />
              {address.trim() && menu.delivery_fee > 0 && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: accentColor }}>
                  <Truck className="h-3 w-3" /> Delivery fee: Le {menu.delivery_fee.toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <Label>Payment method</Label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {PAYMENT_METHODS.map((p) => {
                  const active = payment === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPayment(p.key)}
                      className="px-3 py-2 rounded-xl text-xs font-bold transition-all border-2"
                      style={{
                        background: active ? accentColor : '#fff',
                        color: active ? '#fff' : accentColor,
                        borderColor: active ? accentColor : `${accentColor}33`,
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Any special instructions" className="min-h-[50px]" />
            </div>
          </section>
        )}
      </div>

      {/* Sticky bottom bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-3 z-40">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                {cartCount} item{cartCount > 1 ? 's' : ''}{step === 'details' && deliveryFee > 0 ? ' + delivery' : ''}
              </p>
              <p className="text-lg font-black" style={{ color: accentColor }}>
                Le {total.toLocaleString()}
              </p>
            </div>
            {step === 'menu' ? (
              <Button
                onClick={() => setStep('details')}
                className="text-white font-bold rounded-full px-6 shadow-lg"
                style={{ background: accentColor }}
              >
                Next <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="text-white font-bold rounded-full px-6 shadow-lg"
                style={{ background: accentColor }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShoppingBag className="h-4 w-4 mr-2" /> Place order</>}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
        active ? 'bg-white text-pink-600 scale-110 shadow-md' : 'bg-white/30 text-white'
      }`}
    >
      {label}
    </div>
  );
}
