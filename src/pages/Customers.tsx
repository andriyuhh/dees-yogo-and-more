import { useState } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Users, Phone, MapPin, ShoppingCart, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CustomersPage() {
  const { customers, getCustomerOrders } = useYogurtStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const selectedCustomer = customers.find(c => c.id === selectedId);
  const customerOrders = selectedCustomer ? getCustomerOrders(selectedCustomer.phone) : [];

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold">Customers</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" /> {customers.length}
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="pl-9"
        />
      </div>

      {selectedCustomer ? (
        <div className="animate-fade-in">
          <button
            onClick={() => setSelectedId(null)}
            className="text-sm text-primary font-semibold mb-3 hover:underline"
          >
            ← Back to list
          </button>
          <div className="bg-card rounded-xl p-4 shadow-sm mb-4">
            <h2 className="text-xl font-extrabold">{selectedCustomer.name}</h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Phone className="h-3 w-3" /> {selectedCustomer.phone}
            </div>
            {selectedCustomer.address && (
              <div className="flex items-start gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mt-0.5" /> {selectedCustomer.address}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Customer since {new Date(selectedCustomer.createdAt).toLocaleDateString()}
            </p>
          </div>

          <h3 className="font-bold text-sm mb-2 flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" /> Order History ({customerOrders.length})
          </h3>
          <div className="space-y-2">
            {customerOrders.map(order => (
              <div key={order.id} className="bg-card rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold">{order.items.map(i => `${i.quantity}x ${i.flavorName}`).join(', ')}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    order.status === 'pending' ? 'bg-warning/20 text-warning' :
                    order.status === 'completed' ? 'bg-success/20 text-success' :
                    'bg-destructive/20 text-destructive'
                  }`}>{order.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="font-bold text-sm">Le {order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {customerOrders.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No orders yet</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const orderCount = getCustomerOrders(c.phone).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="w-full bg-card rounded-xl p-4 shadow-sm text-left hover:ring-2 hover:ring-primary/20 transition-all animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{c.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-primary">{orderCount} order{orderCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {customers.length === 0 ? 'No customers yet — they\'ll appear here when you create orders!' : 'No results found'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
