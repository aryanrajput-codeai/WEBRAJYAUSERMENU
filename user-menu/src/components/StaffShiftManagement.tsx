import React, { useState, useMemo, useEffect } from "react";
import { 
  DollarSign, 
  Clock, 
  FileText, 
  CheckCircle, 
  Lock, 
  Unlock, 
  TrendingUp,
  AlertTriangle,
  Printer
} from "lucide-react";
import { LocalDB, Order } from "../lib/db";

interface ShiftData {
  isOpen: boolean;
  openedBy: string;
  openedAt: string;
  closedAt?: string;
  startingFloat: number;
  expectedCash: number;
  expectedUPI: number;
  expectedCard: number;
  actualCashClosed?: number;
  discrepancy?: number;
  notes?: string;
}

export default function StaffShiftManagement({ staffRole }: { staffRole: string }) {
  // Check if there is an active shift
  const [shift, setShift] = useState<ShiftData | null>(() => {
    const saved = localStorage.getItem("ij_active_shift");
    if (saved) return JSON.parse(saved);
    return null;
  });

  const [openingFloat, setOpeningFloat] = useState("1500"); // default Starting cash drawer float
  const [actualCashClosed, setActualCashClosed] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const [orders, setOrders] = useState<Order[]>(() => LocalDB.getOrders());

  useEffect(() => {
    const handleUpdate = () => {
      setOrders(LocalDB.getOrders());
    };
    window.addEventListener("storage", handleUpdate);
    return () => window.removeEventListener("storage", handleUpdate);
  }, []);

  // Compute shift revenues if open
  const computedShiftSales = useMemo(() => {
    if (!shift || !shift.isOpen) return { cash: 0, upi: 0, card: 0, total: 0 };
    
    const startTime = new Date(shift.openedAt).getTime();
    
    // Filter paid orders since shift started
    const shiftOrders = orders.filter(o => {
      const isPaid = o.paymentStatus === "Paid";
      const oTime = new Date(o.createdAt).getTime();
      return isPaid && oTime >= startTime;
    });

    let cash = 0;
    let upi = 0;
    let card = 0;

    shiftOrders.forEach(o => {
      const m = o.paymentMethod || "Cash";
      if (m === "Cash") cash += o.grandTotal;
      else if (m === "UPI") upi += o.grandTotal;
      else if (m === "Card") card += o.grandTotal;
    });

    return {
      cash,
      upi,
      card,
      total: cash + upi + card
    };
  }, [shift, orders]);

  // Handle open shift
  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const floatVal = parseFloat(openingFloat);
    if (isNaN(floatVal) || floatVal < 0) {
      alert("Invalid starting cash float amount!");
      return;
    }

    const newShift: ShiftData = {
      isOpen: true,
      openedBy: staffRole,
      openedAt: new Date().toISOString(),
      startingFloat: floatVal,
      expectedCash: floatVal,
      expectedUPI: 0,
      expectedCard: 0
    };

    setShift(newShift);
    localStorage.setItem("ij_active_shift", JSON.stringify(newShift));
    LocalDB.addAuditLog("Shift Opened", `Staff ${staffRole} opened shift with starting float: ₹${floatVal}`, staffRole);
    alert(`🔐 Shift successfully OPENED! Register drawer initialized with Starting Float: ₹${floatVal}`);
  };

  // Handle close shift
  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift) return;

    const actualCash = parseFloat(actualCashClosed);
    if (isNaN(actualCash) || actualCash < 0) {
      alert("Please enter a valid actual cash drawer closing count.");
      return;
    }

    const expectedCashInDrawer = shift.startingFloat + computedShiftSales.cash;
    const difference = actualCash - expectedCashInDrawer;

    const closedShift: ShiftData = {
      ...shift,
      isOpen: false,
      closedAt: new Date().toISOString(),
      expectedCash: expectedCashInDrawer,
      expectedUPI: computedShiftSales.upi,
      expectedCard: computedShiftSales.card,
      actualCashClosed: actualCash,
      discrepancy: difference,
      notes: closingNotes
    };

    // Save to historical shift logs
    const historyStored = localStorage.getItem("ij_shift_history");
    const history = historyStored ? JSON.parse(historyStored) : [];
    history.unshift(closedShift);
    localStorage.setItem("ij_shift_history", JSON.stringify(history));

    // Clear active shift
    setShift(null);
    localStorage.removeItem("ij_active_shift");
    setClosingNotes("");
    setActualCashClosed("");

    LocalDB.addAuditLog("Shift Closed", `Closed shift. Discrepancy: ₹${difference}. Note: ${closingNotes}`, staffRole);
    
    // Print closing report simulated
    alert(`🔓 Shift closed! Expected Cash: ₹${expectedCashInDrawer} | Actual Cash: ₹${actualCash} | Difference: ₹${difference}. Shift Summary report archived successfully.`);
  };

  return (
    <div className="space-y-6 text-left font-sans h-[calc(100vh-140px)] overflow-y-auto pr-1">
      
      {/* 1. If Shift is CLOSED */}
      {!shift && (
        <div className="max-w-md mx-auto bg-white border border-stone-200 p-6 rounded-2xl shadow-2xs mt-8 text-center space-y-6">
          <div className="w-12 h-12 bg-[#C67C4E]/10 border border-[#C67C4E]/20 text-[#C67C4E] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider">Initialize Cash Register Shift</h3>
            <p className="text-2xs text-stone-500 mt-1">Provide the starting cash drawer float to open the register and begin accepting guest orders.</p>
          </div>

          <form onSubmit={handleOpenShift} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest block">Starting cash float (₹)</label>
              <input 
                type="number"
                required
                value={openingFloat}
                onChange={e => setOpeningFloat(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm font-bold text-stone-900 focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-stone-900 to-stone-850 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-4 h-4 text-[#C67C4E]" />
              <span>Open Cashier Register</span>
            </button>
          </form>
        </div>
      )}

      {/* 2. If Shift is OPEN */}
      {shift && shift.isOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Active Sales metrics (Col: 7) */}
          <div className="lg:col-span-7 bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs space-y-5">
            
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">Shift status</span>
                <h3 className="text-base font-serif font-bold text-[#C67C4E] flex items-center gap-1.5 mt-0.5 animate-pulse">
                  <span>● Active Register Session</span>
                </h3>
              </div>
              <span className="text-2xs font-mono text-stone-400">
                Opened: {new Date(shift.openedAt).toLocaleTimeString()} · By {shift.openedBy}
              </span>
            </div>

            <hr className="border-stone-100" />

            {/* Quick stats board */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-stone-50 border border-stone-150 p-3 rounded-xl">
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-tight block">Initial Float</span>
                <span className="text-sm font-black text-stone-900 font-mono block mt-1">₹{shift.startingFloat}</span>
              </div>
              
              <div className="bg-stone-50 border border-stone-150 p-3 rounded-xl">
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-tight block">Shift Sales</span>
                <span className="text-sm font-black text-emerald-600 font-mono block mt-1">₹{computedShiftSales.total}</span>
              </div>

              <div className="bg-[#C67C4E]/5 border border-[#C67C4E]/10 p-3 rounded-xl">
                <span className="text-[9px] font-mono font-bold text-[#C67C4E] uppercase tracking-tight block">Expected Drawer</span>
                <span className="text-sm font-black text-[#C67C4E] font-mono block mt-1">
                  ₹{shift.startingFloat + computedShiftSales.cash}
                </span>
              </div>
            </div>

            {/* Segment breakdown */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-mono font-bold text-stone-450 uppercase tracking-wider">Sales Segment Revenue Breakdown</h4>
              <div className="border border-stone-150 rounded-xl overflow-hidden divide-y divide-stone-100">
                <div className="p-3 bg-white flex justify-between items-center text-xs text-stone-700">
                  <span className="font-bold flex items-center gap-1.5">💵 Expected Drawer Cash (Float + Cash Sales)</span>
                  <span className="font-mono text-stone-900 font-bold">₹{shift.startingFloat + computedShiftSales.cash}</span>
                </div>
                <div className="p-3 bg-white flex justify-between items-center text-xs text-stone-700">
                  <span className="font-bold flex items-center gap-1.5">📱 UPI Net Sales</span>
                  <span className="font-mono text-stone-900 font-bold">₹{computedShiftSales.upi}</span>
                </div>
                <div className="p-3 bg-white flex justify-between items-center text-xs text-stone-700">
                  <span className="font-bold flex items-center gap-1.5">💳 Card Net Sales</span>
                  <span className="font-mono text-stone-900 font-bold">₹{computedShiftSales.card}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Closing shift form (Col: 5) */}
          <div className="lg:col-span-5 bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">Reconcile & Close Register</h3>
              <p className="text-2xs text-stone-500 mt-1">Count manual drawer cash to audit difference discrepancy before shift completion.</p>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-450 uppercase block">Actual Closing Cash Counted (₹)</label>
                <input 
                  type="number"
                  required
                  placeholder="e.g. 5240"
                  value={actualCashClosed}
                  onChange={e => setActualCashClosed(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-[#C67C4E]"
                />
              </div>

              {actualCashClosed && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-150 text-xs font-mono space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Expected Register Cash:</span>
                    <span>₹{shift.startingFloat + computedShiftSales.cash}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Actual Counted Cash:</span>
                    <span>₹{parseFloat(actualCashClosed) || 0}</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-200/60 pt-1 font-black text-sm">
                    <span>Discrepancy (Diff):</span>
                    <span>₹{((parseFloat(actualCashClosed) || 0) - (shift.startingFloat + computedShiftSales.cash)).toFixed(0)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-450 uppercase block">Reconciliation Note</label>
                <textarea 
                  placeholder="Add drawer remarks or recount comments..."
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs text-stone-900 focus:outline-none h-16 resize-none font-sans"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Archive Register & Lock Shift</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Historical closed shift registers */}
      <div className="mt-4 pt-6 border-t border-stone-150">
        <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">Historical Registers Log</h4>
        
        <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-stone-100 bg-white">
          <div className="hidden sm:grid grid-cols-5 gap-4 p-4 bg-stone-50 text-[10px] font-mono font-bold text-stone-450 uppercase tracking-wider">
            <span>Opened/Closed</span>
            <span>Staff</span>
            <span>Expected Cash</span>
            <span>Actual Closed</span>
            <span className="text-right">Difference</span>
          </div>

          {(JSON.parse(localStorage.getItem("ij_shift_history") || "[]") as ShiftData[]).map((sh, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 p-4 items-center text-xs text-stone-800">
              
              {/* Col 1 */}
              <div>
                <span className="font-bold text-stone-900 block">
                  {new Date(sh.openedAt).toLocaleDateString()}
                </span>
                <span className="text-[9px] text-stone-400 font-mono">
                  {new Date(sh.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {sh.closedAt ? new Date(sh.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                </span>
              </div>

              {/* Col 2 */}
              <div className="text-stone-600 font-bold">{sh.openedBy}</div>

              {/* Col 3 */}
              <div className="font-mono font-bold text-stone-700">₹{sh.expectedCash}</div>

              {/* Col 4 */}
              <div className="font-mono font-bold text-stone-900">₹{sh.actualCashClosed}</div>

              {/* Col 5 */}
              <div className={`text-right font-mono font-black ${
                (sh.discrepancy || 0) < 0 ? "text-red-600" : (sh.discrepancy || 0) > 0 ? "text-emerald-600" : "text-stone-400"
              }`}>
                ₹{sh.discrepancy || 0}
              </div>

            </div>
          ))}

          {(JSON.parse(localStorage.getItem("ij_shift_history") || "[]")).length === 0 && (
            <p className="text-xs text-stone-400 italic text-center py-8">No closed register sessions logged yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
