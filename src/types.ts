export type Role = 'admin' | 'warehouse' | 'sales_rep' | null;

export interface UserState {
  role: Role;
  isAuthenticated: boolean;
}

export interface Item {
  id: string;
  name: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  ratio: number;
}

export interface Market {
  id: string;
  name: string;
  location: string;
  phone: string;
  createdAt: number;
}

export interface StockHistory {
  id: string;
  itemId: string;
  itemName: string;
  quantityAdded: number;
  date: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'debt' | 'cash' | 'paid_debt';
  amount: number;
  date: number; // timestamp
  description: string;
  relatedEntityId?: string; // e.g. market name or person name
}

export interface SalesRep {
  id: string;
  name: string;
  phone: string;
  totalSales: number;
  totalProfit: number;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  repName: string;
  marketName: string;
  location: string;
  totalAmount: number;
  items: OrderItem[];
  status: 'pending' | 'printed' | 'completed';
  paymentStatus?: 'cash' | 'debt';
  timestamp: number;
}
