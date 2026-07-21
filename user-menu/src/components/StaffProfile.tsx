import { useState } from "react";
import { 
  User, 
  ShieldCheck, 
  Settings, 
  Clock, 
  Database, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { LocalDB } from "../lib/db";

interface StaffProfileProps {
  currentRole: string;
  onRoleChange: (newRole: string) => void;
  staffName: string;
}

export default function StaffProfile({ currentRole, onRoleChange, staffName }: StaffProfileProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const handleRoleSave = () => {
    onRoleChange(selectedRole);
    LocalDB.addAuditLog("Role Swapped", `Simulated role changed to ${selectedRole}`, selectedRole);
    alert(`🎉 Active simulated role changed to: ${selectedRole}. Permissions have adjusted accordingly.`);
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-stone-200 p-6 sm:p-8 rounded-2xl shadow-2xs text-left font-sans space-y-6">
      
      {/* Header Profile Avatar */}
      <div className="flex items-center gap-4 border-b border-stone-100 pb-5">
        <div className="w-16 h-16 bg-[#C67C4E]/10 border border-[#C67C4E]/20 text-[#C67C4E] rounded-2xl flex items-center justify-center font-serif text-2xl font-black shadow-sm">
          {staffName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wide">{staffName}</h2>
          <span className="text-[10px] bg-stone-100 text-stone-600 font-mono font-bold px-2.5 py-0.5 rounded-md uppercase border border-stone-150">
            Current role: {currentRole}
          </span>
          <p className="text-2xs text-stone-400 mt-1">Authorized login terminal ID: 46B6-WR-POS</p>
        </div>
      </div>

      {/* Role Switcher sandbox to quickly test all user roles */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">Simulate Staff Roles</h3>
          <p className="text-2xs text-stone-500 mt-1">To test permission scopes (e.g. Waiters can't configure settings, only Managers can override check discounts), select a role and apply:</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: "Cashier", icon: "💵", desc: "Checkout, POS checkout, printer logs" },
            { id: "Waiter", icon: "🍽️", desc: "Table visual manager, food cart orders" },
            { id: "Manager", icon: "🔐", desc: "Bypass authorization, discount controls, shifts" },
            { id: "Kitchen Staff", icon: "🍳", desc: "KOT ticket dispatcher, prep logs" }
          ].map(r => (
            <div 
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`border p-3 rounded-xl cursor-pointer transition-all flex flex-col justify-between min-h-[90px] ${
                selectedRole === r.id 
                  ? "border-[#C67C4E] bg-[#C67C4E]/5 text-stone-900" 
                  : "border-stone-150 hover:bg-stone-50/60 text-stone-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold font-sans">{r.icon} {r.id}</span>
                {selectedRole === r.id && <span className="text-[10px] text-[#C67C4E] font-bold">✓ Selected</span>}
              </div>
              <p className="text-[10px] text-stone-500 font-light mt-1.5 leading-tight">{r.desc}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={handleRoleSave}
          className="w-full py-3 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm text-center"
        >
          Confirm Role Swap
        </button>
      </div>

      {/* Terminal health specifications */}
      <div className="bg-stone-50 border border-stone-150 rounded-xl p-4 space-y-2.5">
        <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Active Connection Status</h4>
        <div className="grid grid-cols-2 gap-3 text-2xs font-mono text-stone-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>QZ Tray Silent Link: Connected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>Hardware Buffer: Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>Offline Local Storage DB: Synced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>Audit logs stream: Active</span>
          </div>
        </div>
      </div>

    </div>
  );
}
