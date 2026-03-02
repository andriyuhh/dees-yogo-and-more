export interface YogurtFlavor {
  id: string;
  name: string;
  emoji: string;
  stock: number;
  costPerUnit: number;
  pricePerUnit: number;
  lowStockThreshold: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
  purchaseCount: number;
  loyaltyRewardsClaimed: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryFee: number;
  items: OrderItem[];
  status: 'pending' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  notes?: string;
  isPaid: boolean;
  paymentMethod?: 'cash' | 'mobile_money';
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
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
}
