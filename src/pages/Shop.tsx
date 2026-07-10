import { useEffect, useMemo, useState } from 'react';
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';

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

export default function Shop() {
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      // Build WhatsApp message to owner
      const itemLines = (data.items as { flavorName: string; quantity: number; unitPrice: number }[])
        .map((i) => `• ${i.quantity}x ${i.flavorName} — Le ${(i.quantity * i.unitPrice).toLocaleString()}`)
        .join('\n');
      const msg =
        `New GULP order from ${name.trim()} (${phone.trim()})\n\n` +
        itemLines +
        `\n\nSubtotal: Le ${(data.subtotal as number).toLocaleString()}` +
        (data.delivery_fee > 0 ? `\nDelivery: Le ${(data.delivery_fee as number).toLocaleString()}` : '') +
        `\nTOTAL: Le ${(data.total_amount as number).toLocaleString()}` +
        `\nPayment: ${payment}` +
        (address.trim() ? `\nAddress: ${address.trim()}` : '\nPickup') +
        (notes.trim() ? `\nNotes: ${notes.trim()}` : '') +
        `\n\nOrder ID: ${(data.order_id as string).slice(0, 8).toUpperCase()}`;
      const waHref = `https://wa.me/${menu.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;

      setPlaced({ orderId: data.order_id, total: data.total_amount, waHref });
      // Auto-open WhatsApp so the owner gets notified
      window.open(waHref, '_blank');
      setCart({});
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

  if (placed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <p className="text-6xl mb-4">🎉</p>
          <h1 className="text-2xl font-extrabold text-pink-600 mb-2">Order placed!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you, {name}. Your order <span className="font-mono font-bold">#{placed.orderId.slice(0, 8).toUpperCase()}</span>{' '}
            has been sent to GULP by Andrea.
          </p>
          <p className="text-3xl font-black text-pink-600 mb-6">Le {placed.total.toLocaleString()}</p>
          <a
            href={placed.waHref}
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-full mb-2"
          >
            💬 Confirm on WhatsApp
          </a>
          <Button variant="ghost" onClick={() => { setPlaced(null); setName(''); setPhone(''); setAddress(''); setNotes(''); }}>
            Place another order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50 pb-32">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-5 pt-8 pb-10 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <img src={logoImg} alt="GULP by Andrea" className="h-16 w-16 rounded-2xl bg-white/20 p-1" />
          <div>
            <h1 className="text-2xl font-black leading-tight">{menu.business_name}</h1>
            <p className="text-pink-100 text-sm italic">{menu.tagline}</p>
          </div>
        </div>
        <p className="text-center text-pink-100 mt-4 text-sm max-w-md mx-auto">
          Pick your flavors, add your details, and we'll confirm on WhatsApp.
        </p>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-6">
        {/* Menu */}
        <section className="bg-white rounded-3xl shadow-md p-5 mb-4">
          <h2 className="font-extrabold text-lg mb-3 text-pink-700">🍦 Menu</h2>
          {menu.flavors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No flavors available right now — check back soon!</p>
          )}
          <div className="space-y-3">
            {menu.flavors.map((f) => {
              const qty = cart[f.id] || 0;
              return (
                <div key={f.id} className="flex items-center justify-between bg-pink-50/60 rounded-2xl px-3 py-2">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{f.emoji} {f.name}</p>
                    <p className="text-xs text-pink-600 font-semibold">Le {f.price_per_unit.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQty(f.id, qty - 1)}
                      disabled={qty === 0}
                      className="h-8 w-8 rounded-full bg-white text-pink-600 border border-pink-200 disabled:opacity-40 flex items-center justify-center"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center font-bold text-sm">{qty}</span>
                    <button
                      onClick={() => setQty(f.id, Math.min(f.stock, qty + 1))}
                      disabled={qty >= f.stock}
                      className="h-8 w-8 rounded-full bg-pink-500 text-white disabled:opacity-40 flex items-center justify-center"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Checkout form */}
        <section className="bg-white rounded-3xl shadow-md p-5 space-y-3">
          <h2 className="font-extrabold text-lg text-pink-700">📝 Your details</h2>
          <div>
            <Label>Full name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Andrea Kamara" />
          </div>
          <div>
            <Label>WhatsApp / Phone *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="+232 76 000 000" />
          </div>
          <div>
            <Label>Delivery address (leave blank for pickup)</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} placeholder="Street, area, landmark" className="min-h-[60px]" />
            {address.trim() && menu.delivery_fee > 0 && (
              <p className="text-xs text-pink-600 mt-1">Delivery fee: Le {menu.delivery_fee.toLocaleString()}</p>
            )}
          </div>
          <div>
            <Label>Payment method</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PAYMENT_METHODS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPayment(p.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    payment === p.key ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Any special instructions" className="min-h-[50px]" />
          </div>
        </section>
      </div>

      {/* Sticky checkout bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-3 z-40">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{cartCount} item{cartCount > 1 ? 's' : ''}</p>
              <p className="text-lg font-black text-pink-600">Le {total.toLocaleString()}</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full px-6"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShoppingBag className="h-4 w-4 mr-2" /> Place order</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
