export interface Category {
  id: string;
  name: string;
}

export type ClubUnit = "Tiger" | "Capricorn" | "Chrysanthemum" | "Club Wears" | "General";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  unit?: ClubUnit | string; // Club unit: Tiger, Capricorn, Chrysanthemum, or Club Wears
  imageUrls: string[]; // Supports up to 7 images
  requiresSize: boolean;
  requiresColor: boolean;
  stockQuantity: number;
  createdAt: Date | any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface CustomerInfo {
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  church: string;
  district: string;
  contact: string;
}

export type OrderStatus = 'Pending' | 'Paid' | 'Delivered';

export interface Order {
  id: string;
  customerInfo: CustomerInfo;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date | any;
}
