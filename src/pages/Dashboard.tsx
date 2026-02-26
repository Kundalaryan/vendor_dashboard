import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
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
import { orderService } from "../services/orderService";
import type { CanteenAnalytics } from "../types/analytics";

// --- Utility Functions ---
const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatShortDate = (date: string) => {
  const normalized = normalizeApiDateKey(date);
  const [year, month, day] = normalized.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const toLocalDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeApiDateKey = (date: string) => {
  const isoDateMatch = date.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoDateMatch) {
    return isoDateMatch[0];
  }
  return toLocalDateInput(new Date(date));
};

const formatDateInput = (date: string) => normalizeApiDateKey(date);

const calculatePercentChange = (current: number, previous: number) => {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

export default function Dashboard() {
  // Chart Toggle State
  const [chartMetric, setChartMetric] = useState<"orders" | "revenue">("orders");
  const [isAccepting, setIsAccepting] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateInput(new Date()));

  const { data, isLoading } = useQuery<CanteenAnalytics>({
    queryKey: ["canteen-analytics"],
    queryFn: analyticsService.getCanteenAnalytics,
    refetchInterval: 60000, // poll every 60 seconds
    staleTime: 10000, // consider data fresh for 10 seconds
  });
  const availabilityMutation = useMutation({
    mutationFn: (active: boolean) => orderService.updateAvailability(active),
  });

  const today = data?.today;
  const yesterday = data?.yesterday;
  const todayDate = toLocalDateInput(new Date());
  const minLocalSelectableDate = toLocalDateInput(
    // eslint-disable-next-line react-hooks/purity
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  );
  const lastSevenDays = data?.sevenDayTrend
    ? [...data.sevenDayTrend]
        .sort((a, b) => normalizeApiDateKey(a.date).localeCompare(normalizeApiDateKey(b.date)))
        .slice(-7)
    : [];
  const earliestTrendDate = lastSevenDays[0] ? formatDateInput(lastSevenDays[0].date) : null;
  const latestTrendDate = lastSevenDays[lastSevenDays.length - 1]
    ? formatDateInput(lastSevenDays[lastSevenDays.length - 1].date)
    : null;
  const minSelectableDate = earliestTrendDate && earliestTrendDate < minLocalSelectableDate
    ? earliestTrendDate
    : minLocalSelectableDate;
  const maxSelectableDate = latestTrendDate && latestTrendDate > todayDate
    ? latestTrendDate
    : todayDate;
  const selectedSnapshot =
    lastSevenDays.find((day) => formatDateInput(day.date) === selectedDate) ||
    (today && formatDateInput(today.date) === selectedDate ? today : null);
  const todaySnapshotKey = today ? formatDateInput(today.date) : null;
  const selectedSnapshotDate = selectedSnapshot ? formatDateInput(selectedSnapshot.date) : null;
  const selectedIndex = selectedSnapshotDate
    ? lastSevenDays.findIndex((day) => formatDateInput(day.date) === selectedSnapshotDate)
    : -1;
  const previousSnapshot =
    selectedIndex > 0
      ? lastSevenDays[selectedIndex - 1]
      : selectedSnapshotDate === todaySnapshotKey ? yesterday : null;
  const ordersChangePercent = selectedSnapshot
    ? calculatePercentChange(
        selectedSnapshot.totalOrders,
        previousSnapshot?.totalOrders ?? 0
      )
    : 0;
  const revenueChangePercent = selectedSnapshot
    ? calculatePercentChange(
        selectedSnapshot.netRevenue,
        previousSnapshot?.netRevenue ?? 0
      )
    : 0;

  // Prepare Chart Data
  const trendData =
    lastSevenDays.map((d) => ({
      date: formatShortDate(d.date),
      value: chartMetric === "orders" ? d.totalOrders : d.netRevenue,
    })) ?? [];

  // --- KPI Configuration ---
  const kpiCards =
    selectedSnapshot
      ? [
          {
            label: "Total Orders",
            value: selectedSnapshot.totalOrders.toString(),
            delta: ordersChangePercent,
            subLabel: previousSnapshot
              ? `Previous Day: ${previousSnapshot.totalOrders}`
              : "Previous Day: —",
          },
          {
            label: "Net Revenue",
            value: formatCurrency(selectedSnapshot.netRevenue),
            delta: revenueChangePercent,
            subLabel: previousSnapshot
              ? `Previous Day: ${formatCurrency(previousSnapshot.netRevenue)}`
              : "Previous Day: —",
          },
          {
            label: "Avg Order Value",
            value: formatCurrency(selectedSnapshot.averageOrderValue),
            delta:
              selectedSnapshot.averageOrderValue && previousSnapshot?.averageOrderValue
                ? ((selectedSnapshot.averageOrderValue - previousSnapshot.averageOrderValue) /
                    Math.max(previousSnapshot.averageOrderValue, 1)) *
                  100
                : 0,
            subLabel: previousSnapshot
              ? `Previous Day: ${formatCurrency(previousSnapshot.averageOrderValue)}`
              : "Previous Day: —",
          },
          {
            label: "Completion Rate",
            value:
              selectedSnapshot.totalOrders > 0
                ? `${Math.round(
                    (selectedSnapshot.completedOrders / selectedSnapshot.totalOrders) * 100
                  )}%`
                : "—",
            delta: 0, // Assuming 0 for now as strict delta wasn't provided
            subLabel: `Completed: ${selectedSnapshot.completedOrders}`,
          },
        ]
      : [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Canteen Overview</h1>
            <div
              className={`px-2.5 py-0.5 rounded text-xs font-bold tracking-wide uppercase ${
                isAccepting ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {isAccepting ? "Store Open" : "Store Closed"}
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Pick any of the last 7 days to view quality insights and trend data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
            <label htmlFor="dashboard-date" className="text-xs font-semibold text-gray-600 uppercase">
              Date
            </label>
            <input
              id="dashboard-date"
              type="date"
              value={selectedDate}
              min={minSelectableDate}
              max={maxSelectableDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setSelectedDate(toLocalDateInput(new Date()))}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
          {!isLoading && !selectedSnapshot && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              No analytics data available for {selectedDate}.
            </p>
          )}

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-700">Accepting Orders</span>
            <button
              role="switch"
              aria-checked={isAccepting}
              aria-label="Accepting Orders"
              aria-busy={availabilityMutation.isPending}
              onClick={() => {
                const nextState = !isAccepting;
                setIsAccepting(nextState);
                availabilityMutation.mutate(nextState, {
                  onError: () => {
                    setIsAccepting(!nextState);
                  },
                });
              }}
              disabled={availabilityMutation.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                isAccepting ? "bg-green-500" : "bg-gray-300"
              } ${availabilityMutation.isPending ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAccepting ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
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
                Order Outcomes ({selectedSnapshot ? formatShortDate(selectedSnapshot.date) : "Selected Day"})
              </h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <span className="text-sm font-medium text-gray-700">Completed</span>
                  </div>
                  <span className="font-bold text-green-600">{selectedSnapshot?.completedOrders ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-sm font-medium text-gray-700">Cancelled</span>
                  </div>
                  <span className="font-bold text-amber-600">{selectedSnapshot?.cancelledOrders ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="text-sm font-medium text-gray-700">Rejected</span>
                  </div>
                  <span className="font-bold text-red-600">{selectedSnapshot?.rejectedOrders ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Yesterday Snapshot */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Previous Day Snapshot
                </h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">
                  {previousSnapshot ? formatShortDate(previousSnapshot.date) : "—"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                  <p className="text-xl font-bold text-gray-900">{previousSnapshot?.totalOrders ?? 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Completed</p>
                  <p className="text-xl font-bold text-gray-900">{previousSnapshot?.completedOrders ?? 0}</p>
                </div>
                <div className="col-span-2 bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                  <p className="text-xs font-medium text-blue-700">Net Revenue</p>
                  <p className="text-xl font-bold text-blue-700">
                    {previousSnapshot ? formatCurrency(previousSnapshot.netRevenue) : "—"}
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
                    formatter={(val: number | string | undefined) => {
                      const numericValue = Number(val ?? 0);
                      if (chartMetric === "revenue") {
                        return [`₹${numericValue.toLocaleString("en-IN")}`, "Revenue"];
                      }
                      return [numericValue.toLocaleString("en-IN"), "Orders"];
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
            <h2 className="text-lg font-bold mb-3">Selected Day Insights</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              For <span className="font-bold text-white">{selectedSnapshot ? formatShortDate(selectedSnapshot.date) : "selected day"}</span>, you've processed{" "}
              <span className="font-bold text-white">{selectedSnapshot?.totalOrders ?? 0}</span> orders 
              ({ordersChangePercent >= 0 ? "up" : "down"} {Math.abs(ordersChangePercent).toFixed(1)}% vs previous day) 
              with a net revenue of <span className="font-bold text-white">{formatCurrency(selectedSnapshot?.netRevenue ?? 0)}</span>.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-blue-800 pb-3">
                <span className="text-xs text-blue-200">Order window</span>
                <span className="text-sm font-medium">{selectedSnapshot ? formatShortDate(selectedSnapshot.date) : "-"}</span>
              </div>
              <div className="flex justify-between items-center border-b border-blue-800 pb-3">
                <span className="text-xs text-blue-200">Revenue change</span>
                <span className={`text-sm font-medium ${revenueChangePercent >= 0 ? "text-green-300" : "text-red-300"}`}>
                  {revenueChangePercent > 0 ? "+" : ""}
                  {revenueChangePercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-xs text-blue-200">Orders change</span>
                <span className={`text-sm font-medium ${ordersChangePercent >= 0 ? "text-green-300" : "text-red-300"}`}>
                   {ordersChangePercent > 0 ? "+" : ""}
                   {ordersChangePercent.toFixed(1)}%
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
                <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedSnapshot?.totalRevenue ?? 0)}</span>
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
                <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedSnapshot?.netRevenue ?? 0)}</span>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Truck size={16} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Delivery Charges</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedSnapshot?.deliveryCharges ?? 0)}</span>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Package size={16} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Packing Charges</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedSnapshot?.packingCharges ?? 0)}</span>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                    <CreditCard size={16} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Platform Fee (₹)</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedSnapshot?.platformFee ?? 0)}</span>
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
