import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Calculator, TrendingUp, Lightbulb, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

type MarginMode = 'markup' | 'margin';

const DEFAULTS = {
  ingredientCost: 0,
  packagingCost: 0,
  laborMinutes: 0,
  hourlyRate: 0,
  overheadPct: 10,
  marginPct: 50,
  marginMode: 'markup' as MarginMode,
  roundTo: 5,
};

// Safely parse a numeric input — never NaN, never negative
const num = (v: string) => {
  const n = parseFloat(v);
  if (!isFinite(n) || n < 0) return 0;
  return n;
};

export default function PricingCalculator() {
  const navigate = useNavigate();
  const { flavors, updateFlavor } = useYogurtStore();

  const [ingredientCost, setIngredientCost] = useState(DEFAULTS.ingredientCost);
  const [packagingCost, setPackagingCost] = useState(DEFAULTS.packagingCost);
  const [laborMinutes, setLaborMinutes] = useState(DEFAULTS.laborMinutes);
  const [hourlyRate, setHourlyRate] = useState(DEFAULTS.hourlyRate);
  const [overheadPct, setOverheadPct] = useState(DEFAULTS.overheadPct);
  const [marginPct, setMarginPct] = useState(DEFAULTS.marginPct);
  const [marginMode, setMarginMode] = useState<MarginMode>(DEFAULTS.marginMode);
  const [roundTo, setRoundTo] = useState(DEFAULTS.roundTo);
  const [applyToFlavorId, setApplyToFlavorId] = useState<string>('');

  const calc = useMemo(() => {
    const laborCost = (laborMinutes / 60) * hourlyRate;
    const directCost = ingredientCost + packagingCost + laborCost;
    const overheadCost = directCost * (overheadPct / 100);
    const totalCost = directCost + overheadCost;

    let suggestedPrice: number;
    if (marginMode === 'margin') {
      // Margin = profit / price → price = cost / (1 - margin%)
      const m = Math.min(marginPct, 99) / 100; // cap to avoid div-by-zero
      suggestedPrice = totalCost / (1 - m);
    } else {
      // Markup = profit / cost → price = cost * (1 + markup%)
      suggestedPrice = totalCost * (1 + marginPct / 100);
    }

    const profit = suggestedPrice - totalCost;
    const step = roundTo > 0 ? roundTo : 1;
    const roundedPrice = Math.ceil(suggestedPrice / step) * step;
    const roundedProfit = roundedPrice - totalCost;
    const effectiveMargin = roundedPrice > 0 ? (roundedProfit / roundedPrice) * 100 : 0;
    const effectiveMarkup = totalCost > 0 ? (roundedProfit / totalCost) * 100 : 0;

    return {
      laborCost, directCost, overheadCost, totalCost,
      profit, suggestedPrice, roundedPrice, roundedProfit,
      effectiveMargin, effectiveMarkup,
    };
  }, [ingredientCost, packagingCost, laborMinutes, hourlyRate, overheadPct, marginPct, marginMode, roundTo]);

  const handleApply = () => {
    if (!applyToFlavorId) {
      toast.error('Pick a flavor to apply this price to');
      return;
    }
    if (calc.totalCost <= 0) {
      toast.error('Enter some costs first');
      return;
    }
    updateFlavor(applyToFlavorId, {
      costPerUnit: Number(calc.totalCost.toFixed(2)),
      pricePerUnit: calc.roundedPrice,
    });
    toast.success('Price applied to flavor! 🎉');
  };

  const handleClearAll = () => {
    setIngredientCost(DEFAULTS.ingredientCost);
    setPackagingCost(DEFAULTS.packagingCost);
    setLaborMinutes(DEFAULTS.laborMinutes);
    setHourlyRate(DEFAULTS.hourlyRate);
    setOverheadPct(DEFAULTS.overheadPct);
    setMarginPct(DEFAULTS.marginPct);
    setMarginMode(DEFAULTS.marginMode);
    setRoundTo(DEFAULTS.roundTo);
    setApplyToFlavorId('');
    toast.success('Cleared all entries 🧹');
  };

  const tip = calc.effectiveMargin < 20
    ? 'Margin is thin — small cost increases could wipe profit.'
    : calc.effectiveMargin > 60
    ? 'Very high margin — double-check it stays competitive.'
    : 'Healthy margin for a small home business!';

  return (
    <div className="px-4 pt-6 pb-28 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card border border-border" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" /> Pricing
          </h1>
        </div>
        <Button onClick={handleClearAll} variant="outline" size="sm" className="rounded-full text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Clear All
        </Button>
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
            <Input type="number" min={0} step="any" inputMode="decimal" value={ingredientCost || ''} onChange={e => setIngredientCost(num(e.target.value))} placeholder="e.g. milk, sugar, fruit..." />
          </div>
          <div>
            <Label className="text-xs">Packaging cost (Le)</Label>
            <Input type="number" min={0} step="any" inputMode="decimal" value={packagingCost || ''} onChange={e => setPackagingCost(num(e.target.value))} placeholder="Cup, lid, spoon..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Labor time (min)</Label>
              <Input type="number" min={0} step="any" inputMode="decimal" value={laborMinutes || ''} onChange={e => setLaborMinutes(num(e.target.value))} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Hourly rate (Le)</Label>
              <Input type="number" min={0} step="any" inputMode="decimal" value={hourlyRate || ''} onChange={e => setHourlyRate(num(e.target.value))} placeholder="0" />
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
            <Slider value={[overheadPct]} onValueChange={v => setOverheadPct(v[0])} max={100} step={1} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs">{marginMode === 'markup' ? 'Markup (on cost)' : 'Margin (on price)'}</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{marginPct}%</span>
                <div className="flex rounded-full bg-secondary p-0.5 text-[10px] font-bold">
                  <button
                    onClick={() => setMarginMode('markup')}
                    className={`px-2 py-0.5 rounded-full transition-all ${marginMode === 'markup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >Markup</button>
                  <button
                    onClick={() => setMarginMode('margin')}
                    className={`px-2 py-0.5 rounded-full transition-all ${marginMode === 'margin' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >Margin</button>
                </div>
              </div>
            </div>
            <Slider
              value={[marginPct]}
              onValueChange={v => setMarginPct(v[0])}
              max={marginMode === 'margin' ? 95 : 300}
              step={5}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-xs">Round price up to nearest</Label>
              <span className="text-xs font-bold text-primary">Le {roundTo}</span>
            </div>
            <div className="flex gap-2">
              {[1, 5, 10, 50, 100].map(r => (
                <button
                  key={r}
                  onClick={() => setRoundTo(r)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${roundTo === r ? 'gradient-berry text-primary-foreground shadow-md' : 'bg-secondary text-secondary-foreground'}`}
                >{r}</button>
              ))}
            </div>
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
          <Row label={`Labor (${laborMinutes} min @ Le ${hourlyRate}/hr)`} value={calc.laborCost} />
          <Row label={`Overhead (${overheadPct}%)`} value={calc.overheadCost} />
          <div className="border-t border-border pt-1.5 mt-1.5">
            <Row label="Total cost" value={calc.totalCost} bold />
          </div>
          <Row label="Profit (rounded)" value={calc.roundedProfit} muted />
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>Effective margin / markup</span>
            <span>{calc.effectiveMargin.toFixed(1)}% / {calc.effectiveMarkup.toFixed(1)}%</span>
          </div>
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
          Exact: Le {calc.suggestedPrice.toFixed(2)} · rounded up to nearest Le {roundTo}
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
            Update flavor price to Le {calc.roundedPrice.toLocaleString()}
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
