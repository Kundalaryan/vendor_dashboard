export interface PrintOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PrintOrder {
  orderId: number;
  tokenNumber: number;
  date: string;          // "20 Feb 2026"
  time: string;          // "19:02"
  vendorName: string;    // "GrandStand Express"
  vendorAddress: string; // "North Block IIT Jammu"
  customerName: string | null;
  customerPhone: string;
  customerAddress: string | null; // "Egret hostel"
  fulfilmentType: string;
  instructions: string | null;
  items: PrintOrderItem[];
  itemTotal: number;
  packingFee: number;
  deliveryFee: number;
  grandTotal: number;
}