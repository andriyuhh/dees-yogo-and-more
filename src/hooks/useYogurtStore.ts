import { useState, useEffect, useCallback } from 'react';
import type { YogurtFlavor, Order, Sale, Expense, Customer } from '@/types/yogurt';

const STORAGE_KEYS = {
  flavors: 'yogurt-flavors',
  orders: 'yogurt-orders',
  sales: 'yogurt-sales',
  expenses: 'yogurt-expenses',
  customers: 'yogurt-customers',
};

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
  const [flavors, setFlavors] = useState<YogurtFlavor[]>(() => load(STORAGE_KEYS.flavors, []));
  const [orders, setOrders] = useState<Order[]>(() => load(STORAGE_KEYS.orders, []));
  const [sales, setSales] = useState<Sale[]>(() => load(STORAGE_KEYS.sales, []));
  const [expenses, setExpenses] = useState<Expense[]>(() => load(STORAGE_KEYS.expenses, []));
  const [customers, setCustomers] = useState<Customer[]>(() => load(STORAGE_KEYS.customers, []));

  useEffect(() => save(STORAGE_KEYS.flavors, flavors), [flavors]);
  useEffect(() => save(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => save(STORAGE_KEYS.sales, sales), [sales]);
  useEffect(() => save(STORAGE_KEYS.expenses, expenses), [expenses]);
  useEffect(() => save(STORAGE_KEYS.customers, customers), [customers]);

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalSales - totalExpenses;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const lowStockFlavors = flavors.filter(f => f.stock <= f.lowStockThreshold);

  // Auto-save customer from order
  const upsertCustomer = useCallback((name: string, phone: string, address?: string) => {
    setCustomers(prev => {
      const existing = prev.find(c => c.phone === phone);
      if (existing) {
        return prev.map(c => c.phone === phone ? { ...c, name, address: address || c.address } : c);
      }
      return [...prev, { id: `c${Date.now()}`, name, phone, address, createdAt: new Date().toISOString() }];
    });
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCustomerOrders = useCallback((phone: string) => {
    return orders.filter(o => o.customerPhone === phone);
  }, [orders]);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = { ...order, id: `o${Date.now()}`, createdAt: new Date().toISOString() };
    setOrders(prev => [newOrder, ...prev]);
    // Auto-save customer
    upsertCustomer(order.customerName, order.customerPhone, order.deliveryAddress);
  }, [upsertCustomer]);

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

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  return {
    flavors, orders, sales, expenses, customers,
    totalSales, totalExpenses, profit, pendingOrders, lowStockFlavors,
    addOrder, updateOrderStatus, addSale, updateStock, addFlavor,
    addExpense, deleteExpense,
    upsertCustomer, updateCustomer, deleteCustomer, getCustomerOrders,
  };
}
