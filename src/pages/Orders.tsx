import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";
import { OrderCard } from "../features/orders/OrderCard";
import { orderService } from "../services/orderService";
import type { OrderStatus } from "../types/order";

export default function Orders() {
  const queryClient = useQueryClient();
  
  // Default to the first stage of your cycle
  const [activeTab, setActiveTab] = useState<OrderStatus>("ORDER_PLACED");
  
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // 1. Fetch
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderService.getOrders,
    refetchInterval: 5000, 
  });

  // 2. Mutations
  const acceptMutation = useMutation({
    mutationFn: (id: number) => orderService.acceptOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
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

  // 2.a Mark as Preparing
  const preparingMutation = useMutation({
    mutationFn: (id: number) => orderService.markAsPreparing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Optional: switch tab to "PREPARING" if desired
    },
  });

  // 2.b Mark as Ready
  const readyMutation = useMutation({
    mutationFn: (id: number) => orderService.markAsReady(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
  // Only show orders that are paid and not expired
  const visibleOrders = orders.filter(
    (o) => o.paymentStatus === "PAID" && o.orderStatus !== "EXPIRED"
  );

  // 3. Define Tabs based on your cycle
  const tabs: { label: string; value: OrderStatus; count: number }[] = [
    { 
      label: "New Orders", 
      value: "ORDER_PLACED", 
      count: visibleOrders.filter(o => o.orderStatus === "ORDER_PLACED").length 
    },
    { 
      label: "Accepted", 
      value: "ACCEPTED", 
      count: visibleOrders.filter(o => o.orderStatus === "ACCEPTED").length 
    },
    { 
      label: "Preparing", 
      value: "PREPARING", 
      count: visibleOrders.filter(o => o.orderStatus === "PREPARING").length 
    },
    { 
      label: "Ready", 
      value: "READY", 
      count: visibleOrders.filter(o => o.orderStatus === "READY").length 
    },
  ];

  // 4. Filter Logic
  const filteredOrders = visibleOrders.filter((o) => o.orderStatus === activeTab);

  const handleRejectSubmit = () => {
    if (rejectId && rejectReason) {
      rejectMutation.mutate({ id: rejectId, reason: rejectReason });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-100px)]">
        
        {/* Header Control */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Live Orders</h1>
            </div>
            <p className="text-gray-500 text-sm mt-1">Manage incoming orders and track their status.</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white border-b border-gray-200 px-2 mb-6 sticky top-16 z-10 rounded-t-xl">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`pb-3 pt-2 px-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-10 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <Search size={24} className="opacity-50" />
              </div>
              <p className="font-medium text-gray-600">No orders found</p>
              <p className="text-sm">There are no orders in the {activeTab.toLowerCase().replace('_', ' ')} stage.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  isProcessing={
                    acceptMutation.isPending ||
                    rejectMutation.isPending ||
                    preparingMutation.isPending ||
                    readyMutation.isPending
                  }
                  onAccept={(id) => acceptMutation.mutate(id)}
                  onReject={(id) => setRejectId(id)}
                  onPrepare={(id) => preparingMutation.mutate(id)}
                  onReady={(id) => readyMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setRejectId(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Order #{rejectId}</h3>
            <p className="text-sm text-gray-500 mb-4">Please specify a reason for rejection. This will be sent to the customer.</p>
            
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none h-24"
              placeholder="e.g. Item out of stock..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setRejectId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectSubmit}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm shadow-red-200"
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
