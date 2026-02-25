import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { Printer, Loader2, CheckCircle, XCircle, AlertTriangle, Zap } from "lucide-react";
import { printService } from "../../services/printService";
import { ReceiptBatch } from "../../components/Receipt";

export const PrintManager = () => {
  const queryClient = useQueryClient();
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Load "Auto-Complete" setting from local storage
  const [autoComplete, setAutoComplete] = useState(() => {
    return localStorage.getItem("print_auto_complete") === "true";
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  // 1. Toggle Auto-Complete
  const toggleAutoComplete = () => {
    const newValue = !autoComplete;
    setAutoComplete(newValue);
    localStorage.setItem("print_auto_complete", String(newValue));
  };

  // 2. Poll for Pending Prints (Every 10 seconds)
  const { data: pendingOrders = [] } = useQuery({
    queryKey: ["pending-prints"],
    queryFn: printService.getPendingPrints,
    refetchInterval: 10000, 
  });

  // 3. Mutation to mark complete
  const completeMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      // Parallel execution is faster
      await Promise.all(orderIds.map(id => printService.markPrintComplete(id)));
    },
    onSuccess: () => {
      // Optimistic update: Clear list immediately
      queryClient.setQueryData(["pending-prints"], []); 
      queryClient.invalidateQueries({ queryKey: ["pending-prints"] });
      setShowConfirmation(false);
    }
  });

  // 4. Print Handler
  const handlePrint = useReactToPrint({
    contentRef: componentRef, 
    documentTitle: "Vendor_Receipts",
    onAfterPrint: () => {
      // IF Auto-Complete is ON, we assume success immediately
      if (autoComplete) {
        if (pendingOrders.length > 0) {
          const ids = pendingOrders.map(o => o.orderId);
          completeMutation.mutate(ids);
        }
      } else {
        // ELSE, ask for confirmation
        setShowConfirmation(true);
      }
    }
  });

  // If no orders to print AND we are not confirming, hide everything
  if (pendingOrders.length === 0 && !showConfirmation) {
    return null;
  }

  return (
    <>
      {/* --- BUTTONS IN NAVBAR --- */}
      {pendingOrders.length > 0 && !showConfirmation && (
        <div className="flex items-center gap-2 mr-4 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          
          {/* Settings Toggle (Small Icon) */}
          <button 
            onClick={toggleAutoComplete}
            title={autoComplete ? "Auto-Complete ON: Printing will instantly mark orders as done" : "Auto-Complete OFF: You will be asked to confirm printing"}
            className={`p-2 rounded-md transition-colors ${
              autoComplete ? "text-green-600 bg-green-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Zap size={18} fill={autoComplete ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={() => handlePrint()}
            disabled={completeMutation.isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm animate-pulse transition-all"
          >
            {completeMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
            <span>Print Pending ({pendingOrders.length})</span>
          </button>
        </div>
      )}

      {/* --- HIDDEN RECEIPT COMPONENT --- */}
      {/* This renders ALL pending orders in one go */}
      <div style={{ display: "none" }}>
        <ReceiptBatch ref={componentRef} orders={pendingOrders} />
      </div>

      {/* --- CONFIRMATION MODAL (Only shows if Auto-Complete is OFF) --- */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100">
             <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Did the receipts print?</h3>
                <p className="text-sm text-gray-500 mt-2 mb-6">
                  Confirming will remove these orders from the print queue.
                </p>
                <div className="flex gap-3 w-full">
                   <button 
                     onClick={() => setShowConfirmation(false)} 
                     className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                   >
                     No, Retry
                   </button>
                   <button 
                     onClick={() => {
                       const ids = pendingOrders.map(o => o.orderId);
                       completeMutation.mutate(ids);
                     }} 
                     className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"
                   >
                     Yes, Printed
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};