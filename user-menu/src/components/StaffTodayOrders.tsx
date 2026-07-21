import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Printer, 
  Eye, 
  Clock, 
  DollarSign, 
  BookOpen, 
  RefreshCw 
} from "lucide-react";
import { LocalDB, Order } from "../lib/db";
import { PhysicalThermalPrinter, getWRPrinterSettings } from "../lib/printerService";

export default function StaffTodayOrders() {
  const [orders, setOrders] = useState<Order[]>(() => LocalDB.getOrders());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setOrders(LocalDB.getOrders());
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("menu_updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("menu_updated", handleUpdate);
    };
  }, []);

  // Filter only today's bills
  const todayBills = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders.filter(o => {
      const matchDate = new Date(o.createdAt).toDateString() === todayStr;
      if (!matchDate) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return o.id.toLowerCase().includes(query) || o.customerName.toLowerCase().includes(query) || o.phoneNumber.includes(query);
      }
      return true;
    });
  }, [orders, searchQuery]);

  // Reprint Receipt
  const handleReprintReceipt = async (ord: Order) => {
    try {
      const pSettings = getWRPrinterSettings();
      const settings = LocalDB.getSettings();
      if (pSettings.useQZTray) {
        await PhysicalThermalPrinter.printBill(ord, settings, pSettings.paperWidth, "qz");
        alert(`🚀 Thermal receipt for ${ord.id} reprinted silently!`);
      } else {
        PhysicalThermalPrinter.printPremiumHTML("bill", ord, settings, { showHeader: true });
      }
    } catch (err: any) {
      alert("Reprint failed: " + (err.message || err));
    }
  };

  return (
    <div className="space-y-5 text-left font-sans h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      
      {/* Top filter layout */}
      <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">Today's Transactions Log</h3>
          <p className="text-2xs text-stone-500 mt-0.5">Reprint receipts and audit immediate counter collections.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text"
            placeholder="Search today's bills by ref / client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 focus:border-[#C67C4E]/60 text-2xs rounded-xl focus:outline-none text-stone-900 font-sans"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="flex-grow overflow-y-auto pr-1">
        <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-stone-100 bg-white">
          
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-6 gap-4 p-4 bg-stone-50 text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
            <span>Bill Ref</span>
            <span>Time</span>
            <span>Customer Details</span>
            <span>Amount</span>
            <span>Method / Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Data rows */}
          {todayBills.map((ord) => (
            <div key={ord.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 p-4 items-center hover:bg-stone-50/60 transition-all text-xs text-stone-800">
              
              {/* Column 1: Bill Ref */}
              <div>
                <span className="text-xs font-bold text-stone-900 font-mono">{ord.id}</span>
                <span className="text-[10px] text-stone-400 font-mono block md:hidden">
                  {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Column 2: Time */}
              <div className="hidden md:block font-mono text-stone-500">
                {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Column 3: Customer Details */}
              <div>
                <div className="font-bold text-stone-900 leading-tight">{ord.customerName}</div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                  {ord.phoneNumber} {ord.tableNumber && `| Table: #${ord.tableNumber}`}
                </div>
              </div>

              {/* Column 4: Amount */}
              <div className="font-serif font-black text-stone-900 text-sm">
                ₹{ord.grandTotal}
              </div>

              {/* Column 5: Payment method / status */}
              <div className="flex flex-wrap gap-1 items-center">
                <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase rounded ${
                  ord.paymentStatus === "Paid" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                  {ord.paymentStatus}
                </span>
                
                {ord.paymentMethod && (
                  <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold">
                    {ord.paymentMethod}
                  </span>
                )}
              </div>

              {/* Column 6: Actions */}
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setSelectedOrder(ord)}
                  className="px-2.5 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded-xl cursor-pointer flex items-center justify-center gap-1 text-[10px] font-mono font-bold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
                <button 
                  onClick={() => handleReprintReceipt(ord)}
                  className="px-2.5 py-1.5 bg-[#C67C4E] hover:bg-[#b0673d] text-white rounded-xl cursor-pointer flex items-center justify-center gap-1 text-[10px] font-mono font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Reprint</span>
                </button>
              </div>

            </div>
          ))}

          {todayBills.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-xs text-stone-400 italic">No checkout transactions recorded today yet.</p>
            </div>
          )}

        </div>
      </div>

      {/* View Bill Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-stone-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative text-left">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wide pb-2 border-b border-stone-100 mb-4">
              Receipt: {selectedOrder.id}
            </h3>

            <div className="space-y-4 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-150 font-mono text-[10px] text-stone-500 space-y-0.5">
                <p className="font-bold text-stone-850">Client: {selectedOrder.customerName}</p>
                <p>Phone: {selectedOrder.phoneNumber}</p>
                <p>Time: {new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                {selectedOrder.paymentMethod && <p>Paid Mode: {selectedOrder.paymentMethod}</p>}
              </div>

              <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                {selectedOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between font-sans">
                    <span>{i.quantity}x {i.name}</span>
                    <span className="font-mono">₹{i.price * i.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-3 space-y-1 font-mono text-right text-stone-500">
                <div className="flex justify-between max-w-[180px] ml-auto">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between max-w-[180px] ml-auto">
                  <span>GST:</span>
                  <span>₹{selectedOrder.gst}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between max-w-[180px] ml-auto text-red-600 font-bold">
                    <span>Special Discount:</span>
                    <span>-₹{selectedOrder.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between max-w-[180px] ml-auto text-xs font-serif font-extrabold text-stone-900 pt-1 border-t border-stone-200">
                  <span>Total Paid:</span>
                  <span className="text-[#C67C4E]">₹{selectedOrder.grandTotal}</span>
                </div>
              </div>

              <button 
                onClick={() => handleReprintReceipt(selectedOrder)}
                className="w-full py-2.5 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer"
              >
                Print Receipt Copy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
