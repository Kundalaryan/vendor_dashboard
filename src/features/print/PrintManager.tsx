import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { Printer, Loader2, Zap } from "lucide-react";
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

  // 2. Poll for Pending Prints
  const { data: pendingOrders = [] } = useQuery({
    queryKey: ["pending-prints"],
    queryFn: printService.getPendingPrints,
    refetchInterval: 10000, 
  });

  // 3. Mark Complete Mutation
  const completeMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      await Promise.all(orderIds.map(id => printService.markPrintComplete(id)));
    },
    onSuccess: () => {
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
      // LOGIC FOR SILENT PRINTING:
      if (autoComplete) {
        // If "Auto-Complete" is ON, we assume success immediately
        if (pendingOrders.length > 0) {
          const ids = pendingOrders.map(o => o.orderId);
          completeMutation.mutate(ids);
        }
      } else {
        // Otherwise, ask for confirmation
        setShowConfirmation(true);
      }
    }
  });

  // If no orders, hide everything
  if (pendingOrders.length === 0 && !showConfirmation) return null;

  return (
    <>
      {/* --- PRINT BUTTON --- */}
      {pendingOrders.length > 0 && !showConfirmation && (
        <div className="flex items-center gap-2 mr-4">
          
          {/* Settings Toggle (Small Icon) */}
          <button 
            onClick={toggleAutoComplete}
            title={autoComplete ? "Auto-Complete ON: Printing will instantly mark orders as done" : "Auto-Complete OFF: You will be asked to confirm printing"}
            className={`p-2 rounded-full transition-colors ${
              autoComplete ? "text-green-600 bg-green-50" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Zap size={18} fill={autoComplete ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={() => handlePrint()}
            disabled={completeMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm animate-pulse transition-all"
          >
            {completeMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
            <span>Print Pending ({pendingOrders.length})</span>
          </button>
        </div>
      )}

      {/* Hidden Receipt */}
      <div style={{ display: "none" }}>
        <ReceiptBatch ref={componentRef} orders={pendingOrders} />
      </div>

      {/* --- CONFIRMATION MODAL (Only shows if Auto-Complete is OFF) --- */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100">
             {/* ... (Same modal content as previous code) ... */}
             <div className="text-center">
                <h3 className="font-bold">Did receipts print?</h3>
                <div className="flex gap-3 mt-4">
                   <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border rounded">Retry</button>
                   <button onClick={() => {
                     const ids = pendingOrders.map(o => o.orderId);
                     completeMutation.mutate(ids);
                   }} className="px-4 py-2 bg-green-600 text-white rounded">Yes</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};
