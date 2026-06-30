import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Calculator, TrendingUp, Lightbulb, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function PricingCalculator() {
  const navigate = useNavigate();
  const { flavors, updateFlavor } = useYogurtStore();

  const [ingredientCost, setIngredientCost] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);
  const [laborMinutes, setLaborMinutes] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [overheadPct, setOverheadPct] = useState(10);
  const [marginPct, setMarginPct] = useState(50);
  const [applyToFlavorId, setApplyToFlavorId] = useState<string>('');

  const calc = useMemo(() => {
    const laborCost = (laborMinutes / 60) * hourlyRate;
    const directCost = ingredientCost + packagingCost + laborCost;
    const overheadCost = directCost * (overheadPct / 100);
    const totalCost = directCost + overheadCost;
    const profit = totalCost * (marginPct / 100);
    const suggestedPrice = totalCost + profit;
    const roundedPrice = Math.ceil(suggestedPrice / 5) * 5; // round up to nearest Le 5
    return { laborCost, directCost, overheadCost, totalCost, profit, suggestedPrice, roundedPrice };
  }, [ingredientCost, packagingCost, laborMinutes, hourlyRate, overheadPct, marginPct]);

  const handleApply = () => {
    if (!applyToFlavorId) {
      toast.error('Pick a flavor to apply this price to');
      return;
    }
    updateFlavor(applyToFlavorId, { costPerUnit: calc.totalCost, pricePerUnit: calc.roundedPrice });
    toast.success('Price applied to flavor! 🎉');
  };

  const tip = marginPct < 30
    ? 'Margin is low — consider raising it for sustainability.'
    : marginPct > 100
    ? 'Very high margin — make sure competitors aren\'t much cheaper.'
    : 'Healthy margin for a small home business!';

  return (
    <div className="px-4 pt-6 pb-28 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 animate-fade-in">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" /> Pricing Calculator
        </h1>
      </div>

      <p className="text-xs text-muted-foreground mb-5 animate-fade-in">
        Enter your real costs and we'll suggest a fair price that covers everything plus your profit. 💡
      </p>

      {/* Cost inputs */}
      <div className="card-playful mb-4 animate-slide-up">
        <h2 className="font-bold text-sm mb-3">💰 Costs per Unit</h2>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Ingredients cost (Le)</Label>
            <Input type="number" min={0} value={ingredientCost || ''} onChange={e => setIngredientCost(+e.target.value)} placeholder="e.g. milk, sugar, fruit..." />
          </div>
          <div>
            <Label className="text-xs">Packaging cost (Le)</Label>
            <Input type="number" min={0} value={packagingCost || ''} onChange={e => setPackagingCost(+e.target.value)} placeholder="Cup, lid, spoon..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Labor time (min)</Label>
              <Input type="number" min={0} value={laborMinutes || ''} onChange={e => setLaborMinutes(+e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Your hourly rate (Le)</Label>
              <Input type="number" min={0} value={hourlyRate || ''} onChange={e => setHourlyRate(+e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>
      </div>

      {/* Overhead & margin sliders */}
      <div className="card-playful mb-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h2 className="font-bold text-sm mb-3">📊 Overhead & Profit</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-xs">Overhead (rent, utilities, etc.)</Label>
              <span className="text-xs font-bold text-primary">{overheadPct}%</span>
            </div>
            <Slider value={[overheadPct]} onValueChange={v => setOverheadPct(v[0])} max={50} step={1} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-xs">Profit margin</Label>
              <span className="text-xs font-bold text-primary">{marginPct}%</span>
            </div>
            <Slider value={[marginPct]} onValueChange={v => setMarginPct(v[0])} max={150} step={5} />
          </div>
        </div>
        <div className="mt-3 p-2 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground">{tip}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="card-playful mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h2 className="font-bold text-sm mb-3">🧮 Breakdown</h2>
        <div className="space-y-1.5 text-sm">
          <Row label="Ingredients" value={ingredientCost} />
          <Row label="Packaging" value={packagingCost} />
          <Row label="Labor" value={calc.laborCost} />
          <Row label="Overhead" value={calc.overheadCost} />
          <div className="border-t border-border pt-1.5 mt-1.5">
            <Row label="Total cost" value={calc.totalCost} bold />
          </div>
          <Row label={`Profit (${marginPct}%)`} value={calc.profit} muted />
        </div>
      </div>

      {/* Suggested price */}
      <div className="gradient-berry rounded-2xl p-5 mb-4 text-primary-foreground animate-bounce-in shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 opacity-80" />
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">Suggested price</p>
        </div>
        <p className="text-4xl font-extrabold">Le {calc.roundedPrice.toLocaleString()}</p>
        <p className="text-xs opacity-80 mt-1">
          Exact: Le {calc.suggestedPrice.toFixed(2)} · rounded up to nearest Le 5
        </p>
      </div>

      {/* Apply to flavor */}
      {flavors.length > 0 && (
        <div className="card-playful animate-slide-up" style={{ animationDelay: '150ms' }}>
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Save className="h-4 w-4 text-primary" /> Apply to existing flavor
          </h2>
          <div className="flex gap-2 flex-wrap mb-3">
            {flavors.map(f => (
              <button
                key={f.id}
                onClick={() => setApplyToFlavorId(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  applyToFlavorId === f.id
                    ? 'gradient-berry text-primary-foreground shadow-md scale-105'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {f.emoji} {f.name}
              </button>
            ))}
          </div>
          <Button onClick={handleApply} disabled={!applyToFlavorId} className="w-full gradient-berry text-primary-foreground rounded-xl">
            Update flavor price to Le {calc.roundedPrice}
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: number; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold' : ''} ${muted ? 'text-muted-foreground' : ''}`}>
      <span>{label}</span>
      <span>Le {value.toFixed(2)}</span>
    </div>
  );
}
