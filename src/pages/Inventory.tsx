import { useState } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Plus, Minus, PackagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function AddFlavorDialog({ onAdd }: { onAdd: (f: any) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍨');
  const [stock, setStock] = useState(0);
  const [cost, setCost] = useState(0);
  const [price, setPrice] = useState(0);

  const handleSubmit = () => {
    if (!name) return;
    onAdd({ name, emoji, stock, costPerUnit: cost, pricePerUnit: price, lowStockThreshold: 10 });
    setName(''); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-berry text-primary-foreground rounded-full shadow-lg" size="sm">
          <PackagePlus className="h-4 w-4 mr-1" /> Add Flavor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader><DialogTitle>New Flavor</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div><Label>Emoji</Label><Input value={emoji} onChange={e => setEmoji(e.target.value)} className="text-center text-xl" /></div>
            <div className="col-span-3"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Flavor name" /></div>
          </div>
          <div><Label>Initial Stock</Label><Input type="number" value={stock} onChange={e => setStock(+e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Cost/Unit (Le)</Label><Input type="number" step="0.5" value={cost} onChange={e => setCost(+e.target.value)} /></div>
            <div><Label>Price/Unit (Le)</Label><Input type="number" step="0.5" value={price} onChange={e => setPrice(+e.target.value)} /></div>
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-berry text-primary-foreground">Add Flavor</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { flavors, updateStock, addFlavor } = useYogurtStore();

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold">Inventory</h1>
        <AddFlavorDialog onAdd={addFlavor} />
      </div>

      <div className="space-y-3">
        {flavors.map(f => {
          const isLow = f.stock <= f.lowStockThreshold;
          return (
            <div key={f.id} className="bg-card rounded-xl p-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{f.emoji}</span>
                  <div>
                    <p className="font-bold">{f.name}</p>
                    <p className="text-xs text-muted-foreground">Le {f.costPerUnit} cost · Le {f.pricePerUnit} sell</p>
                  </div>
                </div>
                {isLow && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-warning/20 text-warning">Low</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateStock(f.id, Math.max(0, f.stock - 1))}
                    className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className={`text-2xl font-extrabold min-w-[3ch] text-center ${isLow ? 'text-warning' : 'text-foreground'}`}>
                    {f.stock}
                  </span>
                  <button
                    onClick={() => updateStock(f.id, f.stock + 1)}
                    className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">units in stock</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
