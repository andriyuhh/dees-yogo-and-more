import { useState, useMemo } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Plus, Trash2, CalendarIcon, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Ingredients', 'Packaging', 'Equipment', 'Transport', 'Rent', 'Salary', 'Utilities', 'Other'];

function AddExpenseDialog({ onAdd }: { onAdd: (e: any) => void }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Ingredients');
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const handleSubmit = () => {
    if (!desc || !amount) return;
    onAdd({
      description: desc,
      amount,
      date: expenseDate.toISOString(),
      category,
      isRecurring,
      recurringFrequency: isRecurring ? frequency : undefined,
    });
    setDesc(''); setAmount(0); setIsRecurring(false); setExpenseDate(new Date()); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-berry text-primary-foreground rounded-full shadow-lg hover-lift" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader><DialogTitle>New Expense 💸</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="animate-fade-in stagger-1">
            <Label>Description</Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was it for?" />
          </div>
          <div className="animate-fade-in stagger-2">
            <Label>Amount (Le)</Label>
            <Input type="number" value={amount || ''} onChange={e => setAmount(+e.target.value)} placeholder="0" />
          </div>
          <div className="animate-fade-in stagger-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !expenseDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(expenseDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expenseDate}
                  onSelect={(d) => d && setExpenseDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="animate-fade-in stagger-3">
            <Label>Category</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                    category === c ? 'gradient-berry text-primary-foreground scale-105 shadow' : 'bg-secondary text-secondary-foreground hover:scale-105'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 animate-fade-in stagger-4">
            <input type="checkbox" id="recurring" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded" />
            <Label htmlFor="recurring" className="text-sm cursor-pointer">🔄 Recurring expense</Label>
          </div>
          {isRecurring && (
            <div className="flex gap-2 animate-scale-in">
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
          <Button onClick={handleSubmit} className="w-full gradient-berry text-primary-foreground rounded-xl shadow-md">Add Expense ✨</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const { expenses, totalExpenses, addExpense, deleteExpense, loading } = useYogurtStore();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Weekly comparison
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisWeek = expenses.filter(e => isWithinInterval(new Date(e.date), { start: thisWeekStart, end: thisWeekEnd }));
    const lastWeek = expenses.filter(e => isWithinInterval(new Date(e.date), { start: lastWeekStart, end: lastWeekEnd }));

    const thisTotal = thisWeek.reduce((s, e) => s + e.amount, 0);
    const lastTotal = lastWeek.reduce((s, e) => s + e.amount, 0);
    const diff = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

    return { thisTotal, lastTotal, diff, thisWeekExpenses: thisWeek };
  }, [expenses]);

  // Group expenses by date
  const grouped = useMemo(() => {
    const filtered = filterCategory === 'all' ? expenses : expenses.filter(e => e.category === filterCategory);
    const groups: Record<string, typeof expenses> = {};
    for (const e of filtered) {
      const key = format(new Date(e.date), 'yyyy-MM-dd');
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        label: format(new Date(date), 'EEE, MMM d, yyyy'),
        items,
        total: items.reduce((s, e) => s + e.amount, 0),
      }));
  }, [expenses, filterCategory]);

  const usedCategories = [...new Set(expenses.map(e => e.category))];

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        {[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <h1 className="text-2xl font-extrabold">Expenses 💸</h1>
        <AddExpenseDialog onAdd={addExpense} />
      </div>

      {/* Weekly comparison cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card-playful text-center animate-bounce-in">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">This Week</p>
          <p className="text-lg font-extrabold text-destructive">Le {weeklyStats.thisTotal.toFixed(0)}</p>
        </div>
        <div className="card-playful text-center animate-bounce-in" style={{ animationDelay: '60ms' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Last Week</p>
          <p className="text-lg font-extrabold text-muted-foreground">Le {weeklyStats.lastTotal.toFixed(0)}</p>
        </div>
      </div>

      {weeklyStats.lastTotal > 0 && (
        <div className={cn(
          "card-playful flex items-center gap-2 mb-4 animate-slide-up",
          weeklyStats.diff > 0 ? "border-destructive/30" : "border-primary/30"
        )}>
          {weeklyStats.diff > 0 ? (
            <TrendingUp className="h-4 w-4 text-destructive" />
          ) : weeklyStats.diff < 0 ? (
            <TrendingDown className="h-4 w-4 text-primary" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <p className="text-xs font-semibold">
            {weeklyStats.diff > 0
              ? `Spending up ${weeklyStats.diff.toFixed(0)}% vs last week 📈`
              : weeklyStats.diff < 0
              ? `Spending down ${Math.abs(weeklyStats.diff).toFixed(0)}% vs last week 🎉`
              : 'Same spending as last week'}
          </p>
        </div>
      )}

      {/* Total */}
      <div className="card-playful text-center mb-4 animate-bounce-in">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Total All-Time</p>
        <p className="text-2xl font-extrabold text-destructive">Le {totalExpenses.toFixed(2)}</p>
      </div>

      {/* Category filter */}
      {usedCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4 animate-slide-up">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
              filterCategory === 'all' ? 'gradient-berry text-primary-foreground shadow scale-105' : 'bg-secondary text-secondary-foreground hover:scale-105'
            }`}
          >
            All
          </button>
          {usedCategories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                filterCategory === c ? 'gradient-berry text-primary-foreground shadow scale-105' : 'bg-secondary text-secondary-foreground hover:scale-105'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Grouped by date */}
      <div className="space-y-4">
        {grouped.map((group, gi) => (
          <div key={group.date} className="animate-slide-up" style={{ animationDelay: `${gi * 50}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground">📅 {group.label}</p>
              <p className="text-xs font-extrabold text-destructive">-Le {group.total.toFixed(0)}</p>
            </div>
            <div className="space-y-2">
              {group.items.map(e => (
                <div key={e.id} className="card-playful flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{e.description}</p>
                      {e.isRecurring && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          🔄 {e.recurringFrequency}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{e.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-destructive">-Le {e.amount.toFixed(2)}</p>
                    <button
                      onClick={() => deleteExpense(e.id)}
                      className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 hover:scale-110 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="text-center py-12 animate-bounce-in">
            <p className="text-5xl mb-3">🧾</p>
            <p className="text-muted-foreground font-medium">No expenses yet — tap "Add Expense" to start tracking!</p>
          </div>
        )}
      </div>
    </div>
  );
}
