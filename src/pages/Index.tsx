import { useYogurtStore } from '@/hooks/useYogurtStore';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle, LogOut } from 'lucide-react';
import logo from '@/assets/logo.jpg';

function MetricCard({ icon: Icon, label, value, subtitle, variant = 'default', delay = 0 }: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'berry';
  delay?: number;
}) {
  const bgMap = {
    default: 'bg-card border border-border/50',
    success: 'gradient-fresh',
    warning: 'gradient-sunset',
    berry: 'gradient-berry',
  };
  const textMap = {
    default: 'text-foreground',
    success: 'text-success-foreground',
    warning: 'text-warning-foreground',
    berry: 'text-primary-foreground',
  };

  return (
    <div
      className={`rounded-2xl p-4 ${bgMap[variant]} ${variant !== 'default' ? textMap[variant] : ''} animate-slide-up hover-lift shadow-sm`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 opacity-80" />
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { totalSales, totalExpenses, profit, pendingOrders, lowStockFlavors, sales, orders, loading } = useYogurtStore();
  const { signOut } = useAuth();

  const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="h-16 bg-muted rounded-2xl animate-pulse" />
        <div className="h-32 bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-muted rounded-2xl animate-pulse" />
          <div className="h-24 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <header className="mb-6 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 gradient-berry rounded-full blur opacity-30 animate-pulse" />
            <img src={logo} alt="Dee's Yogo & More" className="w-12 h-12 rounded-full object-cover shadow-lg relative" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Welcome back 👋</p>
            <h1 className="text-xl font-extrabold text-foreground">Dee's Yogo & More</h1>
          </div>
        </div>
        <button
          onClick={signOut}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      {/* Today highlight */}
      <div className="gradient-berry rounded-2xl p-5 mb-6 text-primary-foreground animate-bounce-in shadow-lg relative overflow-hidden">
        <div className="absolute top-2 right-4 text-4xl opacity-20 animate-float">🍦</div>
        <p className="text-sm font-semibold opacity-80">Today's Revenue</p>
        <p className="text-3xl font-extrabold mt-1">Le {todayRevenue.toFixed(2)}</p>
        <p className="text-xs mt-2 opacity-70">{todaySales.length} sale{todaySales.length !== 1 ? 's' : ''} today</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard icon={DollarSign} label="Total Sales" value={`Le ${totalSales.toFixed(0)}`} delay={50} />
        <MetricCard icon={TrendingDown} label="Expenses" value={`Le ${totalExpenses.toFixed(0)}`} delay={100} />
        <MetricCard icon={TrendingUp} label="Profit" value={`Le ${profit.toFixed(0)}`} variant="success" subtitle={profit >= 0 ? '🎉 Looking good!' : '⚠️ Needs attention'} delay={150} />
        <MetricCard icon={ShoppingCart} label="Pending" value={`${pendingOrders.length}`} variant="berry" subtitle={`${orders.length} total orders`} delay={200} />
      </div>

      {/* Stock alerts */}
      {lowStockFlavors.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 animate-slide-up mb-6" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning animate-wiggle" />
            <span className="text-sm font-bold text-warning">Low Stock Alert</span>
          </div>
          <div className="space-y-1.5">
            {lowStockFlavors.map(f => (
              <div key={f.id} className="flex items-center justify-between text-sm">
                <span>{f.emoji} {f.name}</span>
                <span className="font-bold text-warning">{f.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
        <h2 className="text-lg font-bold mb-3">Recent Orders</h2>
        <div className="space-y-2">
          {orders.slice(0, 3).map((order, i) => (
            <div key={order.id} className={`card-playful flex items-center justify-between animate-fade-in stagger-${i + 1}`}>
              <div>
                <p className="font-semibold text-sm">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{order.items.map(i => `${i.quantity}x ${i.flavorName}`).join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">Le {order.totalAmount.toFixed(2)}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  order.status === 'pending' ? 'bg-warning/20 text-warning' :
                  order.status === 'completed' ? 'bg-success/20 text-success' :
                  'bg-destructive/20 text-destructive'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-8 animate-bounce-in">
              <p className="text-4xl mb-2">🍨</p>
              <p className="text-muted-foreground">No orders yet — let's get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
