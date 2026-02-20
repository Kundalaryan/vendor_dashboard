import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, Check, X, AlertTriangle, User } from "lucide-react";
import type { Order } from "../../types/order";

interface OrderCardProps {
  order: Order;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  isProcessing: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onAccept, onReject, isProcessing }) => {
  const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
  const status = order.status ?? "NEW";
  
  // Calculate if "Late" (e.g., older than 15 mins)
  const isLate = new Date().getTime() - new Date(order.createdAt).getTime() > 15 * 60 * 1000;

  return (
    <div className={`bg-white rounded-xl border shadow-sm flex flex-col h-full transition-all duration-200 ${
        isLate && status === 'NEW' ? 'border-l-4 border-l-red-500' : 'border-gray-100'
      }`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900">#{order.orderId}</span>
            {isLate && order.status === 'NEW' && (
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Late</span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 gap-1">
            <Clock size={12} />
            {timeAgo}
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {order.paymentStatus}
        </span>
      </div>

      {/* Customer & Items */}
      <div className="p-4 flex-1 space-y-4">
        {/* Customer Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <User size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{order.customerPhone}</p>
            <p className="text-xs text-gray-500 capitalize">{order.fulfilmentType.toLowerCase()}</p>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-sm">
              <div className="flex gap-2">
                <span className="font-bold text-gray-900 w-4">{item.quantity}</span>
                <span className="text-gray-700">{item.name}</span>
              </div>
              {/* Note: Price per item isn't in API, so we hide it here */}
            </div>
          ))}
        </div>

        {/* Instructions */}
        {order.instructions && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-800 border border-yellow-100">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span className="font-medium">Note: {order.instructions}</span>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">Total</span>
          <span className="text-xl font-bold text-blue-600">₹{order.totalAmount.toFixed(2)}</span>
        </div>

        {status === "NEW" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onReject(order.orderId)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <X size={16} /> Reject
            </button>
            <button
              onClick={() => onAccept(order.orderId)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm shadow-green-200 transition-colors disabled:opacity-50"
            >
              <Check size={16} /> Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
