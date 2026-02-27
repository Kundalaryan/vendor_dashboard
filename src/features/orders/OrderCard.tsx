import React from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Clock, Check, X, User, Phone, MapPin, Bike, Utensils, AlertCircle, 
  ChefHat, Loader2, PackageCheck
} from "lucide-react";
import type { Order } from "../../types/order";

interface OrderCardProps {
  order: Order;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onPrepare?: (id: number) => void;
  onReady?: (id: number) => void;
  isProcessing: boolean;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, onAccept, onReject, onPrepare, onReady, isProcessing, isAccepting, isRejecting
}) => {
  const timeAgo = order.createdAt 
    ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) 
    : 'Just now';

  const getFulfilmentIcon = () => {
    switch (order.fulfilmentType) {
      case "DELIVERY": return <Bike size={14} />;
      case "PICKUP": return <MapPin size={14} />;
      case "DINE_IN": return <Utensils size={14} />;
      default: return <MapPin size={14} />;
    }
  };

  const statusStyles: Record<Order["orderStatus"], { label: string; badge: string; border: string }> = {
    ORDER_PLACED: {
      label: "New",
      badge: "bg-amber-50 text-amber-700 border border-amber-200",
      border: "border-l-4 border-l-amber-500",
    },
    ACCEPTED: {
      label: "Accepted",
      badge: "bg-blue-50 text-blue-700 border border-blue-200",
      border: "border-l-4 border-l-blue-500",
    },
    PREPARING: {
      label: "Preparing",
      badge: "bg-purple-50 text-purple-700 border border-purple-200",
      border: "border-l-4 border-l-purple-500",
    },
    READY: {
      label: "Ready",
      badge: "bg-green-50 text-green-700 border border-green-200",
      border: "border-l-4 border-l-green-500",
    },
    COMPLETED: {
      label: "Completed",
      badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      border: "border-l-4 border-l-emerald-500",
    },
    REJECTED: {
      label: "Rejected",
      badge: "bg-red-50 text-red-700 border border-red-200",
      border: "border-l-4 border-l-red-500",
    },
    CANCELLED: {
      label: "Cancelled",
      badge: "bg-gray-50 text-gray-600 border border-gray-200",
      border: "border-l-4 border-l-gray-400",
    },
    EXPIRED: {
      label: "Expired",
      badge: "bg-gray-50 text-gray-500 border border-gray-200",
      border: "border-l-4 border-l-gray-300",
    },
  };

  const currentStatus = statusStyles[order.orderStatus];

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full overflow-hidden ${currentStatus.border}`}
    >
      
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-start border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">#{order.orderId}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                order.paymentStatus === "PAID"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-600">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${currentStatus.badge}`}
            >
              {currentStatus.label}
            </span>
            <span className="text-gray-300">•</span>
            <span className="capitalize text-gray-500">
              {order.fulfilmentType.toLowerCase().replace("_", " ")}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end text-xs text-gray-500 gap-1">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{timeAgo}</span>
          </div>
          <span className="text-[11px] text-gray-400">
            Order ID: {order.orderId}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 flex items-start gap-3 border-b border-gray-50 border-dashed">
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <User size={16} />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {order.customerName || "Guest Customer"}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <Phone size={10} /> {order.customerPhone}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
              {getFulfilmentIcon()} {order.fulfilmentType}
            </span>
          </div>
        </div>
      </div>

      {/* ... Order Items (Same as before) ... */}
      <div className="p-4 flex-1 space-y-3">
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 text-sm">
              <span className="font-bold text-gray-900 w-5 shrink-0 text-center bg-gray-100 rounded h-5 flex items-center justify-center text-xs">
                {item.quantity}x
              </span>
              <span className="text-gray-700 leading-tight">
                {item.name}
              </span>
            </div>
          ))}
        </div>
        {order.instructions && (
          <div className="mt-3 p-2.5 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-2 text-xs text-yellow-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="font-medium">{order.instructions}</p>
          </div>
        )}
      </div>

      {/* Footer: Actions */}
      <div className="p-4 pt-2 mt-auto">
        <div className="flex justify-between items-end mb-4 border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-500 font-medium uppercase">Total Amount</span>
          <span className="text-lg font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
        </div>

        {/* 1. ORDER PLACED (Accept/Reject) */}
        {order.orderStatus === "ORDER_PLACED" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onReject(order.orderId)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-all disabled:opacity-50"
            >
              {isRejecting ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />} Reject
            </button>
            <button
              onClick={() => onAccept(order.orderId)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isAccepting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              Accept
            </button>
          </div>
        )}

        {/* 2. ACCEPTED (Start Preparing) */}
        {order.orderStatus === "ACCEPTED" && onPrepare && (
          <button
            onClick={() => onPrepare(order.orderId)}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm shadow-orange-200 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <ChefHat size={18} />}
            Start Preparing
          </button>
        )}

        {/* 3. PREPARING (Mark as Ready) */}
        {order.orderStatus === "PREPARING" && onReady && (
          <button
            onClick={() => onReady(order.orderId)}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm shadow-green-200 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <PackageCheck size={18} />}
            Mark as Ready
          </button>
        )}

        {/* 4. Other Statuses -> Status Badge */}
        {order.orderStatus !== "ORDER_PLACED" && 
         order.orderStatus !== "ACCEPTED" && 
         order.orderStatus !== "PREPARING" && (
          <div className={`w-full py-2.5 rounded-lg text-center text-sm font-semibold flex items-center justify-center gap-2 ${
            order.orderStatus === "READY" ? "bg-green-100 text-green-700" : "bg-gray-100"
          }`}>
             {order.orderStatus === "READY" && <Check size={16} />}
             Status: {order.orderStatus}
          </div>
        )}
      </div>
    </div>
  );
};