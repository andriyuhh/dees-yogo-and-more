import { useMemo } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { useSettings } from '@/hooks/useSettings';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import logo from '@/assets/logo.jpg';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

function MetricCard({ icon: Icon, label, value, subtitle, variant = 'default', delay = 0 }: {
  icon: React.ElementType; label: string; value: string; subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'berry'; delay?: number;
}) {
  const bgMap = { default: 'bg-card border border-border/50', success: 'gradient-fresh', warning: 'gradient-sunset', berry: 'gradient-berry' };
  const textMap = { default: 'text-foreground', success: 'text-success-foreground', warning: 'text-warning-foreground', berry: 'text-primary-foreground' };

  return (
    <div className={`rounded-2xl p-4 ${bgMap[variant]} ${variant !== 'default' ? textMap[variant] : ''} animate-slide-up hover-lift shadow-sm`} style={{ animationDelay: `${delay}ms` }}>
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
  const { settings } = useSettings();

  const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Daily sales for last 7 days
  const dailySalesData = useMemo(() => {
    const days: { name: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
      const revenue = sales.filter(s => new Date(s.date).toDateString() === dateStr).reduce((sum, s) => sum + s.totalAmount, 0);
      days.push({ name: dayLabel, revenue: Math.round(revenue) });
    }
    return days;
  }, [sales]);

  // Top selling flavors
  const topFlavorsData = useMemo(() => {
    const flavorMap: Record<string, number> = {};
    sales.forEach(s => s.items.forEach(i => {
      flavorMap[i.flavorName] = (flavorMap[i.flavorName] || 0) + i.quantity;
    }));
    return Object.entries(flavorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [sales]);

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
        <div className="h-9 w-9" /> {/* spacer */}
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
        {!settings.hideProfit && <MetricCard icon={TrendingUp} label="Profit" value={`Le ${profit.toFixed(0)}`} variant="success" subtitle={profit >= 0 ? '🎉 Looking good!' : '⚠️ Needs attention'} delay={150} />}
        <MetricCard icon={ShoppingCart} label="Pending" value={`${pendingOrders.length}`} variant="berry" subtitle={`${orders.length} total orders`} delay={200} />
      </div>

      {/* Sales chart */}
      {sales.length > 0 && (
        <div className="card-playful mb-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <h2 className="text-sm font-bold mb-3">📈 Last 7 Days</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySalesData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip formatter={(v: number) => [`Le ${v}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top flavors pie */}
      {topFlavorsData.length > 0 && (
        <div className="card-playful mb-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-sm font-bold mb-3">🏆 Top Selling Flavors</h2>
          <div className="flex items-center gap-4">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topFlavorsData} cx="50%" cy="50%" innerRadius={25} outerRadius={55} dataKey="value" stroke="none">
                    {topFlavorsData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              {topFlavorsData.map((f, idx) => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="truncate font-medium">{f.name}</span>
                  <span className="ml-auto font-bold text-muted-foreground">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stock alerts */}
      {lowStockFlavors.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 animate-slide-up mb-6" style={{ animationDelay: '350ms' }}>
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
      <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
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
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-warning/20 text-warning' : order.status === 'completed' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
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
