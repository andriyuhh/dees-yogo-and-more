import { useState, useEffect, useCallback } from 'react';
import type { YogurtFlavor, Order, Sale, Expense } from '@/types/yogurt';

const STORAGE_KEYS = {
  flavors: 'yogurt-flavors',
  orders: 'yogurt-orders',
  sales: 'yogurt-sales',
  expenses: 'yogurt-expenses',
};

const defaultFlavors: YogurtFlavor[] = [
  { id: '1', name: 'Strawberry', emoji: '🍓', stock: 50, costPerUnit: 2, pricePerUnit: 5, lowStockThreshold: 10 },
  { id: '2', name: 'Blueberry', emoji: '🫐', stock: 35, costPerUnit: 2.5, pricePerUnit: 5.5, lowStockThreshold: 10 },
  { id: '3', name: 'Mango', emoji: '🥭', stock: 40, costPerUnit: 2, pricePerUnit: 5, lowStockThreshold: 10 },
  { id: '4', name: 'Vanilla', emoji: '🍦', stock: 60, costPerUnit: 1.5, pricePerUnit: 4.5, lowStockThreshold: 10 },
  { id: '5', name: 'Greek Plain', emoji: '🥛', stock: 8, costPerUnit: 1.8, pricePerUnit: 4, lowStockThreshold: 10 },
];

const defaultOrders: Order[] = [
  {
    id: 'o1', customerName: 'Sarah M.', customerPhone: '555-1234',
    items: [{ flavorId: '1', flavorName: 'Strawberry', quantity: 5, unitPrice: 5 }],
    status: 'pending', totalAmount: 25, createdAt: new Date().toISOString(),
  },
  {
    id: 'o2', customerName: 'James K.', customerPhone: '555-5678',
    items: [
      { flavorId: '2', flavorName: 'Blueberry', quantity: 3, unitPrice: 5.5 },
      { flavorId: '4', flavorName: 'Vanilla', quantity: 2, unitPrice: 4.5 },
    ],
    status: 'pending', totalAmount: 25.5, createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const defaultSales: Sale[] = [
  {
    id: 's1', items: [{ flavorId: '1', flavorName: 'Strawberry', quantity: 10, unitPrice: 5 }],
    totalAmount: 50, date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 's2', items: [{ flavorId: '3', flavorName: 'Mango', quantity: 8, unitPrice: 5 }],
    totalAmount: 40, date: new Date(Date.now() - 172800000).toISOString(),
  },
];

const defaultExpenses: Expense[] = [
  { id: 'e1', description: 'Milk supply', amount: 120, date: new Date(Date.now() - 86400000).toISOString(), category: 'Ingredients' },
  { id: 'e2', description: 'Cups & packaging', amount: 45, date: new Date(Date.now() - 172800000).toISOString(), category: 'Packaging' },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useYogurtStore() {
  const [flavors, setFlavors] = useState<YogurtFlavor[]>(() => load(STORAGE_KEYS.flavors, defaultFlavors));
  const [orders, setOrders] = useState<Order[]>(() => load(STORAGE_KEYS.orders, defaultOrders));
  const [sales, setSales] = useState<Sale[]>(() => load(STORAGE_KEYS.sales, defaultSales));
  const [expenses, setExpenses] = useState<Expense[]>(() => load(STORAGE_KEYS.expenses, defaultExpenses));

  useEffect(() => save(STORAGE_KEYS.flavors, flavors), [flavors]);
  useEffect(() => save(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => save(STORAGE_KEYS.sales, sales), [sales]);
  useEffect(() => save(STORAGE_KEYS.expenses, expenses), [expenses]);

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalSales - totalExpenses;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const lowStockFlavors = flavors.filter(f => f.stock <= f.lowStockThreshold);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = { ...order, id: `o${Date.now()}`, createdAt: new Date().toISOString() };
    setOrders(prev => [newOrder, ...prev]);
  }, []);

  const updateOrderStatus = useCallback((id: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      if (status === 'completed' && o.status !== 'completed') {
        const sale: Sale = { id: `s${Date.now()}`, orderId: o.id, items: o.items, totalAmount: o.totalAmount, date: new Date().toISOString() };
        setSales(s => [sale, ...s]);
        setFlavors(f => f.map(fl => {
          const item = o.items.find(i => i.flavorId === fl.id);
          return item ? { ...fl, stock: Math.max(0, fl.stock - item.quantity) } : fl;
        }));
      }
      return { ...o, status };
    }));
  }, []);

  const addSale = useCallback((sale: Omit<Sale, 'id'>) => {
    setSales(prev => [{ ...sale, id: `s${Date.now()}` }, ...prev]);
    setFlavors(f => f.map(fl => {
      const item = sale.items.find(i => i.flavorId === fl.id);
      return item ? { ...fl, stock: Math.max(0, fl.stock - item.quantity) } : fl;
    }));
  }, []);

  const updateStock = useCallback((id: string, newStock: number) => {
    setFlavors(prev => prev.map(f => f.id === id ? { ...f, stock: newStock } : f));
  }, []);

  const addFlavor = useCallback((flavor: Omit<YogurtFlavor, 'id'>) => {
    setFlavors(prev => [...prev, { ...flavor, id: `f${Date.now()}` }]);
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [{ ...expense, id: `e${Date.now()}` }, ...prev]);
  }, []);

  return {
    flavors, orders, sales, expenses,
    totalSales, totalExpenses, profit, pendingOrders, lowStockFlavors,
    addOrder, updateOrderStatus, addSale, updateStock, addFlavor, addExpense,
  };
}
