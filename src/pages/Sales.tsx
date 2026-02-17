import { useState } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Plus, Receipt } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function AddExpenseDialog({ onAdd }: { onAdd: (e: any) => void }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Ingredients');

  const handleSubmit = () => {
    if (!desc || !amount) return;
    onAdd({ description: desc, amount, date: new Date().toISOString(), category });
    setDesc(''); setAmount(0); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Receipt className="h-4 w-4 mr-1" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Description</Label><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was it for?" /></div>
          <div><Label>Amount ($)</Label><Input type="number" value={amount} onChange={e => setAmount(+e.target.value)} /></div>
          <div><Label>Category</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {['Ingredients', 'Packaging', 'Equipment', 'Other'].map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${category === c ? 'gradient-berry text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{c}</button>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-berry text-primary-foreground">Add Expense</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SalesPage() {
  const { sales, expenses, totalSales, totalExpenses, profit, addExpense } = useYogurtStore();
  const [tab, setTab] = useState<'sales' | 'expenses'>('sales');

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-extrabold mb-4">Sales & Finances</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-card rounded-xl p-3 text-center shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Revenue</p>
          <p className="text-lg font-extrabold text-foreground">${totalSales.toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Expenses</p>
          <p className="text-lg font-extrabold text-foreground">${totalExpenses.toFixed(0)}</p>
        </div>
        <div className="gradient-fresh rounded-xl p-3 text-center shadow-sm">
          <p className="text-[10px] font-semibold text-success-foreground/80 uppercase">Profit</p>
          <p className="text-lg font-extrabold text-success-foreground">${profit.toFixed(0)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['sales', 'expenses'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${tab === t ? 'gradient-berry text-primary-foreground shadow' : 'bg-secondary text-secondary-foreground'}`}>{t}</button>
          ))}
        </div>
        {tab === 'expenses' && <AddExpenseDialog onAdd={addExpense} />}
      </div>

      {tab === 'sales' ? (
        <div className="space-y-2">
          {sales.map(s => (
            <div key={s.id} className="bg-card rounded-xl p-3 flex items-center justify-between shadow-sm animate-fade-in">
              <div>
                <p className="text-sm font-semibold">{s.items.map(i => `${i.quantity}x ${i.flavorName}`).join(', ')}</p>
                <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</p>
              </div>
              <p className="font-extrabold text-success">${s.totalAmount.toFixed(2)}</p>
            </div>
          ))}
          {sales.length === 0 && <p className="text-center text-muted-foreground py-8">No sales yet</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => (
            <div key={e.id} className="bg-card rounded-xl p-3 flex items-center justify-between shadow-sm animate-fade-in">
              <div>
                <p className="text-sm font-semibold">{e.description}</p>
                <p className="text-xs text-muted-foreground">{e.category} · {new Date(e.date).toLocaleDateString()}</p>
              </div>
              <p className="font-extrabold text-destructive">-${e.amount.toFixed(2)}</p>
            </div>
          ))}
          {expenses.length === 0 && <p className="text-center text-muted-foreground py-8">No expenses yet</p>}
        </div>
      )}
    </div>
  );
}
