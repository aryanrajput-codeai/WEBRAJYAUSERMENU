import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Printer, 
  Check, 
  Clock, 
  Flame, 
  Filter, 
  CheckCircle,
  Play
} from "lucide-react";
import { LocalDB } from "../lib/db";
import { KOT, KOTStatus } from "../types";
import { PhysicalThermalPrinter, getWRPrinterSettings } from "../lib/printerService";

interface StaffKOTsProps {
  staffRole: string;
}

export default function StaffKOTs({ staffRole }: StaffKOTsProps) {
  const [kots, setKots] = useState<KOT[]>(() => LocalDB.getKOTs());
  const [activeTab, setActiveTab] = useState<KOTStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleUpdate = () => {
      setKots(LocalDB.getKOTs());
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("menu_updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("menu_updated", handleUpdate);
    };
  }, []);

  // Filter KOTs
  const filteredKOTs = useMemo(() => {
    return kots.filter(k => {
      if (activeTab !== "all" && k.status !== activeTab) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = k.id.toLowerCase().includes(query);
        const matchesName = k.customerName.toLowerCase().includes(query);
        const matchesTable = k.tableNumber && k.tableNumber.includes(query);
        return matchesId || matchesName || matchesTable;
      }
      return true;
    });
  }, [kots, activeTab, searchQuery]);

  // Update KOT Status
  const handleUpdateStatus = async (kotId: string, nextStatus: KOTStatus) => {
    try {
      await LocalDB.apiUpdateKOTStatus(kotId, nextStatus);
      setKots(LocalDB.getKOTs());
      alert(`⚡ KOT ${kotId} status updated to: ${nextStatus}`);
    } catch (err: any) {
      alert("Failed to update status: " + (err.message || err));
    }
  };

  // Reprint KOT Ticket
  const handleReprintKOT = async (kot: KOT) => {
    try {
      const pSettings = getWRPrinterSettings();
      const settings = LocalDB.getSettings();
      if (pSettings.useQZTray) {
        await PhysicalThermalPrinter.printKOT(kot, pSettings.paperWidth, "qz");
        alert("🚀 KOT sent to silent printing spool!");
      } else {
        PhysicalThermalPrinter.printPremiumHTML("kot", kot, settings);
      }
    } catch (err: any) {
      alert("Reprint failed: " + (err.message || err));
    }
  };

  return (
    <div className="space-y-5 text-left font-sans h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      
      {/* Top filter controllers */}
      <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs space-y-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Status Tab selectors */}
          <div className="flex flex-wrap gap-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200 w-full md:w-auto font-sans">
            {[
              { id: "all", label: "All Tickets" },
              { id: "New Order", label: "New KOTs" },
              { id: "Accepted", label: "Accepted" },
              { id: "Preparing", label: "Preparing" },
              { id: "Ready", label: "Ready to Serve" },
              { id: "Served", label: "Dispatched" }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-grow md:flex-grow-0 px-3.5 py-1.5 rounded-lg text-2xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? "bg-white text-stone-900 border border-stone-200 shadow-2xs" 
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick search input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text"
              placeholder="Search by KOT Ref / Table / Guest..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 focus:border-[#C67C4E]/60 text-2xs rounded-xl focus:outline-none text-stone-900 font-sans"
            />
          </div>

        </div>
      </div>

      {/* Grid: KOT list queues */}
      <div className="flex-grow overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKOTs.map((kot) => {
            // Minutes elapsed since creation
            const minutesElapsed = Math.floor((Date.now() - new Date(kot.createdAt).getTime()) / 60000);
            
            return (
              <div 
                key={kot.id}
                className={`bg-white border rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all hover:border-[#C67C4E] relative ${
                  minutesElapsed > 15 && kot.status !== "Served" && kot.status !== "Cancelled"
                    ? "border-red-200 bg-red-50/10"
                    : "border-stone-200"
                }`}
              >
                {/* Elapsed time warning indicator */}
                {kot.status !== "Served" && kot.status !== "Cancelled" && (
                  <span className={`absolute right-4 top-4 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    minutesElapsed > 15 ? "bg-red-100 text-red-700 animate-pulse" : "bg-stone-100 text-stone-600"
                  }`}>
                    ⏱️ {minutesElapsed} mins ago
                  </span>
                )}

                <div className="space-y-3.5">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-stone-400 block uppercase">
                        KOT REF: {kot.id}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 mt-1">
                        {kot.orderType === "dine-in" ? `Table #${kot.tableNumber}` : `${kot.orderType.toUpperCase()}`}
                      </h3>
                      <p className="text-2xs text-stone-450 mt-0.5">Guest: {kot.customerName}</p>
                    </div>
                  </div>

                  <hr className="border-stone-100" />

                  {/* KOT items */}
                  <div className="space-y-2">
                    {kot.items.map((itm, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-stone-700">
                        <span className="font-bold">{itm.quantity}x {itm.name}</span>
                        {itm.customization && (
                          <span className="text-[10px] text-[#C67C4E] italic bg-amber-50/60 px-1.5 py-0.5 rounded ml-2 max-w-[120px] truncate">
                            {itm.customization}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {kot.specialInstructions && kot.specialInstructions !== "None" && (
                    <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-[10px] text-amber-800 leading-tight">
                      <strong>Cooking instruction:</strong> {kot.specialInstructions}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-stone-400 font-mono">
                      Spool: {new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase rounded ${
                      kot.status === "New Order" 
                        ? "bg-red-50 text-red-700 border border-red-100" 
                        : kot.status === "Preparing"
                        ? "bg-blue-50 text-blue-700 border border-blue-100 animate-pulse"
                        : kot.status === "Ready"
                        ? "bg-purple-50 text-purple-700 border border-purple-100"
                        : "bg-green-50 text-green-700 border border-green-150"
                    }`}>
                      {kot.status}
                    </span>
                  </div>

                  {/* Action row */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button 
                      onClick={() => handleReprintKOT(kot)}
                      className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-stone-600 flex justify-center items-center cursor-pointer"
                      title="Reprint Ticket"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Progressive status handlers */}
                    {kot.status === "New Order" ? (
                      <button 
                        onClick={() => handleUpdateStatus(kot.id, "Preparing")}
                        className="col-span-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer flex justify-center items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Accept KOT</span>
                      </button>
                    ) : kot.status === "Preparing" ? (
                      <button 
                        onClick={() => handleUpdateStatus(kot.id, "Ready")}
                        className="col-span-2 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer flex justify-center items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    ) : kot.status === "Ready" ? (
                      <button 
                        onClick={() => handleUpdateStatus(kot.id, "Served")}
                        className="col-span-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer flex justify-center items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Serve KOT</span>
                      </button>
                    ) : (
                      <span className="col-span-2 py-2 bg-stone-100 text-stone-400 rounded-xl text-[10px] font-bold uppercase text-center">Served</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

          {filteredKOTs.length === 0 && (
            <div className="col-span-3 py-24 text-center">
              <p className="text-xs text-stone-400 italic">No kitchen tickets match the selected status filter.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
