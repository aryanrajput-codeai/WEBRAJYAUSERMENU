import React, { useState, useMemo, useEffect } from "react";
import { 
  Users, 
  HelpCircle, 
  RefreshCw, 
  ArrowLeftRight, 
  Columns, 
  Grid,
  TrendingUp,
  X,
  Grid3X3
} from "lucide-react";
import { LocalDB, Order } from "../lib/db";
import { RestaurantTable } from "../types";

interface StaffTablesProps {
  onSelectTableForBilling: (tableNumber: string) => void;
  staffRole: string;
}

export default function StaffTables({ onSelectTableForBilling, staffRole }: StaffTablesProps) {
  const [tables, setTables] = useState<RestaurantTable[]>(() => LocalDB.getTables());
  const [orders, setOrders] = useState<Order[]>(() => LocalDB.getOrders());

  // Interactive Action modals state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);

  const [sourceTable, setSourceTable] = useState("");
  const [targetTable, setTargetTable] = useState("");

  const [splitItems, setSplitItems] = useState<{ name: string; price: number; quantity: number; splitQty: number }[]>([]);
  const [selectedSplitTable, setSelectedSplitTable] = useState<Order | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setTables(LocalDB.getTables());
      setOrders(LocalDB.getOrders());
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("tables_updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("tables_updated", handleUpdate);
    };
  }, []);

  // Sync back to LocalDB
  const handleSaveTables = (updated: RestaurantTable[]) => {
    setTables(updated);
    LocalDB.saveTables(updated);
  };

  // Click on a table opens its active order or directs to POS billing
  const handleTableClick = (tbl: RestaurantTable) => {
    const activeOrder = orders.find(o => o.tableNumber === tbl.tableNumber && o.paymentStatus === "Pending");
    if (activeOrder) {
      // Load this active order's table to billing
      onSelectTableForBilling(tbl.tableNumber);
    } else {
      // Start a fresh order at this table
      onSelectTableForBilling(tbl.tableNumber);
    }
  };

  // Transfer Table action handler
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTable || !targetTable || sourceTable === targetTable) {
      alert("Please select distinct source and target tables.");
      return;
    }

    const sourceObj = tables.find(t => t.tableNumber === sourceTable);
    const targetObj = tables.find(t => t.tableNumber === targetTable);
    
    if (sourceObj?.status !== "Occupied") {
      alert(`Source Table #${sourceTable} is not occupied!`);
      return;
    }
    if (targetObj?.status === "Occupied") {
      alert(`Target Table #${targetTable} is already occupied!`);
      return;
    }

    // Process orders: redirect linked pending order to target table
    const allOrders = LocalDB.getOrders();
    const idx = allOrders.findIndex(o => o.tableNumber === sourceTable && o.paymentStatus === "Pending");
    if (idx !== -1) {
      allOrders[idx].tableNumber = targetTable;
      allOrders[idx].timeline = allOrders[idx].timeline || [];
      allOrders[idx].timeline.push({
        event: "Table Transferred",
        timestamp: new Date().toISOString(),
        details: `Order transferred from Table #${sourceTable} to #${targetTable} by ${staffRole}`
      });
      LocalDB.saveOrders(allOrders);
    }

    // Process tables
    const updatedTables = tables.map(t => {
      if (t.tableNumber === sourceTable) return { ...t, status: "Available" as const };
      if (t.tableNumber === targetTable) return { ...t, status: "Occupied" as const };
      return t;
    });

    handleSaveTables(updatedTables);
    LocalDB.addAuditLog("Table Transferred", `Shifted guests from table #${sourceTable} to #${targetTable}`, staffRole);
    
    alert(`🚀 Table transferred successfully from #${sourceTable} to #${targetTable}!`);
    setShowTransferModal(false);
    setSourceTable("");
    setTargetTable("");
  };

  // Merge Table action handler
  const handleMergeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTable || !targetTable || sourceTable === targetTable) {
      alert("Please select distinct source and target tables.");
      return;
    }

    const sourceObj = tables.find(t => t.tableNumber === sourceTable);
    const targetObj = tables.find(t => t.tableNumber === targetTable);
    
    if (sourceObj?.status !== "Occupied" || targetObj?.status !== "Occupied") {
      alert("Both tables must be active (Occupied) to combine checks.");
      return;
    }

    // Combine checks: add items from source order to target order
    const allOrders = LocalDB.getOrders();
    const sIdx = allOrders.findIndex(o => o.tableNumber === sourceTable && o.paymentStatus === "Pending");
    const tIdx = allOrders.findIndex(o => o.tableNumber === targetTable && o.paymentStatus === "Pending");

    if (sIdx !== -1 && tIdx !== -1) {
      const sOrder = allOrders[sIdx];
      const tOrder = allOrders[tIdx];

      // Combine items list
      const combinedItems = [...tOrder.items, ...sOrder.items];
      const subtotal = combinedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const gst = Math.round(subtotal * 0.05);
      const grandTotal = subtotal + gst;

      allOrders[tIdx] = {
        ...tOrder,
        items: combinedItems,
        subtotal,
        gst,
        grandTotal,
        timeline: [
          ...(tOrder.timeline || []),
          {
            event: "Tables Merged",
            timestamp: new Date().toISOString(),
            details: `Combined check from Table #${sourceTable} into #${targetTable} by ${staffRole}`
          }
        ]
      };

      // Remove source order
      allOrders.splice(sIdx, 1);
      LocalDB.saveOrders(allOrders);
    }

    // Set source table as empty
    const updatedTables = tables.map(t => {
      if (t.tableNumber === sourceTable) return { ...t, status: "Available" as const };
      return t;
    });

    handleSaveTables(updatedTables);
    LocalDB.addAuditLog("Table Combined", `Merged Table #${sourceTable} check into #${targetTable}`, staffRole);

    alert(`🤝 Tables merged successfully! Table #${sourceTable} check combined into #${targetTable}.`);
    setShowMergeModal(false);
    setSourceTable("");
    setTargetTable("");
  };

  // Open split bill simulation
  const handleSplitClick = (tblNum: string) => {
    const active = orders.find(o => o.tableNumber === tblNum && o.paymentStatus === "Pending");
    if (!active) {
      alert("No active check to split on Table " + tblNum);
      return;
    }
    setSelectedSplitTable(active);
    setSplitItems(active.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, splitQty: 0 })));
    setShowSplitModal(true);
  };

  const handleSplitQtyChange = (idx: number, delta: number) => {
    setSplitItems(prev => prev.map((item, i) => {
      if (i === idx) {
        const nextQty = item.splitQty + delta;
        if (nextQty >= 0 && nextQty <= item.quantity) {
          return { ...item, splitQty: nextQty };
        }
      }
      return item;
    }));
  };

  const handleExecuteSplit = () => {
    if (!selectedSplitTable) return;
    const itemsToSplit = splitItems.filter(i => i.splitQty > 0);
    if (itemsToSplit.length === 0) {
      alert("No items selected to separate.");
      return;
    }

    // Create a new separate order
    const allOrders = LocalDB.getOrders();
    const originalIdx = allOrders.findIndex(o => o.id === selectedSplitTable.id);
    if (originalIdx === -1) return;

    const origOrder = allOrders[originalIdx];

    // Build split items
    const splitItemsPayload = itemsToSplit.map(i => ({
      menuItemId: "split-item",
      name: i.name,
      price: i.price,
      quantity: i.splitQty
    }));

    const splitSubtotal = splitItemsPayload.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const splitGst = Math.round(splitSubtotal * 0.05);

    const splitOrder: Order = {
      id: `SR-SPL-${Date.now().toString().slice(-4)}`,
      customerName: `${origOrder.customerName} (Split)`,
      phoneNumber: origOrder.phoneNumber,
      email: "N/A",
      orderType: "takeaway", // convert split check to takeaway for independent cashiering
      items: splitItemsPayload as any,
      subtotal: splitSubtotal,
      gst: splitGst,
      packagingCharge: 0,
      discountAmount: 0,
      grandTotal: splitSubtotal + splitGst,
      paymentStatus: "Pending",
      orderStatus: "Accepted",
      createdAt: new Date().toISOString(),
      timeline: [{ event: "Split Bill Created", timestamp: new Date().toISOString(), details: `Separated from Table #${origOrder.tableNumber} order.` }]
    };

    // Update original order by reducing split quantities
    const updatedOriginalItems = origOrder.items.map(item => {
      const splitMatch = itemsToSplit.find(i => i.name === item.name);
      if (splitMatch) {
        const remainingQty = item.quantity - splitMatch.splitQty;
        return remainingQty > 0 ? { ...item, quantity: remainingQty } : null;
      }
      return item;
    }).filter(Boolean) as any[];

    if (updatedOriginalItems.length === 0) {
      // Remove original if empty
      allOrders.splice(originalIdx, 1);
      // Set table as empty
      const updatedTables = tables.map(t => {
        if (t.tableNumber === origOrder.tableNumber) return { ...t, status: "Available" as const };
        return t;
      });
      handleSaveTables(updatedTables);
    } else {
      const nextSubtotal = updatedOriginalItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const nextGst = Math.round(nextSubtotal * 0.05);
      allOrders[originalIdx] = {
        ...origOrder,
        items: updatedOriginalItems,
        subtotal: nextSubtotal,
        gst: nextGst,
        grandTotal: nextSubtotal + nextGst
      };
    }

    allOrders.unshift(splitOrder);
    LocalDB.saveOrders(allOrders);

    alert(`✂️ Bill successfully split! Created independent draft ${splitOrder.id} for ₹${splitOrder.grandTotal}`);
    setShowSplitModal(false);
    setSelectedSplitTable(null);
  };

  return (
    <div className="space-y-6 text-left font-sans h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      
      {/* Table management quick triggers */}
      <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
        <div>
          <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">Floor Plan Console</h3>
          <p className="text-2xs text-stone-500 mt-0.5">Click any active table to open ticket or seat fresh guests.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowTransferModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#C67C4E]" />
            <span>Transfer Table</span>
          </button>
          
          <button 
            onClick={() => setShowMergeModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Merge Tables</span>
          </button>
        </div>
      </div>

      {/* Visual Map Layout */}
      <div className="flex-grow overflow-y-auto pr-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((tbl) => {
            const activeOrder = orders.find(o => o.tableNumber === tbl.tableNumber && o.paymentStatus === "Pending");
            return (
              <div 
                key={tbl.id}
                onClick={() => handleTableClick(tbl)}
                className={`border rounded-2xl p-4 transition-all text-left flex flex-col justify-between min-h-[160px] relative cursor-pointer active:scale-95 hover:border-[#C67C4E] ${
                  tbl.status === "Occupied" 
                    ? "bg-red-50/60 border-red-200 text-red-800" 
                    : tbl.status === "Reserved"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-white border-stone-200 text-stone-800 hover:bg-stone-50"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xl font-black font-mono tracking-tight">#{tbl.tableNumber}</span>
                    <span className={`px-2 py-0.5 text-[8px] font-mono font-extrabold uppercase rounded-full ${
                      tbl.status === "Occupied" 
                        ? "bg-red-100 text-red-700" 
                        : tbl.status === "Reserved"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {tbl.status === "Occupied" ? "Busy" : tbl.status === "Reserved" ? "Reserved" : "Open"}
                    </span>
                  </div>

                  <p className="text-[10px] text-stone-450 font-mono tracking-wider font-bold block">{tbl.seatingArea}</p>
                  <p className="text-2xs text-stone-500 font-light mt-0.5">Capacity: {tbl.capacity} Seats</p>
                </div>

                {tbl.status === "Occupied" && activeOrder ? (
                  <div className="mt-4 pt-3 border-t border-stone-200/60 space-y-2">
                    <div className="flex justify-between text-2xs text-stone-600 font-mono">
                      <span>Ref: {activeOrder.id}</span>
                      <span className="font-bold">₹{activeOrder.grandTotal}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSplitClick(tbl.tableNumber);
                        }}
                        className="py-1 px-2 bg-stone-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer text-center"
                      >
                        Split check
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTableForBilling(tbl.tableNumber);
                        }}
                        className="py-1 px-2 bg-[#C67C4E] text-white rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer text-center"
                      >
                        Add dishes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-center text-xs text-stone-400 py-3 italic border-t border-dashed border-stone-200/80">
                    Empty seating session
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transfer Table Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-stone-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowTransferModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
            <h3 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#C67C4E]" />
              Transfer Table Session
            </h3>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Source Table (Occupied)</label>
                <select 
                  required
                  value={sourceTable}
                  onChange={e => setSourceTable(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 py-2.5 px-3 rounded-xl text-xs font-bold text-stone-800"
                >
                  <option value="">-- Select Busy Table --</option>
                  {tables.filter(t => t.status === "Occupied").map(t => (
                    <option key={t.id} value={t.tableNumber}>Table #{t.tableNumber}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Target Table (Available)</label>
                <select 
                  required
                  value={targetTable}
                  onChange={e => setTargetTable(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 py-2.5 px-3 rounded-xl text-xs font-bold text-stone-800"
                >
                  <option value="">-- Select Empty Table --</option>
                  {tables.filter(t => t.status === "Available").map(t => (
                    <option key={t.id} value={t.tableNumber}>Table #{t.tableNumber}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                Transfer Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Merge Tables Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-stone-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowMergeModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
            <h3 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-500" />
              Combine Table checks
            </h3>

            <form onSubmit={handleMergeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Merge source Table (Combines into Target)</label>
                <select 
                  required
                  value={sourceTable}
                  onChange={e => setSourceTable(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 py-2.5 px-3 rounded-xl text-xs font-bold text-stone-800"
                >
                  <option value="">-- Select Busy Table --</option>
                  {tables.filter(t => t.status === "Occupied").map(t => (
                    <option key={t.id} value={t.tableNumber}>Table #{t.tableNumber}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Merge target Table (Holds both checks)</label>
                <select 
                  required
                  value={targetTable}
                  onChange={e => setTargetTable(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 py-2.5 px-3 rounded-xl text-xs font-bold text-stone-800"
                >
                  <option value="">-- Select Target Table --</option>
                  {tables.filter(t => t.status === "Occupied" && t.tableNumber !== sourceTable).map(t => (
                    <option key={t.id} value={t.tableNumber}>Table #{t.tableNumber}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                Merge checks
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      {showSplitModal && selectedSplitTable && (
        <div className="fixed inset-0 bg-stone-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 p-6 rounded-2xl max-w-md w-full shadow-2xl relative text-left">
            <button 
              onClick={() => {
                setShowSplitModal(false);
                setSelectedSplitTable(null);
              }}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
            <h3 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              Split Table #{selectedSplitTable.tableNumber} check
            </h3>
            <p className="text-[10px] text-stone-500 mb-4">Separate selected culinary dishes into an independent takeaway draft for fast payment.</p>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {splitItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-stone-100 pb-2">
                  <div>
                    <p className="text-xs font-bold text-stone-900">{item.name}</p>
                    <p className="text-[10px] text-stone-450">₹{item.price} each (Max qty: {item.quantity})</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleSplitQtyChange(idx, -1)}
                      className="p-1 bg-stone-100 rounded text-stone-600 hover:bg-stone-200"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold px-2">{item.splitQty}</span>
                    <button 
                      onClick={() => handleSplitQtyChange(idx, 1)}
                      className="p-1 bg-stone-100 rounded text-stone-600 hover:bg-stone-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100 flex gap-2">
              <button 
                onClick={handleExecuteSplit}
                className="w-full py-2.5 bg-[#C67C4E] text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer"
              >
                Execute Split
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
