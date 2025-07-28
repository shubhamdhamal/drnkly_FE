export interface Product {
  id: string;
  name: string;
  category: 'Wine' | 'Whiskey' | 'Vodka' | 'Snacks';
  alcoholContent?: number;
  price: number;
  stock: number;
  image: string;
  isAvailable: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    quantity: number;
    name: string;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'accepted' | 'rejected' | 'ready';
  paymentStatus: 'paid' | 'pending';
  paymentMethod: 'card' | 'cash';
  createdAt: string;
}

export interface DeliverySlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Payout {
  id: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
  commission: number;
}