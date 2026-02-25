import { api } from "../lib/api";
import type { CanteenAnalytics } from "../types/analytics";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const analyticsService = {
  getCanteenAnalytics: async () => {
    const response = await api.get<ApiResponse<CanteenAnalytics>>(
      "/vendor/reports/canteen"
    );
    return response.data.data;
  },
};
