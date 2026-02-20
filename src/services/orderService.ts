import { api } from "../lib/api";
import type { Order, RejectReason, CanteenAvailability } from "../types/order";

export const orderService = {
  // 1. Get All Orders
  getOrders: async () => {
    // Assuming the endpoint is generic. You might filter by status on the backend later.
    const response = await api.get<Order[]>('/vendor/canteen/orders/live');
    return response.data;
  },

  // 2. Accept Order
  acceptOrder: async (orderId: number) => {
    const response = await api.post(`/vendor/canteen/orders/${orderId}/accept`);
    return response.data;
  },

  // 3. Reject Order
  rejectOrder: async (orderId: number, data: RejectReason) => {
    const response = await api.post(`/vendor/canteen/orders/${orderId}/reject`, data);
    return response.data;
  },

  // 4. Toggle Availability
  updateAvailability: async (active: boolean) => {
    const response = await api.put<CanteenAvailability>('/vendor/canteen/availability', { active });
    return response.data;
  },
  markAsPreparing: async (orderId: number) => {
    const response = await api.post(`/vendor/canteen/orders/${orderId}/preparing`);
    return response.data;
  },
  markAsReady: async (orderId: number) => {
    const response = await api.post(`/vendor/canteen/orders/${orderId}/ready`);
    return response.data;
  },
};