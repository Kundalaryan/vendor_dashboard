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
        {/* CSS for Print Media (80mm Standard) */}
        <style type="text/css" media="print">
          {`
            @page { margin: 0; size: auto; }
            body { margin: 0; padding: 0; }
            
            .receipt-container {
              width: 72mm; /* slightly less than 80mm to prevent side clipping */
              padding: 4mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              color: black;
              background: white;
              page-break-after: always;
              line-height: 1.2;
            }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 14px; }
            .text-xl { font-size: 18px; }
            .text-2xl { font-size: 24px; }
            
            .divider { 
              border-top: 1px dashed black; 
              margin: 8px 0; 
            }
            
            .row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 4px; 
            }
            
            .address-block {
              font-size: 10px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          `}
        </style>

        {orders.map((order) => (
          <div key={order.orderId} className="receipt-container">
            
            {/* 1. Dynamic Vendor Header */}
            <div className="text-center">
              <div className="font-bold text-xl uppercase">{order.vendorName}</div>
              <div className="address-block">{order.vendorAddress}</div>
            </div>

            <div className="divider" />

            {/* 2. Token Number */}
            <div className="text-center">
              <span className="font-bold" style={{ fontSize: '10px' }}>TOKEN NO</span>
              <div className="font-bold text-2xl">{order.tokenNumber}</div>
            </div>

            <div className="divider" />

            {/* 3. Order Meta */}
            <div className="row">
              <span>Order ID:</span>
              <span className="font-bold">#{order.orderId}</span>
            </div>
            <div className="row">
              <span>Date:</span>
              <span>{order.date} {order.time}</span>
            </div>
            <div className="row">
              <span>Type:</span>
              <span className="font-bold uppercase">{order.fulfilmentType}</span>
            </div>

            {/* 4. Customer Details */}
            <div style={{ marginTop: '8px' }}>
              <div className="font-bold" style={{ fontSize: '10px' }}>CUSTOMER:</div>
              <div>{order.customerName || "Guest"}</div>
              <div>{order.customerPhone}</div>
              {order.customerAddress && (
                <div className="address-block" style={{ marginTop: '2px' }}>
                  Loc: {order.customerAddress}
                </div>
              )}
            </div>

            <div className="divider" />

            {/* 5. Items Table */}
            <div className="row font-bold" style={{ marginBottom: '4px', fontSize: '11px' }}>
              <span style={{ width: '10%' }}>Qt</span>
              <span style={{ width: '60%' }}>Item</span>
              <span style={{ width: '30%', textAlign: 'right' }}>Amt</span>
            </div>

            {order.items.map((item, idx) => (
              <div key={idx} className="row" style={{ alignItems: 'flex-start' }}>
                <span style={{ width: '10%' }}>{item.quantity}</span>
                <span style={{ width: '60%' }}>{item.name}</span>
                <span style={{ width: '30%', textAlign: 'right' }}>
                  {item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}

            <div className="divider" />

            {/* 6. Financials */}
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

            <div className="divider" />

            <div className="row font-bold text-lg">
              <span>TOTAL:</span>
              <span>{order.grandTotal.toFixed(2)}</span>
            </div>

            {/* 7. Instructions */}
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