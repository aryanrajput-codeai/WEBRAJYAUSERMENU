import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Users, 
  Grid, 
  Zap, 
  Printer, 
  ChevronRight, 
  UtensilsCrossed 
} from "lucide-react";
import { motion } from "motion/react";
import { LocalDB, Order } from "../lib/db";
import { PhysicalThermalPrinter, getWRPrinterSettings } from "../lib/printerService";

interface StaffDashboardHomeProps {
  onNavigate: (tab: string, params?: any) => void;
  staffRole: string;
}

export default function StaffDashboardHome({ onNavigate, staffRole }: StaffDashboardHomeProps) {
  const [orders, setOrders] = useState<Order[]>(() => LocalDB.getOrders());
  const [tables, setTables] = useState(() => LocalDB.getTables());
  const [lastBill, setLastBill] = useState<Order | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      const allOrders = LocalDB.getOrders();
      setOrders(allOrders);
      setTables(LocalDB.getTables());
      
      // Get last completed paid bill
      const completed = allOrders.filter(o => o.paymentStatus === "Paid");
      if (completed.length > 0) {
        setLastBill(completed[0]);
      }
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("menu_updated", handleUpdate);
    window.addEventListener("tables_updated", handleUpdate);
    
    handleUpdate();

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("menu_updated", handleUpdate);
      window.removeEventListener("tables_updated", handleUpdate);
    };
  }, []);

  // Compute live counts
  const todayDateStr = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayDateStr);
  const todaySales = todayOrders
    .filter(o => o.paymentStatus === "Paid" || o.orderStatus === "Served" || o.orderStatus === "Delivered")
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const pendingOrdersCount = orders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Served" && o.orderStatus !== "Cancelled").length;
  const completedOrdersCount = todayOrders.filter(o => o.orderStatus === "Delivered" || o.orderStatus === "Served").length;
  
  const occupiedTables = tables.filter(t => t.status === "Occupied").length;
  const availableTables = tables.filter(t => t.status === "Available" || t.status === "Service Required").length;

  // Print last bill
  const handlePrintLastBill = async () => {
    if (!lastBill) {
      alert("No bills printed today yet!");
      return;
    }
    try {
      const settings = LocalDB.getSettings();
      const pSettings = getWRPrinterSettings();
      if (pSettings.useQZTray) {
        await PhysicalThermalPrinter.printBill(lastBill, settings, pSettings.paperWidth, "qz");
        alert("🚀 Last bill sent silently to printer!");
      } else {
        PhysicalThermalPrinter.printPremiumHTML("bill", lastBill, settings, { showHeader: true });
      }
    } catch (err: any) {
      alert("Print failed: " + (err.message || err));
    }
  };

  // Determine permissions
  const canSeeSales = staffRole === "Manager" || staffRole === "Cashier";

  return (
    <div className="space-y-6 w-full text-left font-sans">
      
      {/* Top Banner & Quick Role Info */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-850 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-48 h-48 bg-stone-800/40 rounded-full blur-2xl" />
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#C67C4E] uppercase bg-[#C67C4E]/10 px-2.5 py-1 rounded-md border border-[#C67C4E]/20">
            Workstation Active
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-wide uppercase pt-2">
            Namaste, {staffRole}!
          </h2>
          <p className="text-xs text-stone-400 font-light max-w-md">
            Welcome to your dedicated Staff POS Command Center. Optimized for rapid touchscreen order taking and kitchen dispatch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 relative z-10 w-full md:w-auto">
          <button 
            onClick={() => onNavigate("pos")}
            className="flex-1 md:flex-none px-4 py-2.5 bg-[#C67C4E] hover:bg-[#b0673d] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Launch Billing</span>
          </button>
          <button 
            onClick={handlePrintLastBill}
            disabled={!lastBill}
            className="flex-1 md:flex-none px-4 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:bg-stone-800/50 disabled:text-stone-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-stone-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Last Bill</span>
          </button>
        </div>
      </div>

      {/* Grid: Stats Telemetry */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Today's Sales */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[105px]">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Today's Sales
          </span>
          <div className="py-2">
            <span className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight block">
              {canSeeSales ? `₹${todaySales.toLocaleString("en-IN")}` : "Protected"}
            </span>
            <span className="text-[10px] text-stone-405 leading-none block pt-0.5 font-mono">
              {canSeeSales ? "Paid checkouts" : "Manager code req."}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>+100% SECURE</span>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[105px]">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Today's Orders
          </span>
          <div className="py-2">
            <span className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight block">
              {todayOrders.length}
            </span>
            <span className="text-[10px] text-stone-405 leading-none block pt-0.5 font-mono">
              Processed today
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-stone-500">
            <ShoppingBag className="w-3 h-3 text-stone-400" />
            <span>LIFETIME POOL</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[105px]">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Pending Orders
          </span>
          <div className="py-2">
            <span className="text-lg sm:text-2xl font-bold text-amber-600 tracking-tight block">
              {pendingOrdersCount}
            </span>
            <span className="text-[10px] text-stone-405 leading-none block pt-0.5 font-mono">
              Awaiting delivery
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-600">
            <Clock className="w-3 h-3 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
            <span>KITCHEN LIVE</span>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[105px]">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Completed Orders
          </span>
          <div className="py-2">
            <span className="text-lg sm:text-2xl font-bold text-green-600 tracking-tight block">
              {completedOrdersCount}
            </span>
            <span className="text-[10px] text-stone-405 leading-none block pt-0.5 font-mono">
              Served today
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-green-600">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>DISPATCHED</span>
          </div>
        </div>

        {/* Occupied Tables */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[105px]">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Occupied Tables
          </span>
          <div className="py-2">
            <span className="text-lg sm:text-2xl font-bold text-indigo-600 tracking-tight block">
              {occupiedTables}
            </span>
            <span className="text-[10px] text-stone-405 leading-none block pt-0.5 font-mono">
              Active sessions
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-indigo-600">
            <Users className="w-3 h-3 text-indigo-500" />
            <span>SEATED GUESTS</span>
          </div>
        </div>

        {/* Available Tables */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs flex flex-col justify-between min-h-[105px]">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
            Available Tables
          </span>
          <div className="py-2">
            <span className="text-lg sm:text-2xl font-bold text-stone-700 tracking-tight block">
              {availableTables}
            </span>
            <span className="text-[10px] text-stone-405 leading-none block pt-0.5 font-mono">
              Ready to seat
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-stone-500">
            <Grid className="w-3 h-3 text-stone-400" />
            <span>FLOORPLAN</span>
          </div>
        </div>

      </div>

      {/* Quick Launch Actions */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs">
        <h3 className="text-2xs font-mono font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#C67C4E]" />
          Instant Launch Board
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          
          <button 
            onClick={() => onNavigate("pos", { orderType: "takeaway" })}
            className="p-4 bg-[#FAF6F0] hover:bg-[#f5ebd8] border border-stone-150 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="p-2 bg-[#C67C4E]/10 text-[#C67C4E] rounded-xl w-fit group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mt-3 leading-tight">Takeaway Billing</h4>
            <p className="text-[10px] text-stone-500 font-sans mt-0.5 font-light">Rapid Counter Order</p>
          </button>

          <button 
            onClick={() => onNavigate("pos", { orderType: "delivery" })}
            className="p-4 bg-[#FAF6F0] hover:bg-[#f5ebd8] border border-stone-150 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="p-2 bg-[#C67C4E]/10 text-[#C67C4E] rounded-xl w-fit group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mt-3 leading-tight">Delivery Order</h4>
            <p className="text-[10px] text-stone-500 font-sans mt-0.5 font-light">Home Delivery Proxy</p>
          </button>

          <button 
            onClick={() => onNavigate("pos", { orderType: "dine-in" })}
            className="p-4 bg-[#FAF6F0] hover:bg-[#f5ebd8] border border-stone-150 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="p-2 bg-[#C67C4E]/10 text-[#C67C4E] rounded-xl w-fit group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mt-3 leading-tight">Dine-In Billing</h4>
            <p className="text-[10px] text-stone-500 font-sans mt-0.5 font-light">Table Session Order</p>
          </button>

          <button 
            onClick={() => onNavigate("tables")}
            className="p-4 bg-[#FAF6F0] hover:bg-[#f5ebd8] border border-stone-150 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="p-2 bg-[#C67C4E]/10 text-[#C67C4E] rounded-xl w-fit group-hover:scale-105 transition-transform">
              <Grid className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mt-3 leading-tight">Table Floorplan</h4>
            <p className="text-[10px] text-stone-500 font-sans mt-0.5 font-light">Audit Occupancy</p>
          </button>

          <button 
            onClick={() => onNavigate("kot")}
            className="p-4 bg-[#FAF6F0] hover:bg-[#f5ebd8] border border-stone-150 rounded-2xl text-left transition-all group cursor-pointer col-span-2 md:col-span-1"
          >
            <div className="p-2 bg-[#C67C4E]/10 text-[#C67C4E] rounded-xl w-fit group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mt-3 leading-tight">Live KOT Spool</h4>
            <p className="text-[10px] text-stone-500 font-sans mt-0.5 font-light">Manage Live Tickets</p>
          </button>

        </div>
      </div>

      {/* Grid: Live Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active KOT Queue Mini Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
            <h4 className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wider">
              Urgent Kitchen Spoolers
            </h4>
            <button 
              onClick={() => onNavigate("kot")} 
              className="text-[10px] font-mono font-bold text-[#C67C4E] hover:underline flex items-center cursor-pointer"
            >
              <span>Full KOT Monitor</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {orders.filter(o => o.orderStatus === "Preparing" || o.orderStatus === "Accepted").slice(0, 4).map((ord) => (
              <div key={ord.id} className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono font-bold text-stone-400 block uppercase">
                    Order Ref: {ord.id}
                  </span>
                  <span className="text-xs font-bold text-stone-900">
                    {ord.orderType === "dine-in" ? `Dine-In Table #${ord.tableNumber}` : ord.orderType.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    {ord.items.length} dishes · {ord.customerName}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-mono font-extrabold uppercase rounded-md animate-pulse">
                  {ord.orderStatus}
                </span>
              </div>
            ))}
            {orders.filter(o => o.orderStatus === "Preparing" || o.orderStatus === "Accepted").length === 0 && (
              <div className="py-8 text-center text-xs text-stone-400 italic">
                No preparing or pending kitchen spools. All clear!
              </div>
            )}
          </div>
        </div>

        {/* Visual Occupancy Summary */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
            <h4 className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wider">
              Workstation Seating Live Map
            </h4>
            <button 
              onClick={() => onNavigate("tables")} 
              className="text-[10px] font-mono font-bold text-[#C67C4E] hover:underline flex items-center cursor-pointer"
            >
              <span>Visual Floorplan</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {tables.slice(0, 8).map((tbl) => (
              <div 
                key={tbl.id} 
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  tbl.status === "Occupied" 
                    ? "bg-red-50 border-red-200 text-red-700" 
                    : tbl.status === "Reserved"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-green-50 border-green-150 text-green-700"
                }`}
              >
                <span className="text-sm font-extrabold font-mono block">#{tbl.tableNumber}</span>
                <span className="text-[8px] font-mono uppercase font-bold tracking-tight opacity-75">
                  {tbl.status === "Occupied" ? "BUSY" : tbl.status === "Reserved" ? "RES" : "OPEN"}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
