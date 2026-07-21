import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Search, 
  Printer, 
  Clock, 
  Info, 
  History, 
  TrendingUp, 
  CheckCircle, 
  ShoppingBag, 
  Filter, 
  Play, 
  Check, 
  AlertCircle,
  Download,
  Calendar,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB, Order } from "../lib/db";
import { PhysicalThermalPrinter, getWRPrinterSettings } from "../lib/printerService";

interface StaffOrdersProps {
  onEditOrder: (order: Order) => void;
  staffRole: string;
}

export default function StaffOrders({ onEditOrder, staffRole }: StaffOrdersProps) {
  // Navigation within StaffOrders: "active" (Order Management) or "history" (Past Order History)
  const [ordersSubTab, setOrdersSubTab] = useState<"active" | "history">("active");
  const [orders, setOrders] = useState<Order[]>(() => LocalDB.getOrders());

  // Active Queue states
  const [activeFilter, setActiveFilter] = useState<"All" | "New Order" | "Accepted" | "Preparing" | "Ready" | "Out For Delivery">("All");
  const [activeSearch, setActiveSearch] = useState("");

  // History states
  const [historyFilterStatus, setHistoryFilterStatus] = useState<"All" | "Delivered" | "Served" | "Cancelled">("All");
  const [historyFilterType, setHistoryFilterType] = useState<"All" | "dine-in" | "takeaway" | "delivery">("All");
  const [historySearch, setHistorySearch] = useState("");

  // Detail Modal view state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Staff Automatic Printing State
  const [staffAutoPrintEnabled, setStaffAutoPrintEnabled] = useState<boolean>(() => {
    return localStorage.getItem("ij_staff_auto_print_enabled") === "true";
  });

  const initialProcessedRef = useRef<boolean>(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  // Sync state with other tabs or windows
  useEffect(() => {
    const handleUpdate = () => {
      setOrders(LocalDB.getOrders());
      setStaffAutoPrintEnabled(localStorage.getItem("ij_staff_auto_print_enabled") === "true");
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("menu_updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("menu_updated", handleUpdate);
    };
  }, []);

  // Automatically track incoming orders and print if enabled
  useEffect(() => {
    if (!initialProcessedRef.current) {
      // First mount: register all existing order IDs as known so we don't print previous history on mount
      orders.forEach(o => knownOrderIdsRef.current.add(o.id));
      initialProcessedRef.current = true;
      return;
    }

    // Identify new orders
    const newOrders = orders.filter(o => !knownOrderIdsRef.current.has(o.id));
    
    // Add all new IDs to known list
    newOrders.forEach(o => {
      knownOrderIdsRef.current.add(o.id);
    });

    // If auto-print is enabled, print the newly received orders
    if (staffAutoPrintEnabled && newOrders.length > 0) {
      newOrders.forEach(newOrder => {
        handlePrintBill(newOrder);
      });
    }
  }, [orders, staffAutoPrintEnabled]);

  // Compute live Order Stats based on all database orders
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));
    const active = orders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Served" && o.orderStatus !== "Cancelled");
    const preparing = orders.filter(o => o.orderStatus === "Preparing");
    const ready = orders.filter(o => o.orderStatus === "Ready");
    const completed = orders.filter(o => o.orderStatus === "Delivered" || o.orderStatus === "Served");

    return {
      todayCount: todayOrders.length,
      activeCount: active.length,
      preparingCount: preparing.length,
      readyCount: ready.length,
      completedCount: completed.length
    };
  }, [orders]);

  // Filtered active orders list (Order Management Queue)
  const filteredActiveOrders = useMemo(() => {
    return orders.filter(o => {
      // Exclude terminal completed states for active list
      if (o.orderStatus === "Delivered" || o.orderStatus === "Served" || o.orderStatus === "Cancelled") {
        return false;
      }
      
      const matchesStatus = activeFilter === "All" || o.orderStatus === activeFilter;
      const term = activeSearch.toLowerCase();
      const matchesSearch = !term || 
        o.customerName.toLowerCase().includes(term) ||
        o.id.toLowerCase().includes(term) ||
        o.phoneNumber.includes(term) ||
        (o.tableNumber && o.tableNumber.includes(term));
      
      return matchesStatus && matchesSearch;
    });
  }, [orders, activeFilter, activeSearch]);

  // Filtered history orders list
  const filteredHistoryOrders = useMemo(() => {
    return orders.filter(o => {
      // History should show terminal statuses, or we can choose to view "All" statuses that are finished/cancelled
      const isTerminal = o.orderStatus === "Delivered" || o.orderStatus === "Served" || o.orderStatus === "Cancelled";
      if (!isTerminal) return false;

      const matchesStatus = historyFilterStatus === "All" || o.orderStatus === historyFilterStatus;
      const matchesType = historyFilterType === "All" || o.orderType === historyFilterType;
      const term = historySearch.toLowerCase();
      const matchesSearch = !term || 
        o.customerName.toLowerCase().includes(term) ||
        o.id.toLowerCase().includes(term) ||
        o.phoneNumber.includes(term) ||
        (o.tableNumber && o.tableNumber.includes(term));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [orders, historyFilterStatus, historyFilterType, historySearch]);

  // Operations Modifiers - Status updates
  const handleUpdateStatus = async (orderId: string, status: Order["orderStatus"]) => {
    try {
      await LocalDB.apiUpdateOrderStatus(orderId, status);
      setOrders(LocalDB.getOrders());
      
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        const fresh = LocalDB.getOrders().find(o => o.id === orderId);
        if (fresh) setSelectedOrderDetails(fresh);
      }
      alert(`🎉 Order ${orderId} status successfully updated to: ${status}`);
    } catch (err: any) {
      alert("Status update failed: " + (err.message || err));
    }
  };

  // Printing utility functions
  const handlePrintBill = async (order: Order) => {
    try {
      const pSettings = getWRPrinterSettings();
      const settings = LocalDB.getSettings();
      if (pSettings.useQZTray) {
        await PhysicalThermalPrinter.printBill(order, settings, pSettings.paperWidth, "qz");
        alert("🚀 Bill sent to silent printer queue!");
      } else {
        PhysicalThermalPrinter.printPremiumHTML("bill", order, settings, { showHeader: true });
      }
    } catch (err: any) {
      alert("Printing failed: " + (err.message || err));
    }
  };

  const handlePrintKOT = async (order: Order) => {
    try {
      const matchingKOTs = LocalDB.getKOTs().filter(k => k.orderId === order.id);
      const settings = LocalDB.getSettings();
      const pSettings = getWRPrinterSettings();

      if (matchingKOTs.length > 0) {
        const latest = matchingKOTs[0];
        if (pSettings.useQZTray) {
          await PhysicalThermalPrinter.printKOT(latest, pSettings.paperWidth, "qz");
          alert("🚀 KOT sent to silent printer queue!");
        } else {
          PhysicalThermalPrinter.printPremiumHTML("kot", latest, settings);
        }
      } else {
        // Construct temporary proxy KOT
        const proxyKOT = {
          id: `KOT-PROXY`,
          orderId: order.id,
          tableNumber: order.tableNumber || "Takeaway",
          customerName: order.customerName,
          orderType: order.orderType,
          status: "Preparing" as any,
          specialInstructions: "None",
          createdAt: order.createdAt,
          preparationTime: 15,
          items: order.items.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            customization: item.customization
          }))
        };
        if (pSettings.useQZTray) {
          await PhysicalThermalPrinter.printKOT(proxyKOT, pSettings.paperWidth, "qz");
          alert("🚀 KOT dispatched silently!");
        } else {
          PhysicalThermalPrinter.printPremiumHTML("kot", proxyKOT, settings);
        }
      }
    } catch (err: any) {
      alert("KOT print failed: " + (err.message || err));
    }
  };

  // Helper to trigger CSV logs download for history
  const handleExportHistoryCSV = () => {
    let csv = "Order ID,Customer Name,Phone,Type,Table,Grand Total,Status,Timestamp\n";
    filteredHistoryOrders.forEach(o => {
      csv += `"${o.id}","${o.customerName}","${o.phoneNumber}","${o.orderType}","${o.tableNumber || ''}",${o.grandTotal},"${o.orderStatus}","${o.createdAt}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ij_staff_order_history_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left font-sans min-h-[calc(100vh-140px)] pb-10">
      
      {/* Header section with toggle between Active Stream and Past History */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-stone-200/80 p-5 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl font-serif font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C67C4E]" />
            Order dispatch workbench
          </h1>
          <p className="text-xs text-stone-500">
            Monitor incoming client orders, track preparation stages, and review finished past transactions.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
          <button
            onClick={() => setOrdersSubTab("active")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              ordersSubTab === "active"
                ? "bg-white text-stone-900 border border-stone-200 shadow-sm"
                : "text-stone-500 hover:text-stone-850"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            Active Queue ({stats.activeCount})
          </button>
          <button
            onClick={() => setOrdersSubTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              ordersSubTab === "history"
                ? "bg-white text-stone-900 border border-stone-200 shadow-sm"
                : "text-stone-500 hover:text-stone-850"
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            Order History
          </button>
        </div>
      </div>

      {/* Live Order Analytics / Counter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">Today's Orders</span>
          <p className="text-2xl font-serif font-black text-stone-950">{stats.todayCount}</p>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">Active Queue</span>
          <p className="text-2xl font-serif font-black text-amber-600">{stats.activeCount}</p>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">In Kitchen</span>
          <p className="text-2xl font-serif font-black text-blue-600">{stats.preparingCount}</p>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">Ready to Serve</span>
          <p className="text-2xl font-serif font-black text-purple-600 animate-pulse">{stats.readyCount}</p>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs space-y-1 col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">Completed</span>
          <p className="text-2xl font-serif font-black text-green-700">{stats.completedCount}</p>
        </div>
      </div>

      {/* SUB TAB: ACTIVE ORDER DISPATCH QUEUE */}
      {ordersSubTab === "active" && (
        <div className="space-y-4">
          
          {/* Automatic Printing Toggle Card */}
          <div className="bg-amber-50/65 border border-amber-100/90 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl">
                <Printer className="w-4 h-4 text-[#C67C4E]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Automatic Thermal Printing</h3>
                <p className="text-[11px] text-stone-600">Automatically trigger physical thermal receipt printing as soon as a new guest order is dispatched.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono font-bold uppercase transition-colors ${staffAutoPrintEnabled ? "text-amber-800" : "text-stone-400"}`}>
                {staffAutoPrintEnabled ? "ENABLED (AUTO)" : "DISABLED (MANUAL)"}
              </span>
              <button
                onClick={() => {
                  const nextVal = !staffAutoPrintEnabled;
                  setStaffAutoPrintEnabled(nextVal);
                  localStorage.setItem("ij_staff_auto_print_enabled", String(nextVal));
                  window.dispatchEvent(new Event("storage"));
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  staffAutoPrintEnabled ? "bg-[#C67C4E]" : "bg-stone-300"
                }`}
                role="switch"
                aria-checked={staffAutoPrintEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    staffAutoPrintEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          
          {/* Active filter toolbar */}
          <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              
              {/* Filter statuses buttons */}
              <div className="flex flex-wrap gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 w-full md:w-auto">
                {(["All", "New Order", "Accepted", "Preparing", "Ready", "Out For Delivery"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeFilter === f
                        ? "bg-white text-stone-900 border border-stone-200 shadow-2xs"
                        : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    {f === "All" ? "All Active" : f}
                  </button>
                ))}
              </div>

              {/* Active list Quick Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter by ID, Customer Name, Phone..."
                  value={activeSearch}
                  onChange={e => setActiveSearch(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 pl-10 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E]/60 text-stone-900 placeholder-stone-400"
                />
              </div>

            </div>
          </div>

          {/* Ledger Table Layout for robust, official desk operations */}
          <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-left text-[10px]">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Client Contact Details</th>
                    <th className="p-4">Order Mode</th>
                    <th className="p-4">Billing Grand Sum</th>
                    <th className="p-4">Delivery Status Checks</th>
                    <th className="p-4 text-right">Dispatch Flow Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredActiveOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-stone-400 font-light text-xs italic">
                        No active dispatch tickets currently match selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredActiveOrders.map(o => (
                      <tr key={o.id} className="hover:bg-stone-50/30 transition-all">
                        <td className="p-4 font-bold text-stone-900 font-mono text-xs">{o.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-stone-900 text-sm">{o.customerName}</div>
                          <div className="text-stone-400 text-2xs font-mono mt-0.5">{o.phoneNumber}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            o.orderType === "dine-in" ? "bg-teal-50 text-teal-700 border-teal-100" :
                            o.orderType === "takeaway" ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-blue-50 text-blue-700 border-blue-100"
                          }`}>
                            {o.orderType} {o.tableNumber ? `(T-${o.tableNumber})` : ""}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[#C67C4E] text-xs">₹{o.grandTotal}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            o.orderStatus === "New Order" ? "bg-red-50 text-red-700 border-red-100" :
                            o.orderStatus === "Accepted" ? "bg-orange-50 text-orange-700 border-orange-100" :
                            o.orderStatus === "Preparing" ? "bg-blue-50 text-blue-600 border-blue-100" :
                            o.orderStatus === "Ready" ? "bg-purple-50 text-purple-700 border-purple-100" :
                            o.orderStatus === "Out For Delivery" ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-stone-50 text-stone-600 border-stone-200"
                          }`}>
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-600 transition-colors"
                            title="Inspect details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintBill(o)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg text-blue-600 transition-colors"
                            title="Print invoice bill"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Interactive status stepping buttons */}
                          {o.orderStatus === "New Order" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(o.id, "Accepted")}
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-[10px]"
                                title="Accept Ticket"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(o.id, "Cancelled")}
                                className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded font-bold text-[10px]"
                                title="Reject Ticket"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {o.orderStatus === "Accepted" && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, "Preparing")}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase text-[9px] flex items-center gap-1"
                            >
                              <Play className="w-2.5 h-2.5 fill-white" />
                              Prep
                            </button>
                          )}

                          {o.orderStatus === "Preparing" && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, "Ready")}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold uppercase text-[9px] flex items-center gap-1"
                            >
                              <Check className="w-2.5 h-2.5" />
                              Ready
                            </button>
                          )}

                          {o.orderStatus === "Ready" && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, o.orderType === "dine-in" ? "Served" : "Delivered")}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold uppercase text-[9px]"
                            >
                              {o.orderType === "dine-in" ? "Serve" : "Deliver"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB TAB: COMPLETED PAST ORDER HISTORY */}
      {ordersSubTab === "history" && (
        <div className="space-y-4">
          
          {/* History filter and actions toolbar */}
          <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Search query */}
              <div className="relative group md:col-span-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#C67C4E] transition-colors" />
                <input
                  type="text"
                  placeholder="Query past invoices by ID, Phone, Customer..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 pl-11 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#C67C4E] text-stone-900 placeholder-stone-400 font-sans"
                />
              </div>

              {/* Status Selector */}
              <div className="relative">
                <select
                  value={historyFilterStatus}
                  onChange={e => setHistoryFilterStatus(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#C67C4E]"
                >
                  <option value="All">All Past Statuses</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Served">Served</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Order Type Selector */}
              <div className="relative">
                <select
                  value={historyFilterType}
                  onChange={e => setHistoryFilterType(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#C67C4E]"
                >
                  <option value="All">All Types</option>
                  <option value="dine-in">Dine-In Only</option>
                  <option value="takeaway">Takeaway Only</option>
                  <option value="delivery">Delivery Only</option>
                </select>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-stone-100 pt-4 gap-4">
              <span className="text-2xs font-bold text-stone-400 font-mono">
                DISPLAYING {filteredHistoryOrders.length} CLOSED HISTORIC RECORDS
              </span>

              <button
                onClick={handleExportHistoryCSV}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-2xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm border border-stone-950"
              >
                <Download className="w-3.5 h-3.5 text-[#C67C4E]" />
                Export CSV Ledger
              </button>
            </div>
          </div>

          {/* Past History Table */}
          <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-left text-[10px]">
                    <th className="p-4">Invoice ID</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Timestamp Log</th>
                    <th className="p-4">Past Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredHistoryOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-stone-400 font-light text-xs italic">
                        No historical archives found matching selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryOrders.map(o => (
                      <tr key={o.id} className="hover:bg-stone-50/20 transition-all">
                        <td className="p-4 font-bold text-stone-500 font-mono text-2xs">{o.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-stone-900 text-xs">{o.customerName}</div>
                          <div className="text-stone-400 text-[10px] font-mono">{o.phoneNumber}</div>
                        </td>
                        <td className="p-4 uppercase text-[10px] font-semibold">{o.orderType}</td>
                        <td className="p-4 text-[#C67C4E] font-extrabold text-xs">₹{o.grandTotal}</td>
                        <td className="p-4 text-stone-450 text-[11px] font-mono">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            o.orderStatus === "Cancelled" 
                              ? "bg-red-50 text-red-700 border border-red-100" 
                              : "bg-green-50 text-green-700 border border-green-100"
                          }`}>
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-600 transition-colors"
                            title="Inspect Historic Invoice"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintBill(o)}
                            className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-600 transition-colors"
                            title="Print Duplicate Invoice Copy"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* DETAIL MODAL: ORDER FULL VIEWER */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.5 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedOrderDetails(null)} 
              className="fixed inset-0 bg-[#0c0a09]/40 z-50 backdrop-blur-xs" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="fixed inset-4 max-w-lg mx-auto my-auto h-fit bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 z-55 shadow-2xl overflow-y-auto max-h-[85vh] text-left"
            >
              <div className="flex justify-between items-start border-b border-stone-200 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wider">Inspect Invoice Details</h3>
                  <p className="text-[10px] font-mono text-[#C67C4E] mt-0.5 font-bold">Order ID: {selectedOrderDetails.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrderDetails(null)} 
                  className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 font-sans text-xs">
                
                {/* Customer specs */}
                <div className="bg-[#FAF6F0] p-4 rounded-xl border border-stone-200/80 space-y-1 text-stone-600">
                  <p className="text-stone-900 font-bold text-sm mb-1.5">{selectedOrderDetails.customerName}</p>
                  <p className="text-[11px]">CONTACT: <span className="text-stone-850 font-bold font-mono">{selectedOrderDetails.phoneNumber}</span></p>
                  <p className="text-[11px]">EMAIL: <span className="text-stone-850 font-mono lowercase">{selectedOrderDetails.email}</span></p>
                  <p className="text-[11px]">ORDER TYPE: <span className="text-stone-850 font-bold uppercase">{selectedOrderDetails.orderType}</span></p>
                  {selectedOrderDetails.tableNumber && <p className="text-[11px]">TABLE ALLOCATION: <span className="text-[#C67C4E] font-bold">Table #{selectedOrderDetails.tableNumber}</span></p>}
                  {selectedOrderDetails.address && <p className="text-[11px]">SHIPPING TARGET: <span className="text-stone-800 font-medium">{selectedOrderDetails.address}</span></p>}
                </div>

                {/* Items ledger */}
                <div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-2 font-mono">CULINARY ITEMS ORDERED</p>
                  <div className="space-y-2">
                    {selectedOrderDetails.items.map((itm, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-stone-200 flex justify-between items-center shadow-2xs">
                        <div>
                          <div className="text-stone-900 font-bold">{itm.name} <span className="text-[#C67C4E] font-bold">x{itm.quantity}</span></div>
                          {itm.customization && <div className="text-[10px] text-stone-400 mt-0.5 italic font-sans font-medium">Notes: {itm.customization}</div>}
                        </div>
                        <span className="text-stone-700 font-bold font-mono">₹{itm.price * itm.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-[#FAF6F0] p-4 rounded-xl border border-stone-200/80 space-y-1.5 text-stone-600 font-sans">
                  <div className="flex justify-between text-xs">
                    <span>Subtotal Basket</span>
                    <span className="font-semibold text-stone-850 font-mono">₹{selectedOrderDetails.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>CGST (2.5%)</span>
                    <span className="font-semibold text-stone-850 font-mono">₹{(selectedOrderDetails.gst / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>SGST (2.5%)</span>
                    <span className="font-semibold text-stone-850 font-mono">₹{(selectedOrderDetails.gst / 2).toFixed(2)}</span>
                  </div>
                  {selectedOrderDetails.packagingCharge > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>Packaging Surcharge</span>
                      <span className="font-semibold text-stone-850 font-mono">₹{selectedOrderDetails.packagingCharge}</span>
                    </div>
                  )}
                  {selectedOrderDetails.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-green-700">
                      <span>Coupon Discount ({selectedOrderDetails.appliedCoupon})</span>
                      <span className="font-bold font-mono">-₹{selectedOrderDetails.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-stone-200 pt-2 font-bold text-stone-950 text-sm">
                    <span className="text-[#C67C4E]">GRAND DISPATCH TOTAL</span>
                    <span className="text-[#C67C4E] font-mono">₹{selectedOrderDetails.grandTotal}</span>
                  </div>
                </div>

              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => {
                    handlePrintBill(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  className="px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold font-sans rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-[#C67C4E]" />
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    handlePrintKOT(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  className="px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold font-sans rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  Print KOT
                </button>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 bg-[#C67C4E] hover:bg-[#aa7c11] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Close panel
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
