// Updated Status Cycle
export type OrderStatus = 
  | "ORDER_PLACED" 
  | "ACCEPTED" 
  | "PREPARING" 
  | "READY" 
  | "COMPLETED" 
  | "REJECTED" 
  | "CANCELLED"
  | "EXPIRED";

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  orderId: number;
  createdAt: string;
  fulfilmentType: "DELIVERY" | "PICKUP" | "DINE_IN";
  customerPhone: string;
  customerName: string | null; // Added
  instructions: string | null;
  totalAmount: number;
  paymentStatus: "PENDING" | "PAID";
  orderStatus: OrderStatus; // Renamed from status to orderStatus based on your JSON
  items: OrderItem[];
}

export interface RejectReason {
  reason: string;
}

export interface CanteenAvailability {
  active: boolean;
}
