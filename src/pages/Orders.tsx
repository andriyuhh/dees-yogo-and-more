import { useState } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Plus, Phone, Check, X, MapPin, Truck, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Order, OrderItem } from '@/types/yogurt';

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
    });
    if (!order) { setName(''); setPhone(''); setAddress(''); setDeliveryFee(0); setItems({}); setNotes(''); }
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
          <Button onClick={handleSubmit} className="w-full gradient-berry text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-shadow">
            {order ? 'Save Changes ✨' : 'Create Order ✨'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OrdersPage() {
  const { orders, addOrder, updateOrder, deleteOrder, updateOrderStatus, loading } = useYogurtStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

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

      <div className="flex gap-2 mb-4 animate-slide-up">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all duration-200 ${filter === f ? 'gradient-berry text-primary-foreground shadow-md scale-105' : 'bg-secondary text-secondary-foreground hover:scale-105'}`}>
            {f === 'pending' ? '⏳ ' : f === 'completed' ? '✅ ' : ''}{f}
          </button>
        ))}
      </div>

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
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-warning/20 text-warning' : order.status === 'completed' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                {order.status === 'pending' ? '⏳' : order.status === 'completed' ? '✅' : '❌'} {order.status}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mb-2">{order.items.map(i => `${i.quantity}x ${i.flavorName}`).join(', ')}</div>
            {order.deliveryFee > 0 && <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1"><Truck className="h-3 w-3" /> Delivery: Le {order.deliveryFee.toFixed(2)}</div>}
            {order.notes && <p className="text-xs text-muted-foreground italic mb-2">📝 {order.notes}</p>}
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-lg">Le {order.totalAmount.toFixed(2)}</p>
              <div className="flex gap-1.5">
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
