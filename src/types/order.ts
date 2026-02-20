export type OrderStatus = "NEW" | "COOKING" | "READY" | "COMPLETED" | "REJECTED" | "CANCELLED";

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  orderId: number;
  createdAt: string; // ISO Date string
  fulfilmentType: "DELIVERY" | "TAKEAWAY";
  customerPhone: string;
  instructions: string | null;
  totalAmount: number;
  paymentStatus: "PENDING" | "PAID";
  // Some endpoints (like /orders/live) may not yet send status.
  // In that case we treat it as "NEW" on the frontend.
  status?: OrderStatus;
  items: OrderItem[];
}

export interface RejectReason {
  reason: string;
}

export interface CanteenAvailability {
  active: boolean;
}
