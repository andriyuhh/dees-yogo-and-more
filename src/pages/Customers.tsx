import { useState } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Users, Phone, MapPin, ShoppingCart, Search, Pencil, Trash2, Gift, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Customer } from '@/types/yogurt';

function EditCustomerDialog({ customer, onSave }: { customer: Customer; onSave: (updates: Partial<Customer>) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address || '');
  const [notes, setNotes] = useState(customer.notes || '');

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) { setName(customer.name); setPhone(customer.phone); setAddress(customer.address || ''); setNotes(customer.notes || ''); }
    setOpen(isOpen);
  };

  const handleSubmit = () => {
    onSave({ name, phone, address: address || undefined, notes: notes || undefined });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 hover:scale-110 transition-all">
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader><DialogTitle>Edit Customer ✏️</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <Button onClick={handleSubmit} className="w-full gradient-berry text-primary-foreground rounded-xl shadow-md">Save Changes ✨</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoyaltyBadge({ customer, onRedeem }: { customer: Customer; onRedeem: () => void }) {
  const nextRewardAt = 10 * (customer.loyaltyRewardsClaimed + 1);
  const progress = customer.purchaseCount % 10;
  const canRedeem = customer.purchaseCount >= nextRewardAt;

  return (
    <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Loyalty Program</span>
        </div>
        {customer.loyaltyRewardsClaimed > 0 && (
          <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full font-bold">
            🎁 {customer.loyaltyRewardsClaimed} redeemed
          </span>
        )}
      </div>
      <div className="flex gap-1 mb-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full transition-all ${i < progress ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{customer.purchaseCount} purchases • {canRedeem ? '🎉 Free cup ready!' : `${10 - progress} more to go`}</span>
        {canRedeem && (
          <Button size="sm" onClick={onRedeem} className="h-6 text-[10px] gradient-berry text-primary-foreground rounded-full px-3">
            <Gift className="h-3 w-3 mr-1" /> Redeem Free Cup
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { customers, getCustomerOrders, updateCustomer, deleteCustomer, redeemLoyaltyReward, loading } = useYogurtStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const selectedCustomer = customers.find(c => c.id === selectedId);
  const customerOrders = selectedCustomer ? getCustomerOrders(selectedCustomer.phone) : [];

  const handleRedeem = (id: string) => {
    redeemLoyaltyReward(id);
    toast.success('🎁 Free cup redeemed! Customer will love it!');
  };

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <h1 className="text-2xl font-extrabold">Customers 👥</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
          <Users className="h-4 w-4" /> {customers.length}
        </div>
      </div>

      <div className="relative mb-4 animate-slide-up">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone... 🔍" className="pl-9 rounded-xl" />
      </div>

      {selectedCustomer ? (
        <div className="animate-fade-in">
          <button onClick={() => setSelectedId(null)} className="text-sm text-primary font-semibold mb-3 hover:underline">← Back to list</button>
          <div className="card-playful mb-4 animate-scale-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold">{selectedCustomer.name}</h2>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1"><Phone className="h-3 w-3" /> {selectedCustomer.phone}</div>
                {selectedCustomer.address && <div className="flex items-start gap-1 text-sm text-muted-foreground mt-1"><MapPin className="h-3 w-3 mt-0.5" /> {selectedCustomer.address}</div>}
                {selectedCustomer.notes && <p className="text-xs text-muted-foreground mt-1 italic">📝 {selectedCustomer.notes}</p>}
                <p className="text-xs text-muted-foreground mt-2">Customer since {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1">
                <EditCustomerDialog customer={selectedCustomer} onSave={(u) => updateCustomer(selectedCustomer.id, u)} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 hover:scale-110 transition-all"><Trash2 className="h-3 w-3" /></button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {selectedCustomer.name}?</AlertDialogTitle>
                      <AlertDialogDescription>This will remove the customer record permanently.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { deleteCustomer(selectedCustomer.id); setSelectedId(null); }} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <LoyaltyBadge customer={selectedCustomer} onRedeem={() => handleRedeem(selectedCustomer.id)} />
          </div>

          <h3 className="font-bold text-sm mb-2 flex items-center gap-1"><ShoppingCart className="h-4 w-4" /> Order History ({customerOrders.length})</h3>
          <div className="space-y-2">
            {customerOrders.map((order, i) => (
              <div key={order.id} className="card-playful animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold">{order.items.map(i => `${i.quantity}x ${i.flavorName}`).join(', ')}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-warning/20 text-warning' : order.status === 'completed' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>{order.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="font-bold text-sm">Le {order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {customerOrders.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No orders yet</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => {
            const orderCount = getCustomerOrders(c.phone).length;
            const nextRewardAt = 10 * (c.loyaltyRewardsClaimed + 1);
            const canRedeem = c.purchaseCount >= nextRewardAt;
            return (
              <button key={c.id} onClick={() => setSelectedId(c.id)} className="w-full card-playful text-left animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{c.name}</p>
                      {canRedeem && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">🎁 Free cup!</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {c.phone}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-primary">{orderCount} order{orderCount !== 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-muted-foreground">{c.purchaseCount} purchases</p>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 animate-bounce-in">
              <p className="text-5xl mb-3">👥</p>
              <p className="text-muted-foreground font-medium">
                {customers.length === 0 ? "No customers yet — they'll appear when you create orders!" : 'No results found'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
