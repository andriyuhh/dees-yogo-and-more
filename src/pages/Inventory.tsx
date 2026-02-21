import { useState } from 'react';
import { useYogurtStore } from '@/hooks/useYogurtStore';
import { Plus, Minus, PackagePlus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { YogurtFlavor } from '@/types/yogurt';

function FlavorDialog({ flavor, onSave, trigger }: { flavor?: YogurtFlavor; onSave: (f: any) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(flavor?.name || '');
  const [emoji, setEmoji] = useState(flavor?.emoji || '🍨');
  const [stock, setStock] = useState(flavor?.stock || 0);
  const [cost, setCost] = useState(flavor?.costPerUnit || 0);
  const [price, setPrice] = useState(flavor?.pricePerUnit || 0);
  const [threshold, setThreshold] = useState(flavor?.lowStockThreshold || 10);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && flavor) {
      setName(flavor.name); setEmoji(flavor.emoji); setStock(flavor.stock);
      setCost(flavor.costPerUnit); setPrice(flavor.pricePerUnit); setThreshold(flavor.lowStockThreshold);
    }
    setOpen(isOpen);
  };

  const handleSubmit = () => {
    if (!name) return;
    onSave({ name, emoji, stock, costPerUnit: cost, pricePerUnit: price, lowStockThreshold: threshold });
    if (!flavor) { setName(''); setEmoji('🍨'); setStock(0); setCost(0); setPrice(0); setThreshold(10); }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader><DialogTitle>{flavor ? 'Edit Flavor ✏️' : 'New Flavor 🍦'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="animate-fade-in"><Label>Emoji</Label><Input value={emoji} onChange={e => setEmoji(e.target.value)} className="text-center text-xl" /></div>
            <div className="col-span-3 animate-fade-in stagger-1"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Flavor name" /></div>
          </div>
          <div className="animate-fade-in stagger-2"><Label>Initial Stock</Label><Input type="number" value={stock || ''} onChange={e => setStock(+e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2 animate-fade-in stagger-3">
            <div><Label>Cost/Unit (Le)</Label><Input type="number" step="0.5" value={cost || ''} onChange={e => setCost(+e.target.value)} /></div>
            <div><Label>Price/Unit (Le)</Label><Input type="number" step="0.5" value={price || ''} onChange={e => setPrice(+e.target.value)} /></div>
          </div>
          <div className="animate-fade-in stagger-4"><Label>Low Stock Threshold</Label><Input type="number" value={threshold || ''} onChange={e => setThreshold(+e.target.value)} /></div>
          <Button onClick={handleSubmit} className="w-full gradient-berry text-primary-foreground rounded-xl shadow-md">{flavor ? 'Save Changes ✨' : 'Add Flavor ✨'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { flavors, updateStock, addFlavor, updateFlavor, deleteFlavor, loading } = useYogurtStore();

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <h1 className="text-2xl font-extrabold">Inventory 📦</h1>
        <FlavorDialog
          onSave={addFlavor}
          trigger={
            <Button className="gradient-berry text-primary-foreground rounded-full shadow-lg hover-lift" size="sm">
              <PackagePlus className="h-4 w-4 mr-1" /> Add Flavor
            </Button>
          }
        />
      </div>

      <div className="space-y-3">
        {flavors.map((f, i) => {
          const isLow = f.stock <= f.lowStockThreshold;
          return (
            <div key={f.id} className="card-playful animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-float" style={{ animationDelay: `${i * 200}ms` }}>{f.emoji}</span>
                  <div>
                    <p className="font-bold">{f.name}</p>
                    <p className="text-xs text-muted-foreground">Le {f.costPerUnit} cost · Le {f.pricePerUnit} sell</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isLow && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-warning/20 text-warning animate-wiggle">⚠️ Low</span>
                  )}
                  <FlavorDialog
                    flavor={f}
                    onSave={(updates) => updateFlavor(f.id, updates)}
                    trigger={
                      <button className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 hover:scale-110 transition-all">
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 hover:scale-110 transition-all">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {f.emoji} {f.name}?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteFlavor(f.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateStock(f.id, Math.max(0, f.stock - 1))}
                    className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className={`text-2xl font-extrabold min-w-[3ch] text-center ${isLow ? 'text-warning' : 'text-foreground'}`}>
                    {f.stock}
                  </span>
                  <button
                    onClick={() => updateStock(f.id, f.stock + 1)}
                    className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">units in stock</p>
              </div>
            </div>
          );
        })}
        {flavors.length === 0 && (
          <div className="text-center py-12 animate-bounce-in">
            <p className="text-5xl mb-3">🍨</p>
            <p className="text-muted-foreground font-medium">No flavors yet — add your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
