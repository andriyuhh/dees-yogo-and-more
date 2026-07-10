import { useState, useMemo } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { useSettings } from '@/hooks/useSettings';
import { Plus, Phone, Check, X, MapPin, Truck, Pencil, Trash2, Share2, FileDown, CalendarIcon, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import logoImg from '@/assets/logo.png';
import type { Order, OrderItem } from '@/types/yogurt';

type DatePreset = 'all' | 'today' | 'week' | 'month' | 'custom';

function OrderFormDialog({ order, onSave, trigger }: {
  order?: Order;
  onSave: (data: Omit<Order, 'id' | 'createdAt'>) => void;
  trigger: React.ReactNode;
}) {
  const { flavors, customers } = useYogurtStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(order?.customerName || '');
  const [phone, setPhone] = useState(order?.customerPhone || '');
  const [address, setAddress] = useState(order?.deliveryAddress || '');
  const [deliveryFee, setDeliveryFee] = useState(order?.deliveryFee || 0);
  const [isPaid, setIsPaid] = useState(order?.isPaid || false);
  const [paymentMethod, setPaymentMethod] = useState<string>(order?.paymentMethod || '');
  const [items, setItems] = useState<Record<string, number>>(() => {
    if (!order) return {};
    const map: Record<string, number> = {};
    order.items.forEach(i => { map[i.flavorId] = i.quantity; });
    return map;
  });
  const [notes, setNotes] = useState(order?.notes || '');

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && order) {
      setName(order.customerName); setPhone(order.customerPhone);
      setAddress(order.deliveryAddress || ''); setDeliveryFee(order.deliveryFee);
      setIsPaid(order.isPaid); setPaymentMethod(order.paymentMethod || '');
      const map: Record<string, number> = {};
      order.items.forEach(i => { map[i.flavorId] = i.quantity; });
      setItems(map); setNotes(order.notes || '');
    }
    setOpen(isOpen);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (!order) {
      const existing = customers.find(c => c.phone === value);
      if (existing) { setName(existing.name); if (existing.address) setAddress(existing.address); }
    }
  };

  const handleSubmit = () => {
    const orderItems: OrderItem[] = Object.entries(items)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const f = flavors.find(f => f.id === id)!;
        return { flavorId: id, flavorName: f.name, quantity: qty, unitPrice: f.pricePerUnit };
      });
    if (!name || orderItems.length === 0) return;
    const subtotal = orderItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    onSave({
      customerName: name, customerPhone: phone,
      deliveryAddress: address || undefined, deliveryFee,
      items: orderItems, status: order?.status || 'pending',
      totalAmount: subtotal + deliveryFee, notes: notes || undefined,
      isPaid, paymentMethod: (paymentMethod || undefined) as Order['paymentMethod'],
    });
    if (!order) { setName(''); setPhone(''); setAddress(''); setDeliveryFee(0); setItems({}); setNotes(''); setIsPaid(false); setPaymentMethod(''); }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{order ? 'Edit Order ✏️' : 'New Order 🛒'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="animate-fade-in stagger-1"><Label>Phone</Label><Input value={phone} onChange={e => handlePhoneChange(e.target.value)} placeholder="Auto-fills returning customers ✨" /></div>
          <div className="animate-fade-in stagger-2"><Label>Customer Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" /></div>
          <div className="animate-fade-in stagger-3"><Label>📍 Delivery Address</Label><Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Optional" className="min-h-[60px]" /></div>
          <div className="animate-fade-in stagger-4"><Label>🚗 Delivery Fee (Le)</Label><Input type="number" min={0} value={deliveryFee || ''} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} /></div>
          <div className="animate-fade-in stagger-5">
            <Label>Items</Label>
            <div className="space-y-2 mt-1">
              {flavors.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2 hover-lift">
                  <span className="text-sm font-medium">{f.emoji} {f.name} — Le {f.pricePerUnit}</span>
                  <Input type="number" min={0} className="w-16 h-8 text-center text-sm" value={items[f.id] || ''} onChange={e => setItems({ ...items, [f.id]: parseInt(e.target.value) || 0 })} />
                </div>
              ))}
              {flavors.length === 0 && <p className="text-sm text-muted-foreground">Add flavors in Inventory first 🍨</p>}
            </div>
          </div>
          <div className="animate-fade-in stagger-6"><Label>Notes (optional)</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions" /></div>
          <div className="animate-fade-in stagger-6">
            <Label>💰 Payment</Label>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setIsPaid(!isPaid)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isPaid ? 'bg-success/20 text-success' : 'bg-destructive/15 text-destructive'}`}>
                {isPaid ? '✅ Paid' : '❌ Unpaid'}
              </button>
              {isPaid && (
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setPaymentMethod('cash')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${paymentMethod === 'cash' ? 'gradient-berry text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    💵 Cash
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('orange_money')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${paymentMethod === 'orange_money' ? 'gradient-berry text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    🟠 OM
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('afrimoney')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${paymentMethod === 'afrimoney' ? 'gradient-berry text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    📱 AM
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('qmoney')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${paymentMethod === 'qmoney' ? 'gradient-berry text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    💜 QMoney
                  </button>
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-berry text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-shadow">
            {order ? 'Save Changes ✨' : 'Create Order ✨'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateInvoiceText(order: Order, opts?: { paymentTerms?: string; footerNotes?: string }): string {
  const itemsSubtotal = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const paymentTerms = opts?.paymentTerms?.trim();
  const footerNotes = opts?.footerNotes?.trim();
  const lines = [
    `*GULP BY ANDREA*`,
    `_"Sip. Smile. Repeat."_`,
    ``,
    `━━━━━━━━━━━━━━━━━`,
    `*INVOICE*`,
    `━━━━━━━━━━━━━━━━━`,
    ``,
    `*Date:* ${new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    `*Customer:* ${order.customerName}`,
    `*Phone:* ${order.customerPhone}`,
    order.deliveryAddress ? `*Address:* ${order.deliveryAddress}` : '',
    ``,
    `━━━━━━━━━━━━━━━━━`,
    `*ORDER DETAILS*`,
    `━━━━━━━━━━━━━━━━━`,
    ...order.items.map(i =>
      `- ${i.flavorName} x ${i.quantity}\n   Le ${i.unitPrice.toFixed(2)} each -> *Le ${(i.quantity * i.unitPrice).toFixed(2)}*`
    ),
    ``,
    `───────────────────`,
    `   Subtotal: Le ${itemsSubtotal.toFixed(2)}`,
    order.deliveryFee > 0 ? `   Delivery: Le ${order.deliveryFee.toFixed(2)}` : '',
    `───────────────────`,
    `   *TOTAL: Le ${order.totalAmount.toFixed(2)}*`,
    `━━━━━━━━━━━━━━━━━`,
    order.notes ? `\n_${order.notes}_` : '',
    paymentTerms ? `\n*Payment Terms*\n${paymentTerms}` : '',
    footerNotes ? `\n${footerNotes}` : `\nThank you for choosing *GULP by Andrea*!\nWe appreciate your patronage.`,
  ].filter(Boolean).join('\n');
  return lines;
}

