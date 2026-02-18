import { useYogurtStore } from '@/hooks/useYogurtStore';

export default function SalesPage() {
  const { sales, totalSales, totalExpenses, profit } = useYogurtStore();

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-extrabold mb-4">Sales & Finances</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-card rounded-xl p-3 text-center shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Revenue</p>
          <p className="text-lg font-extrabold text-foreground">Le {totalSales.toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Expenses</p>
          <p className="text-lg font-extrabold text-foreground">Le {totalExpenses.toFixed(0)}</p>
        </div>
        <div className="gradient-fresh rounded-xl p-3 text-center shadow-sm">
          <p className="text-[10px] font-semibold text-success-foreground/80 uppercase">Profit</p>
          <p className="text-lg font-extrabold text-success-foreground">Le {profit.toFixed(0)}</p>
        </div>
      </div>

      <h2 className="font-bold text-sm mb-3">Sales History</h2>
      <div className="space-y-2">
        {sales.map(s => (
          <div key={s.id} className="bg-card rounded-xl p-3 flex items-center justify-between shadow-sm animate-fade-in">
            <div>
              <p className="text-sm font-semibold">{s.items.map(i => `${i.quantity}x ${i.flavorName}`).join(', ')}</p>
              <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</p>
            </div>
            <p className="font-extrabold text-success">Le {s.totalAmount.toFixed(2)}</p>
          </div>
        ))}
        {sales.length === 0 && <p className="text-center text-muted-foreground py-8">No sales yet — complete orders to see them here!</p>}
      </div>
    </div>
  );
}
