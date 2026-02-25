export interface AnalyticsDaySnapshot {
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
  netRevenue: number;
  platformFeeRate: number;
  averageOrderValue: number;
  // New fields from backend for better revenue breakdown
  deliveryCharges?: number;
  packingCharges?: number;
  platformFee?: number;
}

export interface CanteenAnalytics {
  today: AnalyticsDaySnapshot;
  yesterday: AnalyticsDaySnapshot;
  revenueChangePercent: number;
  ordersChangePercent: number;
  sevenDayTrend: AnalyticsDaySnapshot[];
}
