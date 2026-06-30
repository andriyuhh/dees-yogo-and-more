import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { YogurtFlavor, Order, Sale, Expense, Customer, OrderItem } from '@/types/yogurt';

export function useYogurtStore() {
  const { user } = useAuth();
  const [flavors, setFlavors] = useState<YogurtFlavor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase.from('flavors').select('*').order('created_at', { ascending: true }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('customers').select('*').order('created_at', { ascending: true }),
    ]).then(([fRes, oRes, sRes, eRes, cRes]) => {
      if (fRes.data) setFlavors(fRes.data.map(mapFlavor));
      if (oRes.data) setOrders(oRes.data.map(mapOrder));
      if (sRes.data) setSales(sRes.data.map(mapSale));
      if (eRes.data) setExpenses(eRes.data.map(mapExpense));
      if (cRes.data) setCustomers(cRes.data.map(mapCustomer));
      setLoading(false);
    });
  }, [user]);

  // Mappers from DB row to app types
  function mapFlavor(r: any): YogurtFlavor {
    return { id: r.id, name: r.name, emoji: r.emoji, stock: r.stock, costPerUnit: Number(r.cost_per_unit), pricePerUnit: Number(r.price_per_unit), lowStockThreshold: r.low_stock_threshold };
  }
  function mapOrder(r: any): Order {
    return { id: r.id, customerName: r.customer_name, customerPhone: r.customer_phone, deliveryAddress: r.delivery_address, deliveryFee: Number(r.delivery_fee), items: r.items as OrderItem[], status: r.status, totalAmount: Number(r.total_amount), createdAt: r.created_at, notes: r.notes, isPaid: r.is_paid ?? false, paymentMethod: r.payment_method };
  }
  function mapSale(r: any): Sale {
    return { id: r.id, orderId: r.order_id, items: r.items as OrderItem[], totalAmount: Number(r.total_amount), date: r.date };
  }
  function mapExpense(r: any): Expense {
    return { id: r.id, description: r.description, amount: Number(r.amount), date: r.date, category: r.category, isRecurring: r.is_recurring, recurringFrequency: r.recurring_frequency };
  }
  function mapCustomer(r: any): Customer {
    return { id: r.id, name: r.name, phone: r.phone, address: r.address, notes: r.notes, createdAt: r.created_at, purchaseCount: r.purchase_count || 0, loyaltyRewardsClaimed: r.loyalty_rewards_claimed || 0 };
  }

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalSales - totalExpenses;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const lowStockFlavors = flavors.filter(f => f.stock <= f.lowStockThreshold);

  const upsertCustomer = useCallback(async (name: string, phone: string, address?: string) => {
    if (!user) return;
    const existing = customers.find(c => c.phone === phone);
    if (existing) {
      await supabase.from('customers').update({ name, address: address || existing.address }).eq('id', existing.id);
      setCustomers(prev => prev.map(c => c.phone === phone ? { ...c, name, address: address || c.address } : c));
    } else {
      const { data } = await supabase.from('customers').insert({ user_id: user.id, name, phone, address }).select().single();
      if (data) setCustomers(prev => [...prev, mapCustomer(data)]);
    }
  }, [user, customers]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    await supabase.from('customers').update(dbUpdates).eq('id', id);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    await supabase.from('customers').delete().eq('id', id);
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCustomerOrders = useCallback((phone: string) => {
    return orders.filter(o => o.customerPhone === phone);
  }, [orders]);

  const addOrder = useCallback(async (order: Omit<Order, 'id' | 'createdAt'>) => {
    if (!user) return;
    const { data } = await supabase.from('orders').insert({
      user_id: user.id,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      delivery_address: order.deliveryAddress,
      delivery_fee: order.deliveryFee,
      items: order.items as any,
      status: order.status,
      total_amount: order.totalAmount,
      notes: order.notes,
      is_paid: order.isPaid ?? false,
      payment_method: order.paymentMethod,
    }).select().single();
    if (data) setOrders(prev => [mapOrder(data), ...prev]);
    await upsertCustomer(order.customerName, order.customerPhone, order.deliveryAddress);
  }, [user, upsertCustomer]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    const dbUpdates: any = {};
    if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
    if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone;
    if (updates.deliveryAddress !== undefined) dbUpdates.delivery_address = updates.deliveryAddress;
    if (updates.deliveryFee !== undefined) dbUpdates.delivery_fee = updates.deliveryFee;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.items !== undefined) dbUpdates.items = updates.items;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.isPaid !== undefined) dbUpdates.is_paid = updates.isPaid;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    await supabase.from('orders').update(dbUpdates).eq('id', id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    await supabase.from('orders').delete().eq('id', id);
    setOrders(prev => prev.filter(o => o.id !== id));
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
    if (!user) return;
    const order = orders.find(o => o.id === id);
    if (!order) return;

    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

    if (status === 'completed' && order.status !== 'completed') {
      const { data: saleData } = await supabase.from('sales').insert({
        user_id: user.id,
        order_id: id,
        items: order.items as any,
        total_amount: order.totalAmount,
      }).select().single();
      if (saleData) setSales(prev => [mapSale(saleData), ...prev]);

      for (const item of order.items) {
        const flavor = flavors.find(f => f.id === item.flavorId);
        if (flavor) {
          const newStock = Math.max(0, flavor.stock - item.quantity);
          await supabase.from('flavors').update({ stock: newStock }).eq('id', flavor.id);
          setFlavors(prev => prev.map(f => f.id === flavor.id ? { ...f, stock: newStock } : f));
        }
      }

      // Increment purchase count for customer loyalty
      const customer = customers.find(c => c.phone === order.customerPhone);
      if (customer) {
        const newCount = customer.purchaseCount + 1;
        await supabase.from('customers').update({ purchase_count: newCount }).eq('id', customer.id);
        setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, purchaseCount: newCount } : c));
      }
    }
  }, [user, orders, flavors, customers]);

  const addSale = useCallback(async (sale: Omit<Sale, 'id'>) => {
    if (!user) return;
    const { data } = await supabase.from('sales').insert({
      user_id: user.id,
      items: sale.items as any,
      total_amount: sale.totalAmount,
    }).select().single();
    if (data) setSales(prev => [mapSale(data), ...prev]);

    for (const item of sale.items) {
      const flavor = flavors.find(f => f.id === item.flavorId);
      if (flavor) {
        const newStock = Math.max(0, flavor.stock - item.quantity);
        await supabase.from('flavors').update({ stock: newStock }).eq('id', flavor.id);
        setFlavors(prev => prev.map(f => f.id === flavor.id ? { ...f, stock: newStock } : f));
      }
    }
  }, [user, flavors]);

  const updateStock = useCallback(async (id: string, newStock: number) => {
    await supabase.from('flavors').update({ stock: newStock }).eq('id', id);
    setFlavors(prev => prev.map(f => f.id === id ? { ...f, stock: newStock } : f));
  }, []);

  const addFlavor = useCallback(async (flavor: Omit<YogurtFlavor, 'id'>) => {
    if (!user) return;
    const { data } = await supabase.from('flavors').insert({
      user_id: user.id,
      name: flavor.name,
      emoji: flavor.emoji,
      stock: flavor.stock,
      cost_per_unit: flavor.costPerUnit,
      price_per_unit: flavor.pricePerUnit,
      low_stock_threshold: flavor.lowStockThreshold,
    }).select().single();
    if (data) setFlavors(prev => [...prev, mapFlavor(data)]);
  }, [user]);

  const updateFlavor = useCallback(async (id: string, updates: Partial<YogurtFlavor>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.costPerUnit !== undefined) dbUpdates.cost_per_unit = updates.costPerUnit;
    if (updates.pricePerUnit !== undefined) dbUpdates.price_per_unit = updates.pricePerUnit;
    if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;
    await supabase.from('flavors').update(dbUpdates).eq('id', id);
    setFlavors(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const deleteFlavor = useCallback(async (id: string) => {
    await supabase.from('flavors').delete().eq('id', id);
    setFlavors(prev => prev.filter(f => f.id !== id));
  }, []);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;
    const { data } = await supabase.from('expenses').insert({
      user_id: user.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      is_recurring: expense.isRecurring || false,
      recurring_frequency: expense.recurringFrequency,
    }).select().single();
    if (data) setExpenses(prev => [mapExpense(data), ...prev]);
  }, [user]);

  const deleteExpense = useCallback(async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const redeemLoyaltyReward = useCallback(async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || customer.purchaseCount < 10 * (customer.loyaltyRewardsClaimed + 1)) return;
    const newClaimed = customer.loyaltyRewardsClaimed + 1;
    await supabase.from('customers').update({ loyalty_rewards_claimed: newClaimed }).eq('id', customerId);
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, loyaltyRewardsClaimed: newClaimed } : c));
  }, [customers]);

  type ResetOptions = {
    orders?: boolean;
    sales?: boolean;
    customers?: boolean;
    expenses?: boolean;
    notes?: boolean;
    flavors?: boolean;         // delete flavors entirely
    resetFlavorStock?: boolean; // keep flavors but set stock to 0
  };
  const resetData = useCallback(async (opts: ResetOptions) => {
    if (!user) return;
    const uid = user.id;
    const tasks: PromiseLike<any>[] = [];
    if (opts.orders) tasks.push(supabase.from('orders').delete().eq('user_id', uid).then(r => r));
    if (opts.sales) tasks.push(supabase.from('sales').delete().eq('user_id', uid).then(r => r));
    if (opts.customers) tasks.push(supabase.from('customers').delete().eq('user_id', uid).then(r => r));
    if (opts.expenses) tasks.push(supabase.from('expenses').delete().eq('user_id', uid).then(r => r));
    if (opts.notes) tasks.push(supabase.from('notes').delete().eq('user_id', uid).then(r => r));
    if (opts.flavors) tasks.push(supabase.from('flavors').delete().eq('user_id', uid).then(r => r));
    else if (opts.resetFlavorStock) tasks.push(supabase.from('flavors').update({ stock: 0 }).eq('user_id', uid).then(r => r));
    await Promise.all(tasks);

    if (opts.orders) setOrders([]);
    if (opts.sales) setSales([]);
    if (opts.customers) setCustomers([]);
    if (opts.expenses) setExpenses([]);
    if (opts.flavors) setFlavors([]);
    else if (opts.resetFlavorStock) setFlavors(prev => prev.map(f => ({ ...f, stock: 0 })));
  }, [user]);



  return {
    flavors, orders, sales, expenses, customers, loading,
    totalSales, totalExpenses, profit, pendingOrders, lowStockFlavors,
    addOrder, updateOrder, deleteOrder, updateOrderStatus,
    addSale, updateStock, addFlavor, updateFlavor, deleteFlavor,
    addExpense, deleteExpense,
    upsertCustomer, updateCustomer, deleteCustomer, getCustomerOrders,
    redeemLoyaltyReward, resetData,
  };
}
