export interface YogurtFlavor {
  id: string;
  name: string;
  emoji: string;
  stock: number;
  costPerUnit: number;
  pricePerUnit: number;
  lowStockThreshold: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  status: 'pending' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  notes?: string;
}

export interface OrderItem {
  flavorId: string;
  flavorName: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  orderId?: string;
  items: OrderItem[];
  totalAmount: number;
  date: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}
