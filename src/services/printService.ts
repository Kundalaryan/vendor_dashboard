import { api } from "../lib/api";
import type { PrintOrder } from "../types/print";

export const printService = {
  // 1. Get Pending Prints
  getPendingPrints: async () => {
    const response = await api.get<PrintOrder[]>('/vendor/canteen/orders/print/pending');
    return response.data;
  },

  // 2. Mark Single Order as Printed
  markPrintComplete: async (orderId: number) => {
    const response = await api.post(`/vendor/canteen/orders/${orderId}/print-complete`);
    return response.data;
  }
};