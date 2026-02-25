import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { Printer, Loader2, AlertTriangle, Zap } from "lucide-react";
import { printService } from "../../services/printService";
import { ReceiptBatch } from "../../components/Receipt";

export const PrintManager = () => {
  const queryClient = useQueryClient();
  const componentRef = useRef<HTMLDivElement>(null);
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Load "Zap Mode" setting
  const [autoComplete, setAutoComplete] = useState(() => {
    return localStorage.getItem("print_auto_complete") === "true";
  });

  // Toggle Zap Mode
  const toggleAutoComplete = () => {
    const newValue = !autoComplete;
    setAutoComplete(newValue);
    localStorage.setItem("print_auto_complete", String(newValue));
  };

  // Poll for Pending Prints (Every 10 seconds)
  const { data: pendingOrders = [] } = useQuery({
    queryKey: ["pending-prints"],
    queryFn: printService.getPendingPrints,
    refetchInterval: 10000, 
  });

  // Mark Complete Mutation
  const completeMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      await Promise.all(orderIds.map(id => printService.markPrintComplete(id)));
    },
    onSuccess: () => {
      queryClient.setQueryData(["pending-prints"], []); 
      queryClient.invalidateQueries({ queryKey: ["pending-prints"] });
      setShowConfirmation(false);
      setIsPrinting(false);
    },
    onError: () => {
      setIsPrinting(false);
    }
  });

  // Print Handler
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Vendor_Receipts",
    onAfterPrint: () => {
      if (autoComplete) {
        if (pendingOrders.length > 0) {
          const ids = pendingOrders.map(o => o.orderId);
          completeMutation.mutate(ids);
        } else {
          setIsPrinting(false);
        }
      } else {
        setShowConfirmation(true);
        setIsPrinting(false);
      }
    }
  });

  // --- AUTOMATION LOGIC ---
  useEffect(() => {
    if (autoComplete && pendingOrders.length > 0 && !isPrinting) {
      setIsPrinting(true); 
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [pendingOrders, autoComplete, isPrinting, handlePrint]);

  const hasOrders = pendingOrders.length > 0;
  const isLoading = completeMutation.isPending || isPrinting;

  return (
    <>
      {/* --- PERMANENT HEADER TOOLBAR --- */}
      <div className="flex items-center gap-1 mr-4 bg-white p-1 rounded-lg border border-gray-200 shadow-sm h-9">
        
        {/* 1. Zap Toggle (Always Visible & Interactive) */}
        <button 
          onClick={toggleAutoComplete}
          title={autoComplete ? "Zap Mode ON: Auto-print enabled" : "Zap Mode OFF: Manual print"}
          className={`p-1.5 rounded-md transition-all duration-200 ${
            autoComplete 
              ? "text-green-600 bg-green-50 hover:bg-green-100" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Zap size={18} fill={autoComplete ? "currentColor" : "none"} />
        </button>

        {/* Separator */}
        <div className="w-px h-4 bg-gray-200 mx-1"></div>

        {/* 2. Print Button (Visible but changes state) */}
        <button 
          onClick={() => { setIsPrinting(true); handlePrint(); }}
          disabled={!hasOrders || isLoading}
          className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all ${
            hasOrders 
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm animate-pulse cursor-pointer" 
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Printer size={14} />
          )}
          
          <span className="whitespace-nowrap">
            {hasOrders ? `Print (${pendingOrders.length})` : "No Prints"}
          </span>
        </button>
      </div>

      {/* Hidden Receipt Component */}
      <div style={{ display: "none" }}>
        <ReceiptBatch ref={componentRef} orders={pendingOrders} />
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100">
             <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Did the receipts print?</h3>
                <div className="flex gap-3 w-full mt-6">
                   <button 
                     onClick={() => setShowConfirmation(false)} 
                     className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium text-sm"
                   >
                     No, Retry
                   </button>
                   <button 
                     onClick={() => {
                       const ids = pendingOrders.map(o => o.orderId);
                       completeMutation.mutate(ids);
                     }} 
                     className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                   >
                     Yes
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};