function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = src;
  });
}

// GULP brand palette
const BRAND = {
  pink: [233, 30, 99] as [number, number, number],       // primary hot pink
  pinkDark: [173, 20, 87] as [number, number, number],   // deeper pink
  pinkSoft: [252, 228, 236] as [number, number, number], // wash / row highlight
  ink: [30, 30, 30] as [number, number, number],         // near-black for body text
  muted: [120, 120, 120] as [number, number, number],
  line: [240, 210, 224] as [number, number, number],
};

async function generateInvoicePDF(order: Order, opts?: { paymentTerms?: string; footerNotes?: string }): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  // Top brand band
  doc.setFillColor(...BRAND.pink);
  doc.rect(0, 0, pageW, 10, 'F');

  // Logo (PNG preserves transparency)
  let logoDrawn = false;
  try {
    const logoData = await loadImageAsBase64(logoImg);
    doc.addImage(logoData, 'PNG', margin, 18, 34, 22);
    logoDrawn = true;
  } catch { /* skip logo if fails */ }

  // Business wordmark next to logo (fallback if logo missing)
  if (!logoDrawn) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...BRAND.pink);
    doc.text('GULP', margin, 32);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.ink);
    doc.text('by Andrea', margin + 22, 32);
  }

  // Tagline under logo
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text('Sip. Smile. Repeat.', margin, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Freetown, Sierra Leone', margin, 51);

  // INVOICE title - right aligned
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.pink);
  doc.text('INVOICE', pageW - margin, 26, { align: 'right' });

  // Invoice number & date - right aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.muted);
  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Invoice #${order.id.slice(0, 8).toUpperCase()}`, pageW - margin, 34, { align: 'right' });
  doc.text(dateStr, pageW - margin, 39, { align: 'right' });

  // Divider
  let y = 58;
  doc.setDrawColor(...BRAND.line);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);

  // Bill To section
  y += 9;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.pink);
  doc.text('BILL TO', margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.ink);
  doc.text(order.customerName, margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.muted);
  doc.text(order.customerPhone, margin, y);
  if (order.deliveryAddress) {
    y += 5;
    doc.text(order.deliveryAddress, margin, y);
  }

  // Payment status - right side
  const statusY = 67;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.pink);
  doc.text('STATUS', pageW - margin, statusY, { align: 'right' });
  doc.setFontSize(11);
  const statusColor: [number, number, number] =
    order.status === 'completed' ? [34, 139, 34]
    : order.status === 'pending' ? [200, 150, 0]
    : [200, 50, 50];
  doc.setTextColor(...statusColor);
  doc.text(order.status.toUpperCase(), pageW - margin, statusY + 6, { align: 'right' });

  // Table
  y = Math.max(y, statusY + 12) + 10;
  const colX = { item: margin + 3, qty: margin + 90, price: margin + 118, amount: pageW - margin - 3 };

  // Table header
  doc.setFillColor(...BRAND.pink);
  doc.roundedRect(margin, y - 5, contentW, 9, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ITEM', colX.item, y);
  doc.text('QTY', colX.qty, y, { align: 'center' });
  doc.text('PRICE', colX.price, y, { align: 'center' });
  doc.text('AMOUNT', colX.amount, y, { align: 'right' });

  // Table rows
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  order.items.forEach((item, idx) => {
    const amount = item.quantity * item.unitPrice;
    if (idx % 2 === 0) {
      doc.setFillColor(...BRAND.pinkSoft);
      doc.rect(margin, y - 4, contentW, 7, 'F');
    }
    doc.setTextColor(...BRAND.ink);
    doc.text(item.flavorName, colX.item, y);
    doc.text(String(item.quantity), colX.qty, y, { align: 'center' });
    doc.text(`Le ${item.unitPrice.toLocaleString()}`, colX.price, y, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Le ${amount.toLocaleString()}`, colX.amount, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 7;
  });

  // Totals section
  y += 4;
  doc.setDrawColor(...BRAND.line);
  doc.line(margin + 80, y, pageW - margin, y);
  y += 7;
  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.ink);
  doc.text('Subtotal', margin + 105, y);
  doc.text(`Le ${subtotal.toLocaleString()}`, colX.amount, y, { align: 'right' });

  if (order.deliveryFee > 0) {
    y += 6;
    doc.text('Delivery Fee', margin + 105, y);
    doc.text(`Le ${order.deliveryFee.toLocaleString()}`, colX.amount, y, { align: 'right' });
  }

  // Total box
  y += 9;
  doc.setFillColor(...BRAND.pink);
  doc.roundedRect(margin + 88, y - 6, contentW - 88, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL', margin + 105, y + 1);
  doc.text(`Le ${order.totalAmount.toLocaleString()}`, colX.amount, y + 1, { align: 'right' });

  // Notes
  if (order.notes) {
    y += 18;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.pink);
    doc.text('NOTES', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.muted);
    const wrapped = doc.splitTextToSize(order.notes, contentW);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 4;
  }

  // Payment Terms block
  const paymentTerms = opts?.paymentTerms?.trim();
  if (paymentTerms) {
    y += 10;
    doc.setFillColor(...BRAND.pinkSoft);
    const termsLines = doc.splitTextToSize(paymentTerms, contentW - 10);
    const boxH = 10 + termsLines.length * 4;
    doc.roundedRect(margin, y - 4, contentW, boxH, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.pinkDark);
    doc.text('PAYMENT TERMS', margin + 5, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.ink);
    doc.text(termsLines, margin + 5, y + 7);
    y += boxH;
  }

  // Footer
  const footerY = pageH - 22;
  doc.setDrawColor(...BRAND.line);
  doc.line(margin, footerY - 6, pageW - margin, footerY - 6);
  const footerNotes = opts?.footerNotes?.trim();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.pinkDark);
  if (footerNotes) {
    const fLines = doc.splitTextToSize(footerNotes, pageW - margin * 2);
    doc.text(fLines, pageW / 2, footerY, { align: 'center' });
  } else {
    doc.text('Thank you for your patronage.', pageW / 2, footerY, { align: 'center' });
  }
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text('GULP by Andrea  |  Sip. Smile. Repeat.', pageW / 2, footerY + 5, { align: 'center' });

  // Bottom brand band
  doc.setFillColor(...BRAND.pink);
  doc.rect(0, pageH - 8, pageW, 8, 'F');

  return doc;
}


async function shareInvoicePDF(order: Order, invoiceOpts?: { paymentTerms?: string; footerNotes?: string }) {
  const doc = await generateInvoicePDF(order, invoiceOpts);
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], `Invoice-${order.customerName.replace(/\s/g, '_')}.pdf`, { type: 'application/pdf' });

  // Try native share (works on mobile with WhatsApp)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Invoice', text: `Invoice for ${order.customerName} - GULP by Andrea` });
  } else {
    // Fallback: download PDF + open WhatsApp with text
    doc.save(file.name);
    const text = generateInvoiceText(order, invoiceOpts);
    const phone = order.customerPhone.replace(/[^0-9+]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  }
}

export default function OrdersPage() {
  const { orders, addOrder, updateOrder, deleteOrder, updateOrderStatus, loading } = useYogurtStore();
  const { settings } = useSettings();
  const invoiceOpts = { paymentTerms: settings.invoicePaymentTerms, footerNotes: settings.invoiceFooterNotes };
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const dateFiltered = useMemo(() => {
    if (datePreset === 'all') return orders;
    const now = new Date();
    let start: Date, end: Date;
    if (datePreset === 'today') {
      start = startOfDay(now); end = endOfDay(now);
    } else if (datePreset === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 });
    } else if (datePreset === 'month') {
      start = startOfMonth(now); end = endOfMonth(now);
    } else {
      // custom
      if (!customFrom) return orders;
      start = startOfDay(customFrom);
      end = customTo ? endOfDay(customTo) : endOfDay(customFrom);
    }
    return orders.filter(o => {
      const d = new Date(o.createdAt);
      return isWithinInterval(d, { start, end });
    });
  }, [orders, datePreset, customFrom, customTo]);

  const filtered = filter === 'all' ? dateFiltered : dateFiltered.filter(o => o.status === filter);

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <h1 className="text-2xl font-extrabold">Orders 📋</h1>
        <OrderFormDialog
          onSave={addOrder}
          trigger={
            <Button className="gradient-berry text-primary-foreground rounded-full shadow-lg hover-lift" size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Order
            </Button>
          }
        />
      </div>

      {/* Date filter presets */}
      <div className="flex flex-wrap gap-1.5 mb-2 animate-slide-up">
        {([
          { key: 'all', label: '📅 All Time' },
          { key: 'today', label: '📌 Today' },
          { key: 'week', label: '📆 This Week' },
          { key: 'month', label: '🗓️ This Month' },
          { key: 'custom', label: '🔍 Custom' },
        ] as { key: DatePreset; label: string }[]).map(p => (
          <button key={p.key} onClick={() => setDatePreset(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${datePreset === p.key ? 'gradient-berry text-primary-foreground shadow-md scale-105' : 'bg-secondary text-secondary-foreground hover:scale-105'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range picker */}
      {datePreset === 'custom' && (
        <div className="flex gap-2 mb-3 animate-fade-in">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs rounded-xl flex-1 justify-start", !customFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                {customFrom ? format(customFrom, 'dd MMM yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs rounded-xl flex-1 justify-start", !customTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                {customTo ? format(customTo, 'dd MMM yyyy') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customTo} onSelect={setCustomTo} disabled={(d) => customFrom ? d < customFrom : false} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 mb-4 animate-slide-up">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all duration-200 ${filter === f ? 'gradient-berry text-primary-foreground shadow-md scale-105' : 'bg-secondary text-secondary-foreground hover:scale-105'}`}>
            {f === 'pending' ? '⏳ ' : f === 'completed' ? '✅ ' : ''}{f}
          </button>
        ))}
      </div>

      {/* Order count summary */}
      <p className="text-xs text-muted-foreground mb-2">{filtered.length} order{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="space-y-3">
        {filtered.map((order, i) => (
          <div key={order.id} className="card-playful animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold">{order.customerName}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {order.customerPhone}</div>
                {order.deliveryAddress && (
                  <div className="flex items-start gap-1 text-xs text-muted-foreground mt-1"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /> {order.deliveryAddress}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-warning/20 text-warning' : order.status === 'completed' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                  {order.status === 'pending' ? '⏳' : order.status === 'completed' ? '✅' : '❌'} {order.status}
                </span>
                <button
                  onClick={() => updateOrder(order.id, { isPaid: !order.isPaid, paymentMethod: !order.isPaid ? (order.paymentMethod || 'cash') : order.paymentMethod })}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${order.isPaid ? 'bg-success/20 text-success' : 'bg-destructive/15 text-destructive'}`}
                >
                  {order.isPaid ? `✅ ${order.paymentMethod === 'orange_money' ? '🟠 OM' : order.paymentMethod === 'afrimoney' ? '📱 AM' : order.paymentMethod === 'qmoney' ? '💜 QMoney' : '💵 Cash'}` : '❌ Unpaid'}
                </button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">{order.items.map(i => `${i.quantity}x ${i.flavorName}`).join(', ')}</div>
            {order.deliveryFee > 0 && <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1"><Truck className="h-3 w-3" /> Delivery: Le {order.deliveryFee.toFixed(2)}</div>}
            {order.notes && <p className="text-xs text-muted-foreground italic mb-2">📝 {order.notes}</p>}
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-lg">Le {order.totalAmount.toFixed(2)}</p>
              <div className="flex gap-1.5">
                <button onClick={() => shareInvoicePDF(order, invoiceOpts)} className="h-8 w-8 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center hover:bg-green-500/30 hover:scale-110 transition-all" title="Share PDF invoice">
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                {order.status === 'pending' && (
                  <>
                    <OrderFormDialog
                      order={order}
                      onSave={(data) => updateOrder(order.id, data)}
                      trigger={
                        <button className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 hover:scale-110 transition-all">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      }
                    />
                    <button onClick={() => updateOrderStatus(order.id, 'completed')} className="h-8 w-8 rounded-full bg-success/20 text-success flex items-center justify-center hover:bg-success/30 hover:scale-110 transition-all"><Check className="h-4 w-4" /></button>
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="h-8 w-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30 hover:scale-110 transition-all"><X className="h-4 w-4" /></button>
                  </>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 hover:scale-110 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                      <AlertDialogDescription>Order for {order.customerName} will be permanently deleted.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteOrder(order.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 animate-bounce-in">
            <p className="text-5xl mb-3">📦</p>
            <p className="text-muted-foreground font-medium">No orders yet — tap "New Order" to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
