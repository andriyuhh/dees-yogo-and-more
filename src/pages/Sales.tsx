import { useState, useMemo } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { useSettings } from '@/hooks/useSettings';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Period = '7d' | '30d' | '90d' | 'all';

export default function SalesPage() {
  const { sales, expenses, totalSales, totalExpenses, profit, orders, loading } = useYogurtStore();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('30d');

  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 9999;
    const cutoffDate = new Date(now.getTime() - cutoff * 86400000);

    const filteredSales = sales.filter(s => new Date(s.date) >= cutoffDate);
    const filteredExpenses = expenses.filter(e => new Date(e.date) >= cutoffDate);

    const revenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const expense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const net = revenue - expense;
    const completedOrders = orders.filter(o => o.status === 'completed' && new Date(o.createdAt) >= cutoffDate).length;
    const avgOrderValue = completedOrders > 0 ? revenue / completedOrders : 0;

    // Daily revenue trend
    const dayMap = new Map<string, { revenue: number; expenses: number }>();
    filteredSales.forEach(s => {
      const key = new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dayMap.get(key) || { revenue: 0, expenses: 0 };
      existing.revenue += s.totalAmount;
      dayMap.set(key, existing);
    });
    filteredExpenses.forEach(e => {
      const key = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dayMap.get(key) || { revenue: 0, expenses: 0 };
      existing.expenses += e.amount;
      dayMap.set(key, existing);
    });
    const dailyTrend = Array.from(dayMap.entries())
      .map(([date, vals]) => ({ date, revenue: vals.revenue, expenses: vals.expenses, profit: vals.revenue - vals.expenses }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14);

    // Top flavors
    const flavorMap = new Map<string, number>();
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        flavorMap.set(item.flavorName, (flavorMap.get(item.flavorName) || 0) + item.quantity);
      });
    });
    const topFlavors = Array.from(flavorMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Expense breakdown
    const catMap = new Map<string, number>();
    filteredExpenses.forEach(e => {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    });
    const expenseBreakdown = Array.from(catMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Payment methods
    const payMap = new Map<string, number>();
    orders.filter(o => o.status === 'completed' && new Date(o.createdAt) >= cutoffDate && o.paymentMethod).forEach(o => {
      const method = o.paymentMethod === 'orange_money' ? 'Orange Money' : o.paymentMethod === 'afrimoney' ? 'Afrimoney' : o.paymentMethod === 'qmoney' ? 'QMoney' : 'Cash';
      payMap.set(method, (payMap.get(method) || 0) + 1);
    });
    const paymentMethods = Array.from(payMap.entries()).map(([name, value]) => ({ name, value }));

    return { revenue, expense, net, completedOrders, avgOrderValue, dailyTrend, topFlavors, expenseBreakdown, paymentMethods, salesList: filteredSales };
  }, [sales, expenses, orders, period]);

  const PIE_COLORS = [
    'hsl(340, 65%, 55%)', 'hsl(230, 55%, 55%)', 'hsl(38, 92%, 55%)',
    'hsl(150, 40%, 45%)', 'hsl(350, 80%, 65%)', 'hsl(20, 70%, 55%)',
  ];

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(150, 40%, 45%)' },
    expenses: { label: 'Expenses', color: 'hsl(0, 72%, 55%)' },
    profit: { label: 'Profit', color: 'hsl(230, 55%, 55%)' },
    quantity: { label: 'Qty Sold', color: 'hsl(340, 65%, 55%)' },
  };

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 animate-fade-in">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-extrabold">Sales & Reports 📊</h1>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto animate-slide-up">
        {(['7d', '30d', '90d', 'all'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              period === p
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="card-playful animate-slide-up stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-success" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Revenue</p>
          </div>
          <p className="text-xl font-extrabold text-foreground">Le {filteredData.revenue.toLocaleString()}</p>
        </div>
        <div className="card-playful animate-slide-up stagger-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Expenses</p>
          </div>
          <p className="text-xl font-extrabold text-foreground">Le {filteredData.expense.toLocaleString()}</p>
        </div>
        {!settings.hideProfit && (
          <div className="gradient-fresh rounded-2xl p-4 shadow-sm animate-slide-up stagger-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success-foreground/80" />
              <p className="text-[10px] font-semibold text-success-foreground/80 uppercase">Net Profit</p>
            </div>
            <p className={`text-xl font-extrabold ${filteredData.net >= 0 ? 'text-success-foreground' : 'text-destructive'}`}>
              Le {filteredData.net.toLocaleString()}
            </p>
          </div>
        )}
        <div className="card-playful animate-slide-up stagger-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Orders</p>
          </div>
          <p className="text-xl font-extrabold text-foreground">{filteredData.completedOrders}</p>
          <p className="text-[10px] text-muted-foreground">Avg Le {filteredData.avgOrderValue.toFixed(0)}</p>
        </div>
      </div>

      {/* Revenue vs Expenses Trend */}
      {filteredData.dailyTrend.length > 0 && (
        <div className="card-playful mb-5 animate-slide-up">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Revenue vs Expenses
          </h2>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={filteredData.dailyTrend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* Profit Trend Line */}
      {filteredData.dailyTrend.length > 1 && !settings.hideProfit && (
        <div className="card-playful mb-5 animate-slide-up">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Profit Trend
          </h2>
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <LineChart data={filteredData.dailyTrend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ChartContainer>
        </div>
      )}

      {/* Top Flavors & Expense Breakdown side by side */}
      <div className="grid grid-cols-1 gap-4 mb-5">
        {filteredData.topFlavors.length > 0 && (
          <div className="card-playful animate-slide-up">
            <h2 className="font-bold text-sm mb-3">🍦 Top Selling Flavors</h2>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <BarChart data={filteredData.topFlavors} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={70} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {filteredData.expenseBreakdown.length > 0 && (
          <div className="card-playful animate-slide-up">
            <h2 className="font-bold text-sm mb-3">💸 Expense Breakdown</h2>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie
                  data={filteredData.expenseBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={9}
                >
                  {filteredData.expenseBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        )}

        {filteredData.paymentMethods.length > 0 && (
          <div className="card-playful animate-slide-up">
            <h2 className="font-bold text-sm mb-3">💳 Payment Methods</h2>
            <div className="space-y-2">
              {filteredData.paymentMethods.map((pm, i) => {
                const total = filteredData.paymentMethods.reduce((s, p) => s + p.value, 0);
                const pct = total > 0 ? (pm.value / total) * 100 : 0;
                return (
                  <div key={pm.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs font-semibold flex-1">{pm.name}</span>
                    <span className="text-xs text-muted-foreground">{pm.value} orders</span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sales History */}
      <h2 className="font-bold text-sm mb-3 animate-fade-in">Recent Sales</h2>
      <div className="space-y-2">
        {filteredData.salesList.slice(0, 20).map((s, i) => (
          <div key={s.id} className="card-playful flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
            <div>
              <p className="text-sm font-semibold">{s.items.map(item => `${item.quantity}x ${item.flavorName}`).join(', ')}</p>
              <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</p>
            </div>
            <p className="font-extrabold text-success">+Le {s.totalAmount.toLocaleString()}</p>
          </div>
        ))}
        {filteredData.salesList.length === 0 && (
          <div className="text-center py-12 animate-bounce-in">
            <p className="text-5xl mb-3">📊</p>
            <p className="text-muted-foreground font-medium">No sales for this period</p>
          </div>
        )}
      </div>
    </div>
  );
}
