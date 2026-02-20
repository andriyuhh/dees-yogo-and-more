import { useYogurtStore } from '@/hooks/useYogurtStore';

export default function SalesPage() {
  const { sales, totalSales, totalExpenses, profit, loading } = useYogurtStore();

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        {[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-extrabold mb-4 animate-fade-in">Sales & Finances 💰</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="card-playful text-center animate-slide-up stagger-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Revenue</p>
          <p className="text-lg font-extrabold text-foreground">Le {totalSales.toFixed(0)}</p>
        </div>
        <div className="card-playful text-center animate-slide-up stagger-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Expenses</p>
          <p className="text-lg font-extrabold text-foreground">Le {totalExpenses.toFixed(0)}</p>
        </div>
        <div className="gradient-fresh rounded-2xl p-4 text-center shadow-sm animate-slide-up stagger-3">
          <p className="text-[10px] font-semibold text-success-foreground/80 uppercase">Profit</p>
          <p className="text-lg font-extrabold text-success-foreground">Le {profit.toFixed(0)}</p>
        </div>
      </div>

      <h2 className="font-bold text-sm mb-3 animate-fade-in">Sales History</h2>
      <div className="space-y-2">
        {sales.map((s, i) => (
          <div key={s.id} className="card-playful flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div>
              <p className="text-sm font-semibold">{s.items.map(i => `${i.quantity}x ${i.flavorName}`).join(', ')}</p>
              <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</p>
            </div>
            <p className="font-extrabold text-success">+Le {s.totalAmount.toFixed(2)}</p>
          </div>
        ))}
        {sales.length === 0 && (
          <div className="text-center py-12 animate-bounce-in">
            <p className="text-5xl mb-3">📊</p>
            <p className="text-muted-foreground font-medium">No sales yet — complete orders to see them here!</p>
          </div>
        )}
      </div>
    </div>
  );
}
