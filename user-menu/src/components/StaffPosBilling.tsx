import React, { useState, useEffect } from "react";
import { LocalDB } from "../lib/db";
import { MenuItem, RestaurantTable } from "../types";
import { Order, Coupon, RestaurantSettings } from "../lib/db";
import PosBillingPortal from "./PosBillingPortal";
import { PhysicalThermalPrinter, getWRPrinterSettings } from "../lib/printerService";

interface StaffPosBillingProps {
  staffRole: string;
  initialOrderType?: "dine-in" | "takeaway" | "delivery";
  onOrderCompleted?: () => void;
}

export default function StaffPosBilling({ staffRole, initialOrderType, onOrderCompleted }: StaffPosBillingProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => LocalDB.getMenuItems());
  const [orders, setOrders] = useState<Order[]>(() => LocalDB.getOrders());
  const [tables, setTables] = useState<RestaurantTable[]>(() => LocalDB.getTables());
  const [settings, setSettings] = useState<RestaurantSettings>(() => LocalDB.getSettings());
  const [coupons, setCoupons] = useState<Coupon[]>(() => LocalDB.getCoupons());

  // Listen to storage events to keep sync with Admin modifications
  useEffect(() => {
    const handleStorageChange = () => {
      setMenuItems(LocalDB.getMenuItems());
      setOrders(LocalDB.getOrders());
      setTables(LocalDB.getTables());
      setSettings(LocalDB.getSettings());
      setCoupons(LocalDB.getCoupons());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleOrderPlaced = () => {
    // Refresh local lists
    setOrders(LocalDB.getOrders());
    setTables(LocalDB.getTables());
    if (onOrderCompleted) {
      onOrderCompleted();
    }
  };

  const handleShowBillPrint = async (order: Order | null) => {
    if (!order) return;
    try {
      const pSettings = getWRPrinterSettings();
      const settingsLocal = LocalDB.getSettings();

      // Look up KOT created for this order
      const kots = LocalDB.getKOTs();
      const matchingKOT = kots.find(k => k.orderId === order.id);
      
      if (matchingKOT) {
        if (pSettings.useQZTray) {
          await PhysicalThermalPrinter.printKOT(matchingKOT, pSettings.paperWidth, "qz");
        } else {
          PhysicalThermalPrinter.printPremiumHTML("kot", matchingKOT, settingsLocal);
        }
      }

      // Print Bill / invoice receipt
      if (pSettings.useQZTray) {
        await PhysicalThermalPrinter.printBill(order, settingsLocal, pSettings.paperWidth, "qz");
      } else {
        PhysicalThermalPrinter.printPremiumHTML("bill", order, settingsLocal, { showHeader: true });
      }

      alert(`📠 Printing Invoice Receipt for Order #${order.id}!`);
    } catch (err: any) {
      console.error("Staff auto-print failed:", err);
    }
  };

  return (
    <div className="w-full h-full" id="staff-pos-billing-wrapper">
      <PosBillingPortal
        menuItems={menuItems}
        orders={orders}
        tables={tables}
        settings={settings}
        coupons={coupons}
        onOrderPlaced={handleOrderPlaced}
        setShowBillPrint={handleShowBillPrint}
        initialOrderType={initialOrderType}
        initialRole={staffRole as any}
      />
    </div>
  );
}
