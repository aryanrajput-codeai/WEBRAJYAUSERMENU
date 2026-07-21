import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  UserPlus, 
  Phone, 
  Bookmark, 
  User, 
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import { LocalDB, Order } from "../lib/db";

export interface CustItem {
  id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
  totalSpent: number;
  ordersCount: number;
  address?: string;
}

export default function StaffCustomers() {
  const [orders, setOrders] = useState<Order[]>(() => LocalDB.getOrders());
  const [customers, setCustomers] = useState<CustItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Customer Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");

  const [selectedCustHistory, setSelectedCustHistory] = useState<CustItem | null>(null);

  // Sync / Calculate customers on load
  const loadCustomers = () => {
    const allOrders = LocalDB.getOrders();
    setOrders(allOrders);

    // Compute loyalty catalog from orders and manual additions
    const computed: { [phone: string]: CustItem } = {};

    // Get any manual customers saved
    const stored = localStorage.getItem("ij_manual_customers");
    if (stored) {
      const parsed = JSON.parse(stored) as CustItem[];
      parsed.forEach(c => {
        computed[c.phone] = c;
      });
    }

    // Populate from orders
    allOrders.forEach(o => {
      if (!o.phoneNumber || o.phoneNumber === "N/A") return;
      const cleanPhone = o.phoneNumber.trim().replace(/\s+/g, "");
      
      const orderValue = o.paymentStatus === "Paid" ? o.grandTotal : 0;
      const ptEarned = Math.round(orderValue * 0.02); // 2% loyalty points

      if (computed[cleanPhone]) {
        computed[cleanPhone].ordersCount += 1;
        computed[cleanPhone].totalSpent += orderValue;
        computed[cleanPhone].loyaltyPoints += ptEarned;
        if (o.address && !computed[cleanPhone].address) {
          computed[cleanPhone].address = o.address;
        }
      } else {
        computed[cleanPhone] = {
          id: `CUST-${cleanPhone.slice(-4)}`,
          name: o.customerName || "Counter Guest",
          phone: o.phoneNumber,
          loyaltyPoints: ptEarned,
          totalSpent: orderValue,
          ordersCount: 1,
          address: o.address
        };
      }
    });

    setCustomers(Object.values(computed));
  };

  useEffect(() => {
    loadCustomers();
    window.addEventListener("storage", loadCustomers);
    return () => window.removeEventListener("storage", loadCustomers);
  }, []);

  // Filter
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(query) || c.phone.includes(query);
      }
      return true;
    });
  }, [customers, searchQuery]);

  // Form submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      alert("Name and phone number are required!");
      return;
    }

    const cleanPhone = custPhone.trim().replace(/\s+/g, "");
    const exists = customers.some(c => c.phone.replace(/\s+/g, "") === cleanPhone);
    if (exists) {
      alert("A customer profile already exists for phone: " + custPhone);
      return;
    }

    const newCust: CustItem = {
      id: `CUST-${cleanPhone.slice(-4)}`,
      name: custName.trim(),
      phone: custPhone.trim(),
      loyaltyPoints: 50, // 50 sign up loyalty points
      totalSpent: 0,
      ordersCount: 0,
      address: custAddress.trim() || undefined
    };

    const stored = localStorage.getItem("ij_manual_customers");
    const parsed = stored ? JSON.parse(stored) : [];
    localStorage.setItem("ij_manual_customers", JSON.stringify([...parsed, newCust]));

    loadCustomers();
    alert(`🎉 Customer "${newCust.name}" added successfully with 50 SignUp Loyalty Points!`);

    setShowAddModal(false);
    setCustName("");
    setCustPhone("");
    setCustAddress("");
  };

  // Get customer order details
  const customerOrders = useMemo(() => {
    if (!selectedCustHistory) return [];
    const cleanPhone = selectedCustHistory.phone.trim().replace(/\s+/g, "");
    return orders.filter(o => o.phoneNumber && o.phoneNumber.trim().replace(/\s+/g, "") === cleanPhone);
  }, [selectedCustHistory, orders]);

  return (
    <div className="space-y-5 text-left font-sans h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      
      {/* Search & Add customer bar */}
      <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">Customer Directory</h3>
          <p className="text-2xs text-stone-500 mt-0.5">Manage customer loyalty logs and track transaction histories.</p>
        </div>

        <div className="flex gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text"
              placeholder="Search by name / mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 focus:border-[#C67C4E]/60 text-2xs rounded-xl focus:outline-none text-stone-900 font-sans"
            />
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#C67C4E] hover:bg-[#b0673d] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Grid: Customers directory list */}
      <div className="flex-grow overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => (
            <div 
              key={cust.id}
              className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-[#C67C4E] transition-all"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-stone-100 border border-stone-150 rounded-xl flex items-center justify-center text-stone-500 font-extrabold text-xs">
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{cust.name}</h4>
                      <p className="text-[10px] text-stone-450 font-mono mt-0.5">{cust.phone}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 font-bold uppercase">{cust.id}</span>
                </div>

                <hr className="border-stone-100" />

                <div className="grid grid-cols-3 gap-2 text-center bg-stone-50 p-2 rounded-xl border border-stone-150">
                  <div>
                    <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-tight block">Loyalty pts</span>
                    <span className="text-xs font-bold text-[#C67C4E] font-mono">{cust.loyaltyPoints}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-tight block">Total Spent</span>
                    <span className="text-xs font-bold text-stone-900 font-mono">₹{cust.totalSpent}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-tight block">Visits</span>
                    <span className="text-xs font-bold text-stone-900 font-mono">{cust.ordersCount}</span>
                  </div>
                </div>

                {cust.address && (
                  <p className="text-[10px] text-stone-500 font-light italic truncate max-w-full">
                    📍 {cust.address}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100">
                <button 
                  onClick={() => setSelectedCustHistory(cust)}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer flex justify-center items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>View Order History</span>
                </button>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="col-span-3 py-24 text-center">
              <p className="text-xs text-stone-400 italic">No customers found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative text-left">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
            <h3 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#C67C4E]" />
              Add Customer Profile
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Guest Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 py-2.5 px-3 rounded-xl text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Phone Number (10 digits)</label>
                <input 
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="e.g. 9876543210"
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 py-2.5 px-3 rounded-xl text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Default Delivery Address</label>
                <textarea 
                  placeholder="Street address details..."
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs text-stone-900 focus:outline-none h-16 resize-none font-sans"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                Create Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Order History Modal */}
      {selectedCustHistory && (
        <div className="fixed inset-0 bg-stone-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 p-6 rounded-2xl max-w-md w-full shadow-2xl relative text-left max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedCustHistory(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
            
            <div className="border-b border-stone-100 pb-3 mb-4">
              <span className="text-[9px] font-mono text-stone-450 uppercase tracking-widest block">Customer Ledger</span>
              <h3 className="text-sm font-serif font-bold text-stone-900 uppercase">
                {selectedCustHistory.name}
              </h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">{selectedCustHistory.phone}</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">Transaction History ({customerOrders.length} bills)</h4>
              
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {customerOrders.map((ord) => (
                  <div key={ord.id} className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-stone-400 block">{ord.id}</span>
                      <span className="text-[11px] text-stone-500 font-mono block">
                        {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-2xs text-[#C67C4E] mt-0.5">{ord.orderType.toUpperCase()} · {ord.items.length} items</p>
                    </div>
                    <span className="text-xs font-black text-stone-900 font-mono">₹{ord.grandTotal}</span>
                  </div>
                ))}
                {customerOrders.length === 0 && (
                  <p className="text-2xs text-stone-400 italic py-4 text-center">No transactions registered yet for this client.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
