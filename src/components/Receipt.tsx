import React from "react";
import type { PrintOrder } from "../types/print";

interface ReceiptBatchProps {
  orders: PrintOrder[];
}

export const ReceiptBatch = React.forwardRef<HTMLDivElement, ReceiptBatchProps>(({ orders }, ref) => {
  if (!orders || orders.length === 0) return null;

  return (
    <div style={{ display: "none" }}>
      <div ref={ref}>
        {/* CSS for Print Media */}
        <style type="text/css" media="print">
          {`
            @page { margin: 0; size: auto; }
            body { margin: 0; padding: 0; }
            
            .receipt-container {
              width: 72mm; /* 80mm paper with safe margins */
              padding: 4mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.2;
              color: black;
              background: white;
              page-break-after: always; /* CUT PAPER HERE */
            }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-xl { font-size: 18px; }
            .text-2xl { font-size: 24px; }
            .divider { border-top: 1px dashed black; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          `}
        </style>

        {orders.map((order) => (
          <div key={order.orderId} className="receipt-container">
            
            {/* Header */}
            <div className="text-center">
              <div className="font-bold text-xl uppercase">{order.vendorName}</div>
              <div style={{ fontSize: '10px' }}>{order.vendorAddress}</div>
            </div>

            <div className="divider" />

            {/* Token */}
            <div className="text-center">
              <span className="font-bold" style={{ fontSize: '10px' }}>TOKEN NO</span>
              <div className="font-bold text-2xl">{order.tokenNumber}</div>
            </div>

            <div className="divider" />

            {/* Details */}
            <div className="row">
              <span>Order:</span>
              <span className="font-bold">#{order.orderId}</span>
            </div>
            <div className="row">
              <span>Time:</span>
              <span>{order.date} {order.time}</span>
            </div>
            <div className="row">
              <span>Type:</span>
              <span className="font-bold uppercase">{order.fulfilmentType}</span>
            </div>

            {/* Customer */}
            <div style={{ marginTop: '8px' }}>
              <div className="font-bold" style={{ fontSize: '10px' }}>CUSTOMER:</div>
              <div>{order.customerName || "Guest"}</div>
              <div>{order.customerPhone}</div>
              {order.customerAddress && (
                <div style={{ fontSize: '10px' }}>Loc: {order.customerAddress}</div>
              )}
            </div>

            <div className="divider" />

            {/* Items */}
            <div className="row font-bold" style={{ marginBottom: '4px', fontSize: '11px' }}>
              <span style={{ width: '10%' }}>Qt</span>
              <span style={{ width: '60%' }}>Item</span>
              <span style={{ width: '30%', textAlign: 'right' }}>Amt</span>
            </div>

            {order.items.map((item, idx) => (
              <div key={idx} className="row" style={{ alignItems: 'flex-start' }}>
                <span style={{ width: '10%' }}>{item.quantity}</span>
                <span style={{ width: '60%' }}>{item.name}</span>
                <span style={{ width: '30%', textAlign: 'right' }}>{item.lineTotal.toFixed(2)}</span>
              </div>
            ))}

            <div className="divider" />

            {/* Totals */}
            <div className="row">
              <span>Subtotal:</span>
              <span>{order.itemTotal.toFixed(2)}</span>
            </div>
            {order.packingFee > 0 && (
              <div className="row">
                <span>Packing:</span>
                <span>{order.packingFee.toFixed(2)}</span>
              </div>
            )}
            {order.deliveryFee > 0 && (
              <div className="row">
                <span>Delivery:</span>
                <span>{order.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            
            <div className="row font-bold text-xl" style={{ marginTop: '5px' }}>
              <span>TOTAL:</span>
              <span>{order.grandTotal.toFixed(2)}</span>
            </div>

            {/* Note */}
            {order.instructions && (
              <div style={{ marginTop: '10px', border: '1px solid black', padding: '5px' }}>
                <div className="font-bold" style={{ fontSize: '10px' }}>NOTE:</div>
                <div style={{ fontSize: '11px' }}>{order.instructions}</div>
              </div>
            )}

            <div className="text-center" style={{ marginTop: '20px', fontSize: '10px' }}>
              *** THANK YOU ***
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ReceiptBatch.displayName = "ReceiptBatch";