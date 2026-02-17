import { useYogurtStore } from '@/hooks/useYogurtStore';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';
import logo from '@/assets/logo.jpg';

function MetricCard({ icon: Icon, label, value, subtitle, variant = 'default' }: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'berry';
}) {
  const bgMap = {
    default: 'bg-card',
    success: 'gradient-fresh',
    warning: 'bg-warning',
    berry: 'gradient-berry',
  };
  const textMap = {
    default: 'text-foreground',
    success: 'text-success-foreground',
    warning: 'text-warning-foreground',
    berry: 'text-primary-foreground',
  };

  return (
    <div className={`rounded-xl p-4 ${bgMap[variant]} ${variant !== 'default' ? textMap[variant] : ''} animate-fade-in shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 opacity-80" />
        <span className={`text-xs font-semibold uppercase tracking-wide opacity-70`}>{label}</span>
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { totalSales, totalExpenses, profit, pendingOrders, lowStockFlavors, sales, orders } = useYogurtStore();

  const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="px-4 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <img src={logo} alt="Dee's Yogo & More" className="w-12 h-12 rounded-full object-cover shadow" />
        <div>
          <p className="text-sm text-muted-foreground font-medium">Welcome back 👋</p>
          <h1 className="text-2xl font-extrabold text-foreground">Dee's Yogo & More</h1>
        </div>
      </header>

      {/* Today highlight */}
      <div className="gradient-berry rounded-2xl p-5 mb-6 text-primary-foreground animate-fade-in shadow-lg">
        <p className="text-sm font-semibold opacity-80">Today's Revenue</p>
        <p className="text-3xl font-extrabold mt-1">Le {todayRevenue.toFixed(2)}</p>
        <p className="text-xs mt-2 opacity-70">{todaySales.length} sale{todaySales.length !== 1 ? 's' : ''} today</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard icon={DollarSign} label="Total Sales" value={`Le ${totalSales.toFixed(2)}`} variant="default" />
        <MetricCard icon={TrendingDown} label="Expenses" value={`Le ${totalExpenses.toFixed(2)}`} variant="default" />
        <MetricCard icon={TrendingUp} label="Profit" value={`Le ${profit.toFixed(2)}`} variant="success" subtitle={profit >= 0 ? 'Looking good!' : 'Needs attention'} />
        <MetricCard icon={ShoppingCart} label="Pending" value={`${pendingOrders.length}`} variant="berry" subtitle={`${orders.length} total orders`} />
      </div>

      {/* Stock alerts */}
      {lowStockFlavors.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
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
      <div className="mt-6 mb-4">
        <h2 className="text-lg font-bold mb-3">Recent Orders</h2>
        <div className="space-y-2">
          {orders.slice(0, 3).map(order => (
            <div key={order.id} className="bg-card rounded-xl p-3 flex items-center justify-between shadow-sm animate-fade-in">
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
        </div>
      </div>
    </div>
  );
}
