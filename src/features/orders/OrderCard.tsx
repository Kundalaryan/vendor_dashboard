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
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, onAccept, onReject, onPrepare, onReady, isProcessing 
}) => {
  // ... existing date and icon logic ...
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full overflow-hidden">
      
      {/* ... Header and Customer Info (Same as before) ... */}
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">#{order.orderId}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
            order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {order.paymentStatus}
          </span>
        </div>
        <div className="flex items-center text-xs text-gray-500 gap-1.5">
          <Clock size={12} />
          {timeAgo}
        </div>
      </div>

      <div className="px-4 py-3 flex items-start gap-3 border-b border-gray-50 border-dashed">
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <User size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {order.customerName || "Guest Customer"}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Phone size={10} /> {order.customerPhone}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="flex items-center gap-1 font-medium text-gray-700 bg-gray-100 px-1.5 rounded">
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
              <X size={16} /> Reject
            </button>
            <button
              onClick={() => onAccept(order.orderId)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} 
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
