import { useState } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Plus, Trash2, Receipt, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CATEGORIES = ['Ingredients', 'Packaging', 'Equipment', 'Transport', 'Rent', 'Salary', 'Utilities', 'Other'];

function AddExpenseDialog({ onAdd }: { onAdd: (e: any) => void }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Ingredients');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const handleSubmit = () => {
    if (!desc || !amount) return;
    onAdd({
      description: desc,
      amount,
      date: new Date().toISOString(),
      category,
      isRecurring,
      recurringFrequency: isRecurring ? frequency : undefined,
    });
    setDesc(''); setAmount(0); setIsRecurring(false); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-berry text-primary-foreground rounded-full shadow-lg" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Description</Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was it for?" />
          </div>
          <div>
            <Label>Amount (Le)</Label>
            <Input type="number" value={amount || ''} onChange={e => setAmount(+e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Category</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    category === c ? 'gradient-berry text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="recurring" className="text-sm cursor-pointer">Recurring expense</Label>
          </div>
          {isRecurring && (
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${
                    frequency === f ? 'gradient-berry text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
          <Button onClick={handleSubmit} className="w-full gradient-berry text-primary-foreground">Add Expense</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const { expenses, totalExpenses, addExpense, deleteExpense } = useYogurtStore();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filtered = filterCategory === 'all' ? expenses : expenses.filter(e => e.category === filterCategory);
  const usedCategories = [...new Set(expenses.map(e => e.category))];

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold">Expenses</h1>
        <AddExpenseDialog onAdd={addExpense} />
      </div>

      {/* Total */}
      <div className="bg-card rounded-xl p-4 shadow-sm mb-4 text-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Total Expenses</p>
        <p className="text-2xl font-extrabold text-destructive">Le {totalExpenses.toFixed(2)}</p>
      </div>

      {/* Category filter */}
      {usedCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterCategory === 'all' ? 'gradient-berry text-primary-foreground shadow' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            All
          </button>
          {usedCategories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterCategory === c ? 'gradient-berry text-primary-foreground shadow' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => (
          <div key={e.id} className="bg-card rounded-xl p-3 flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{e.description}</p>
                {e.isRecurring && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {e.recurringFrequency}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{e.category} · {new Date(e.date).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-extrabold text-destructive">-Le {e.amount.toFixed(2)}</p>
              <button
                onClick={() => deleteExpense(e.id)}
                className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No expenses yet — tap "Add Expense" to start tracking!</p>
        )}
      </div>
    </div>
  );
}
