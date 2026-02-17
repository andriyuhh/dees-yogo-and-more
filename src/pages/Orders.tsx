import { useState } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Plus, Phone, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Order, OrderItem } from '@/types/yogurt';

function NewOrderDialog({ onAdd }: { onAdd: (order: Omit<Order, 'id' | 'createdAt'>) => void }) {
  const { flavors } = useYogurtStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState<Record<string, number>>({});

  const handleSubmit = () => {
    const orderItems: OrderItem[] = Object.entries(items)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const f = flavors.find(f => f.id === id)!;
        return { flavorId: id, flavorName: f.name, quantity: qty, unitPrice: f.pricePerUnit };
      });
    if (!name || orderItems.length === 0) return;
    const total = orderItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    onAdd({ customerName: name, customerPhone: phone, items: orderItems, status: 'pending', totalAmount: total, notes: '' });
    setName(''); setPhone(''); setItems({}); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-berry text-primary-foreground rounded-full shadow-lg" size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Customer Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone" />
          </div>
          <div>
            <Label>Items</Label>
            <div className="space-y-2 mt-1">
              {flavors.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
                  <span className="text-sm font-medium">{f.emoji} {f.name} — ${f.pricePerUnit}</span>
                  <Input
                    type="number" min={0} className="w-16 h-8 text-center text-sm"
                    value={items[f.id] || ''}
                    onChange={e => setItems({ ...items, [f.id]: parseInt(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-berry text-primary-foreground">Create Order</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OrdersPage() {
  const { orders, addOrder, updateOrderStatus } = useYogurtStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold">Orders</h1>
        <NewOrderDialog onAdd={addOrder} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
              filter === f ? 'gradient-berry text-primary-foreground shadow' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="bg-card rounded-xl p-4 shadow-sm animate-fade-in">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold">{order.customerName}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> {order.customerPhone}
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                order.status === 'pending' ? 'bg-warning/20 text-warning' :
                order.status === 'completed' ? 'bg-success/20 text-success' :
                'bg-destructive/20 text-destructive'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {order.items.map(i => `${i.quantity}x ${i.flavorName}`).join(', ')}
            </div>
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-lg">${order.totalAmount.toFixed(2)}</p>
              {order.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="h-8 w-8 rounded-full bg-success/20 text-success flex items-center justify-center hover:bg-success/30 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="h-8 w-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No orders found</p>
        )}
      </div>
    </div>
  );
}
