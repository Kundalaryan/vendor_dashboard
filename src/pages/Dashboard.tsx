import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  Truck,
  CreditCard,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import DashboardLayout from "../layouts/DashboardLayout";
import { analyticsService } from "../services/analyticsService";
import type { CanteenAnalytics } from "../types/analytics";

// --- Utility Functions ---
const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatShortDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

export default function Dashboard() {
  // Chart Toggle State
  const [chartMetric, setChartMetric] = useState<"orders" | "revenue">("orders");

  const { data, isLoading } = useQuery<CanteenAnalytics>({
    queryKey: ["canteen-analytics"],
    queryFn: analyticsService.getCanteenAnalytics,
    refetchInterval: 10000, // poll every 10 seconds
  });

  const today = data?.today;
  const yesterday = data?.yesterday;

  // Prepare Chart Data
  const trendData =
    data?.sevenDayTrend.map((d) => ({
      date: formatShortDate(d.date),
      value: chartMetric === "orders" ? d.totalOrders : d.netRevenue,
    })) ?? [];

  // --- KPI Configuration ---
  const kpiCards =
    today && yesterday
      ? [
          {
            label: "Total Orders",
            value: today.totalOrders.toString(),
            delta: data?.ordersChangePercent ?? 0,
            subLabel: `Yesterday: ${yesterday.totalOrders}`,
          },
          {
            label: "Net Revenue",
            value: formatCurrency(today.netRevenue),
            delta: data?.revenueChangePercent ?? 0,
            subLabel: `Yesterday: ${formatCurrency(yesterday.netRevenue)}`,
          },
          {
            label: "Avg Order Value",
            value: formatCurrency(today.averageOrderValue),
            delta:
              today.averageOrderValue && yesterday.averageOrderValue
                ? ((today.averageOrderValue - yesterday.averageOrderValue) /
                    Math.max(yesterday.averageOrderValue, 1)) *
                  100
                : 0,
            subLabel: `Yesterday: ${formatCurrency(yesterday.averageOrderValue)}`,
          },
          {
            label: "Completion Rate",
            value:
              today.totalOrders > 0
                ? `${Math.round(
                    (today.completedOrders / today.totalOrders) * 100
                  )}%`
                : "—",
            delta: 0, // Assuming 0 for now as strict delta wasn't provided
            subLabel: `Completed: ${today.completedOrders}`,
          },
        ]
      : [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canteen Overview</h1>
          <p className="text-gray-500 text-sm mt-1">
            Today vs yesterday KPIs and a 7‑day trend for your outlet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Plus size={16} /> Add Menu Item
          </button>
          <button className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 flex items-center gap-2 shadow-sm transition-colors">
            <ShoppingCart size={16} /> Create Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* --- LEFT COLUMN (Main Content) --- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white h-32 rounded-xl animate-pulse border border-gray-100" />
                ))
              : kpiCards.map((card, idx) => {
                  const isPositive = card.delta >= 0;
                  return (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {card.label}
                      </p>
                      <div className="flex items-end justify-between mt-2">
                        <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                        <span
                          className={`flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isPositive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp size={12} className="mr-1" />
                          ) : (
                            <TrendingDown size={12} className="mr-1" />
                          )}
                          {Math.abs(card.delta).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{card.subLabel}</p>
                    </div>
                  );
                })}
          </div>

          {/* 2. Middle Row: Outcomes & Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Outcomes */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-6">
                Order Outcomes (Today)
              </h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <span className="text-sm font-medium text-gray-700">Completed</span>
                  </div>
                  <span className="font-bold text-green-600">{today?.completedOrders ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-sm font-medium text-gray-700">Cancelled</span>
                  </div>
                  <span className="font-bold text-amber-600">{today?.cancelledOrders ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="text-sm font-medium text-gray-700">Rejected</span>
                  </div>
                  <span className="font-bold text-red-600">{today?.rejectedOrders ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Yesterday Snapshot */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Yesterday Snapshot
                </h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">
                  {yesterday ? formatShortDate(yesterday.date) : "—"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                  <p className="text-xl font-bold text-gray-900">{yesterday?.totalOrders ?? 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Completed</p>
                  <p className="text-xl font-bold text-gray-900">{yesterday?.completedOrders ?? 0}</p>
                </div>
                <div className="col-span-2 bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                  <p className="text-xs font-medium text-blue-700">Net Revenue</p>
                  <p className="text-xl font-bold text-blue-700">
                    {yesterday ? formatCurrency(yesterday.netRevenue) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 7-Day Trend Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">7-Day Trend</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Daily orders and net revenue, oldest to newest.
                </p>
              </div>
              
              {/* Chart Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setChartMetric("orders")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    chartMetric === "orders"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setChartMetric("revenue")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    chartMetric === "revenue"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Revenue
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(v) => chartMetric === "revenue" ? `₹${v}` : `${v}`}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ 
                      borderRadius: "8px", 
                      border: "none", 
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" 
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorChart)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN (Sidebar) --- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Today at a Glance (Blue Card) */}
          <div className="bg-blue-900 p-6 rounded-xl shadow-md text-white">
            <h2 className="text-lg font-bold mb-3">Today at a Glance</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              You've processed <span className="font-bold text-white">{today?.totalOrders ?? 0}</span> orders today 
              ({(data?.ordersChangePercent ?? 0) >= 0 ? "up" : "down"} {Math.abs(data?.ordersChangePercent ?? 0).toFixed(1)}% vs yesterday) 
              with a net revenue of <span className="font-bold text-white">{formatCurrency(today?.netRevenue ?? 0)}</span>.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-blue-800 pb-3">
                <span className="text-xs text-blue-200">Order window</span>
                <span className="text-sm font-medium">{today ? formatShortDate(today.date) : "-"}</span>
              </div>
              <div className="flex justify-between items-center border-b border-blue-800 pb-3">
                <span className="text-xs text-blue-200">Revenue change</span>
                <span className={`text-sm font-medium ${(data?.revenueChangePercent ?? 0) >= 0 ? "text-green-300" : "text-red-300"}`}>
                  {(data?.revenueChangePercent ?? 0) > 0 ? "+" : ""}
                  {data?.revenueChangePercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-xs text-blue-200">Orders change</span>
                <span className={`text-sm font-medium ${(data?.ordersChangePercent ?? 0) >= 0 ? "text-green-300" : "text-red-300"}`}>
                   {(data?.ordersChangePercent ?? 0) > 0 ? "+" : ""}
                   {data?.ordersChangePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* 2. Revenue Quality */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Revenue Quality</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Wallet size={16} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Gross Revenue</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(today?.totalRevenue ?? 0)}</span>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <Wallet size={16} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm text-gray-700 font-medium">Net Revenue</span>
                     <span className="text-[10px] text-green-600">Target Reached</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(today?.netRevenue ?? 0)}</span>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Truck size={16} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Delivery Charges</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(today?.deliveryCharges ?? 0)}</span>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Package size={16} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Packing Charges</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(today?.packingCharges ?? 0)}</span>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                    <CreditCard size={16} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Platform Fee (₹)</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(today?.platformFee ?? 0)}</span>
              </div>

              
            </div>
          </div>
        </div>

        {/* Debug Section (Kept as requested) */}
        {data && (
          <div className="lg:col-span-12 mt-4">
             <div className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-auto max-h-60 font-mono shadow-inner border border-gray-800">
              <div className="flex gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-red-500"/>
                <span className="w-3 h-3 rounded-full bg-yellow-500"/>
                <span className="w-3 h-3 rounded-full bg-green-500"/>
              </div>
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
