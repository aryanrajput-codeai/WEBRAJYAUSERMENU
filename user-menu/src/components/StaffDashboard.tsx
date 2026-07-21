import { useState, useEffect } from "react";
import { 
  Grid, 
  ShoppingBag, 
  Clock, 
  UtensilsCrossed, 
  Printer, 
  Users, 
  BookOpen, 
  Lock, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB } from "../lib/db";
import { MenuItem } from "../types";

// Import modular sub-sections
import StaffDashboardHome from "./StaffDashboardHome";
import StaffPosBilling from "./StaffPosBilling";
import StaffOrders from "./StaffOrders";
import StaffTables from "./StaffTables";
import StaffKOTs from "./StaffKOTs";
import StaffCustomers from "./StaffCustomers";
import StaffTodayOrders from "./StaffTodayOrders";
import StaffShiftManagement from "./StaffShiftManagement";
import StaffProfile from "./StaffProfile";

interface StaffDashboardProps {
  onLogout: () => void;
}

export default function StaffDashboard({ onLogout }: StaffDashboardProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem("ij_staff_active_tab") || "dashboard";
  });
  
  // Save tab state
  useEffect(() => {
    localStorage.setItem("ij_staff_active_tab", activeTab);
  }, [activeTab]);

  // Sidebar collapse
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Role info loaded from login
  const [staffRole, setStaffRole] = useState<string>(() => {
    return localStorage.getItem("ij_staff_role") || "Cashier";
  });

  const [staffName, setStaffName] = useState<string>(() => {
    return localStorage.getItem("ij_staff_name") || "Rajesh Kumar";
  });

  // POS Billing order type state
  const [billingOrderType, setBillingOrderType] = useState<"dine-in" | "takeaway" | "delivery">("takeaway");

  // Dynamic Navigation trigger (for Home quick action links)
  const handleNavigateFromHome = (tab: string, params?: any) => {
    if (params && params.orderType) {
      setBillingOrderType(params.orderType);
    }
    setActiveTab(tab);
  };

  const handleSelectTableFromFloorplan = (tableNum: string) => {
    setBillingOrderType("dine-in");
    setActiveTab("pos");
    // Delay slightly or use state callback to let POS component select seat
    setTimeout(() => {
      const selectEl = document.querySelector("select") as HTMLSelectElement;
      if (selectEl) {
        selectEl.value = tableNum;
        const evt = new Event("change", { bubbles: true });
        selectEl.dispatchEvent(evt);
      }
    }, 100);
  };

  // Nav configuration
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Grid, component: <StaffDashboardHome onNavigate={handleNavigateFromHome} staffRole={staffRole} /> },
    { id: "pos", label: "POS Billing", icon: ShoppingBag, component: <StaffPosBilling staffRole={staffRole} initialOrderType={billingOrderType} onOrderCompleted={() => setActiveTab("orders")} /> },
    { id: "orders", label: "Orders Stream", icon: Clock, component: <StaffOrders staffRole={staffRole} onEditOrder={() => {}} /> },
    { id: "tables", label: "Table Map", icon: UtensilsCrossed, component: <StaffTables staffRole={staffRole} onSelectTableForBilling={handleSelectTableFromFloorplan} /> },
    { id: "kot", label: "Live KOTs", icon: Printer, component: <StaffKOTs staffRole={staffRole} /> },
    { id: "customers", label: "Customers", icon: Users, component: <StaffCustomers /> },
    { id: "today", label: "Today's Bills", icon: BookOpen, component: <StaffTodayOrders /> },
    { id: "shift", label: "Cash Register", icon: Lock, component: <StaffShiftManagement staffRole={staffRole} /> },
    { id: "profile", label: "My Profile", icon: User, component: <StaffProfile staffName={staffName} currentRole={staffRole} onRoleChange={(role) => {
      setStaffRole(role);
      localStorage.setItem("ij_staff_role", role);
    }} /> }
  ];

  const currentTabObj = menuItems.find(item => item.id === activeTab) || menuItems[0];

  return (
    <div className="bg-[#FAF9F5] min-h-screen text-stone-800 flex flex-col font-sans select-none antialiased h-screen overflow-hidden">
      
      {/* 1. Ornate Header Banner */}
      <header className="bg-stone-900 text-white px-4 py-3 flex justify-between items-center border-b border-stone-850/10 z-40 relative flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-stone-800 rounded-xl lg:hidden text-stone-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-serif font-black tracking-widest text-[#C67C4E]">
              WEBRAJYA POS
            </span>
            <span className="text-[9px] text-[#C67C4E] font-mono border border-[#C67C4E]/20 px-1.5 py-0.5 rounded-md bg-[#C67C4E]/5 uppercase">
              Staff Console
            </span>
          </div>
        </div>

        {/* User Info & Fast logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-bold">{staffName}</span>
            <span className="text-[10px] text-stone-400 font-mono">{staffRole} Workstation</span>
          </div>
          
          <button 
            onClick={onLogout}
            className="p-2 bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
            title="Log out of Terminal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main layout container */}
      <div className="flex flex-grow h-[calc(100vh-50px)] overflow-hidden relative">
        
        {/* 2. Responsive Sidebar (Desktop) */}
        <aside 
          className={`hidden lg:flex flex-col justify-between border-r border-stone-200 bg-white h-full transition-all relative z-20 ${
            isSidebarCollapsed ? "w-20" : "w-60"
          }`}
        >
          {/* Collapse handler hook */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute right-0 top-6 translate-x-1/2 w-6 h-6 bg-white border border-stone-250 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 shadow-xs cursor-pointer z-30"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          <div className="py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 py-3.5 transition-all text-left cursor-pointer border-l-4 ${
                    isActive 
                      ? "bg-[#C67C4E]/5 border-[#C67C4E] text-[#C67C4E] font-extrabold" 
                      : "border-transparent text-stone-600 hover:bg-stone-50/60 hover:text-stone-900"
                  } ${isSidebarCollapsed ? "px-0 justify-center" : "px-5"}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#C67C4E]" : "text-stone-500"}`} />
                  {!isSidebarCollapsed && <span className="text-xs uppercase tracking-wider">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Bottom quick meta */}
          {!isSidebarCollapsed && (
            <div className="p-4 border-t border-stone-100 font-mono text-[9px] text-stone-400 space-y-0.5">
              <p>Device Status: Online</p>
              <p>Printer Driver: Spooled</p>
            </div>
          )}
        </aside>

        {/* Mobile Navigation Drawer Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-stone-950 z-30 lg:hidden"
              />
              
              {/* Drawer Content */}
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed inset-y-0 left-0 bg-white border-r border-stone-200 w-64 z-40 lg:hidden p-5 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-[#C67C4E]">WORKSTATION SECTIONS</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-stone-400 text-sm">✕</button>
                  </div>

                  <div className="space-y-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                            isActive 
                              ? "bg-[#C67C4E]/10 text-[#C67C4E] font-extrabold" 
                              : "text-stone-600 hover:bg-stone-50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-wider">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center font-extrabold text-xs text-stone-500">
                    {staffName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-2xs font-bold text-stone-900">{staffName}</h5>
                    <p className="text-[10px] text-stone-400 font-mono uppercase">{staffRole}</p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 3. Main Workspace Content viewport */}
        <main className="flex-grow p-4 sm:p-6 overflow-y-auto h-full relative" id="staff-workspace-container">
          <div className="max-w-7xl mx-auto h-full">
            {currentTabObj.component}
          </div>
        </main>

      </div>

    </div>
  );
}
