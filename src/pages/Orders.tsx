import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";
import { OrderCard } from "../features/orders/OrderCard";
import { orderService } from "../services/orderService";
import type { OrderStatus } from "../types/order";

export default function Orders() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<OrderStatus>("NEW");
  
  // State for Rejection Modal
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // 1. POLLING: Fetch orders every 5 seconds
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderService.getOrders,
    refetchInterval: 5000, // Poll every 5s
  });

  // 2. Mutations (Actions)
  const acceptMutation = useMutation({
    mutationFn: (id: number) => orderService.acceptOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Refresh list instantly
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      orderService.rejectOrder(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setRejectId(null);
      setRejectReason("");
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: (active: boolean) => orderService.updateAvailability(active),
    // You might want to store availability state in a separate query or context
  });

  const handleRejectSubmit = () => {
    if (rejectId && rejectReason) {
      rejectMutation.mutate({ id: rejectId, reason: rejectReason });
    }
  };

  // Filter orders by tab
  const filteredOrders = orders.filter((o) => {
    const status = o.status ?? "NEW"; // default for live orders without status
    if (activeTab === "NEW") return status === "NEW";
    if (activeTab === "COOKING") return status === "COOKING";
    if (activeTab === "READY") return status === "READY";
    if (activeTab === "COMPLETED") return status === "COMPLETED";
    return false;
  });

  const tabs: { label: string; value: OrderStatus; count: number }[] = [
    { label: "New Orders", value: "NEW", count: orders.filter(o => (o.status ?? "NEW") === "NEW").length },
    { label: "In Kitchen", value: "COOKING", count: orders.filter(o => o.status === "COOKING").length },
    { label: "Ready for Pickup", value: "READY", count: orders.filter(o => o.status === "READY").length },
    { label: "Completed", value: "COMPLETED", count: 0 }, // Optional to show count
  ];

  const [isAccepting, setIsAccepting] = useState(true); // Should fetch this from backend ideally

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-100px)]">
        
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Live Orders</h1>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold tracking-wide">
              OPEN
            </span>
          </div>

          <div className="flex items-center gap-4">
             {/* Availability Toggle */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              <span className="text-sm font-medium text-gray-700">Accepting Orders</span>
              <button 
                onClick={() => {
                  setIsAccepting(!isAccepting);
                  availabilityMutation.mutate(!isAccepting);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAccepting ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAccepting ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-4 pt-2 mb-6 sticky top-16 z-10 rounded-t-xl">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`pb-4 px-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === tab.value
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    activeTab === tab.value ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="flex-1 overflow-y-auto pb-10">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search size={24} />
              </div>
              <p>No orders in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  isProcessing={acceptMutation.isPending || rejectMutation.isPending}
                  onAccept={(id) => acceptMutation.mutate(id)}
                  onReject={(id) => setRejectId(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Order</h3>
            <p className="text-sm text-gray-500 mb-4">Please specify a reason for rejecting this order.</p>
            
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none h-24"
              placeholder="e.g. Item out of stock, Closing soon..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setRejectId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectSubmit}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
