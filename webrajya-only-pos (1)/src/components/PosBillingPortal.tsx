import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, Search, Calculator, Shield, ShieldAlert, KeyRound, 
  Trash2, Edit3, ClipboardList, CheckCircle, FileText, ShoppingCart, 
  Percent, ArrowRight, User, Phone, MapPin, Sparkles, Hash, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB, Order, Coupon, InventoryItem, AuditLog, RestaurantSettings, supabase } from "../lib/db";
import { MenuItem, RestaurantTable, Category } from "../types";

interface PosBillingPortalProps {
  menuItems: MenuItem[];
  orders: Order[];
  tables: RestaurantTable[];
  settings: RestaurantSettings;
  coupons: Coupon[];
  onOrderPlaced: () => void;
  setShowBillPrint: (order: Order | null) => void;
  initialOrderType?: "dine-in" | "takeaway" | "delivery";
  initialRole?: "Owner" | "Manager" | "Cashier";
}

interface CartItem {
  id: string; // "item-" + id or "manual-" + timestamp
  name: string;
  price: number;
  quantity: number;
  customization?: string;
  isManual: boolean;
  category?: string;
  gstRate: number; // e.g. 5, 12, 18, 28
  discount: number; // item-level discount percentage (0 to 100)
  hsnCode?: string;
}

export default function PosBillingPortal({
  menuItems,
  orders,
  tables,
  settings,
  coupons,
  onOrderPlaced,
  setShowBillPrint,
  initialOrderType,
  initialRole
}: PosBillingPortalProps) {
  // POS Tabs: "register" (Active POS Cart) or "reports" (Performance Analytics Ledger)
  const [posTab, setPosTab] = useState<"register" | "reports">("register");

  // Role State (Sandbox simulation of security roles)
  const [currentRole, setCurrentRole] = useState<"Owner" | "Manager" | "Cashier">(() => {
    return (initialRole as any) || "Owner";
  });

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  
  // Order Configuration State
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">(() => {
    return initialOrderType || "takeaway";
  });

  useEffect(() => {
    if (initialOrderType) {
      setOrderType(initialOrderType);
    }
  }, [initialOrderType]);

  useEffect(() => {
    if (initialRole) {
      setCurrentRole(initialRole as any);
    }
  }, [initialRole]);
  const [selectedTable, setSelectedTable] = useState("");
  const [posPaymentStatus, setPosPaymentStatus] = useState<"Paid" | "Pending">("Paid");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("Cash");
  const [splitAmounts, setSplitAmounts] = useState<{ [key: string]: number }>({
    Cash: 0,
    UPI: 0,
    Card: 0,
    Other: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const activeOrderForSelectedTable = useMemo(() => {
    if (orderType !== "dine-in" || !selectedTable) return null;
    return orders.find(o => 
      o.orderType === "dine-in" && 
      o.tableNumber === selectedTable && 
      o.paymentStatus !== "Paid" && 
      o.orderStatus !== "Cancelled"
    );
  }, [orderType, selectedTable, orders]);

  // Search & Filters for Regular Items Catalog
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Modals Toggles
  const [showManualModal, setShowManualModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Manual Item Form States
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("General");
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualPrice, setManualPrice] = useState("");
  const [manualGstRate, setManualGstRate] = useState(5);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [manualHsnCode, setManualHsnCode] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualFormErrors, setManualFormErrors] = useState<string[]>([]);

  // Manager Override security workflow context
  const [overrideContext, setOverrideContext] = useState<{
    actionType: "edit_price" | "edit_discount" | "delete" | "add_manual" | "apply_global_discount";
    itemId?: string;
    newValue?: any;
    fallbackFn?: () => void;
  } | null>(null);
  const [overridePasscode, setOverridePasscode] = useState("");
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Item inline editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState("");
  const [editDiscountVal, setEditDiscountVal] = useState("");

  // Filter menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCategory && item.available !== false;
    });
  }, [menuItems, searchQuery, activeCategory]);

  // Categories list derived from menu
  const categories = useMemo(() => {
    const list = new Set(menuItems.map(i => i.category));
    return ["All", ...Array.from(list)];
  }, [menuItems]);

  // Math Calculations for current Register Cart
  const cartTotals = useMemo(() => {
    let rawSubtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    cart.forEach(item => {
      const itemBase = item.price * item.quantity;
      const itemDiscountAmount = itemBase * (item.discount / 100);
      const itemDiscountedBase = itemBase - itemDiscountAmount;
      const itemGst = itemDiscountedBase * (item.gstRate / 100);

      rawSubtotal += itemBase;
      totalDiscount += itemDiscountAmount;
      totalGst += itemGst;
    });

    // Global coupon discount
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
      const currentSubtotal = rawSubtotal - totalDiscount;
      if (appliedCoupon.type === "percentage") {
        couponDiscountAmount = Math.round(currentSubtotal * (appliedCoupon.value / 100));
      } else {
        couponDiscountAmount = Math.min(appliedCoupon.value, currentSubtotal);
      }
    }

    const packagingCharge = orderType === "dine-in" ? 0 : 25;
    const finalSubtotal = rawSubtotal - totalDiscount;
    const finalGrandTotal = Math.max(0, Math.round(finalSubtotal + totalGst + packagingCharge - couponDiscountAmount));

    return {
      subtotal: rawSubtotal,
      itemDiscounts: totalDiscount,
      couponDiscount: couponDiscountAmount,
      gst: Math.round(totalGst),
      packaging: packagingCharge,
      grandTotal: finalGrandTotal
    };
  }, [cart, appliedCoupon, orderType]);

  // Handle adding regular menu items to cart
  const handleAddRegularToCart = (item: MenuItem) => {
    // Check if item already exists in cart
    const existing = cart.find(c => c.id === `reg-${item.id}`);
    if (existing) {
      setCart(prev => prev.map(c => c.id === `reg-${item.id}` ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      const newItem: CartItem = {
        id: `reg-${item.id}`,
        name: item.name,
        price: item.price,
        quantity: 1,
        isManual: false,
        category: item.category,
        gstRate: item.gstPercent || settings.gstPercentage || 5,
        discount: 0,
        hsnCode: item.hsnCode || "2106"
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  // Validate and submit manual billing item
  const handleAddManualItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!manualName.trim()) {
      errors.push("Culinary Item Name is strictly required.");
    }
    const parsedPrice = parseFloat(manualPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      errors.push("Unit Price must be a valid number greater than zero.");
    }
    if (manualQuantity < 1) {
      errors.push("Quantity must be at least 1.");
    }
    if (manualDiscount < 0 || manualDiscount > 100) {
      errors.push("Discount percentage must be between 0% and 100%.");
    }

    if (errors.length > 0) {
      setManualFormErrors(errors);
      return;
    }

    const performAdd = () => {
      const newItem: CartItem = {
        id: `manual-${Date.now()}`,
        name: manualName.trim(),
        price: parsedPrice,
        quantity: manualQuantity,
        isManual: true,
        category: manualCategory,
        gstRate: manualGstRate,
        discount: manualDiscount,
        hsnCode: manualHsnCode.trim() || "9963", // standard F&B service code
        customization: manualNotes.trim() || undefined
      };

      setCart(prev => [...prev, newItem]);
      LocalDB.addAuditLog(
        "Manual Item Added to POS Cart", 
        `Added manual item: "${manualName}" @ ₹${parsedPrice} x${manualQuantity} (GST: ${manualGstRate}%, Disc: ${manualDiscount}%)`, 
        `POS (${currentRole})`
      );

      // Close modal and reset
      setShowManualModal(false);
      setManualName("");
      setManualQuantity(1);
      setManualPrice("");
      setManualGstRate(5);
      setManualDiscount(0);
      setManualHsnCode("");
      setManualNotes("");
      setManualFormErrors([]);
    };

    // Check permissions
    if (currentRole === "Cashier") {
      setOverrideContext({
        actionType: "add_manual",
        fallbackFn: performAdd
      });
      setOverrideError(null);
      setOverridePasscode("");
      setShowOverrideModal(true);
    } else {
      performAdd();
    }
  };

  // Handle quantity adjustment
  const handleAdjustQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Action verification helper
  const executeWithPermission = (
    actionType: "edit_price" | "edit_discount" | "delete",
    itemId: string,
    successCallback: () => void
  ) => {
    if (currentRole === "Cashier") {
      setOverrideContext({
        actionType,
        itemId,
        fallbackFn: successCallback
      });
      setOverrideError(null);
      setOverridePasscode("");
      setShowOverrideModal(true);
    } else {
      successCallback();
    }
  };

  // Handle manual/normal item price modifier
  const handleUpdatePrice = (id: string, newPriceStr: string) => {
    const val = parseFloat(newPriceStr);
    if (isNaN(val) || val <= 0) return;

    const targetItem = cart.find(c => c.id === id);
    if (!targetItem) return;

    executeWithPermission("edit_price", id, () => {
      setCart(prev => prev.map(item => item.id === id ? { ...item, price: val } : item));
      LocalDB.addAuditLog(
        "POS Price Override",
        `Overrode unit price for "${targetItem.name}" from ₹${targetItem.price} to ₹${val}`,
        `POS (${currentRole})`
      );
      setEditingItemId(null);
    });
  };

  // Handle discount override
  const handleUpdateDiscount = (id: string, newDiscStr: string) => {
    const val = parseInt(newDiscStr, 10);
    if (isNaN(val) || val < 0 || val > 100) return;

    const targetItem = cart.find(c => c.id === id);
    if (!targetItem) return;

    executeWithPermission("edit_discount", id, () => {
      setCart(prev => prev.map(item => item.id === id ? { ...item, discount: val } : item));
      LocalDB.addAuditLog(
        "POS Item Discount Overridden",
        `Overrode item-level discount for "${targetItem.name}" to ${val}%`,
        `POS (${currentRole})`
      );
      setEditingItemId(null);
    });
  };

  // Handle manual / regular item removal
  const handleRemoveFromCart = (id: string) => {
    const targetItem = cart.find(c => c.id === id);
    if (!targetItem) return;

    executeWithPermission("delete", id, () => {
      setCart(prev => prev.filter(item => item.id !== id));
      LocalDB.addAuditLog(
        "POS Cart Item Deleted",
        `Removed item "${targetItem.name}" from billing cart`,
        `POS (${currentRole})`
      );
    });
  };

  // Verify and apply global promo coupons
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    
    if (!couponCode.trim()) return;

    const code = couponCode.trim().toUpperCase();
    const matched = coupons.find(c => c.code === code);

    if (!matched) {
      setCouponError("Invalid coupon promotional key.");
      return;
    }

    // Expiry check
    if (new Date(matched.expiryDate) < new Date()) {
      setCouponError("This promotion campaign has expired.");
      return;
    }

    const netItemTotal = cartTotals.subtotal - cartTotals.itemDiscounts;
    if (matched.minOrderAmount && netItemTotal < matched.minOrderAmount) {
      setCouponError(`Minimum purchase threshold of ₹${matched.minOrderAmount} not satisfied.`);
      return;
    }

    setAppliedCoupon(matched);
    setCouponCode("");
    LocalDB.addAuditLog(
      "POS Coupon Applied", 
      `Applied promotion code: ${code} (Discount: ${matched.value}${matched.type === "percentage" ? "%" : " Fixed"})`,
      `POS (${currentRole})`
    );
  };

  // Process manager passcode verification
  const handleVerifyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideError(null);

    // Default authorized manager passcode in system: admin123 / password123
    const isSuccess = overridePasscode === "admin123" || overridePasscode === "password123";

    if (isSuccess) {
      LocalDB.addAuditLog(
        "Manager Override Authorized", 
        `Security override granted for role 'Cashier'. Action: ${overrideContext?.actionType.toUpperCase()}`,
        "System Authority"
      );
      
      if (overrideContext?.fallbackFn) {
        overrideContext.fallbackFn();
      }

      setShowOverrideModal(false);
      setOverrideContext(null);
      setOverridePasscode("");
    } else {
      setOverrideError("Invalid manager administrative passcode.");
      LocalDB.addAuditLog(
        "Override Denied", 
        `Unauthorized passcode input attempt for role override: "${overridePasscode}"`,
        "System Authority"
      );
    }
  };

  // Process and save finalized invoice
  const handleFinalizeCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;

    // Dine-in table check
    if (orderType === "dine-in" && !selectedTable) {
      alert("Table allocation must be assigned for Dine-In billing.");
      return;
    }

    // Customer detail validations for delivery
    if (orderType === "delivery" && (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim())) {
      alert("Delivery orders strictly require Customer Name, Contact Phone, and Address.");
      return;
    }

    // Validate payment mode selection
    if (!selectedPaymentMode) {
      alert("Please select a payment mode before finalizing the checkout.");
      return;
    }

    if (selectedPaymentMode === "Split Payment") {
      const splitTotal = (Object.values(splitAmounts) as number[]).reduce((a, b) => a + b, 0);
      if (Math.abs(splitTotal - cartTotals.grandTotal) > 0.01) {
        alert(`Split Payment Error: Please allocate the exact grand total of ₹${cartTotals.grandTotal.toFixed(2)}. Currently allocated: ₹${splitTotal.toFixed(2)}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Determine payment mode string
      let finalPaymentMode = selectedPaymentMode;
      if (selectedPaymentMode === "Split Payment") {
        finalPaymentMode = LocalDB.formatPaymentDetails(splitAmounts);
      }

      // Determine payment status (Credit is Pending, others are Paid)
      let finalPaymentStatus: Order["paymentStatus"] = "Paid";
      if (selectedPaymentMode === "Credit") {
        finalPaymentStatus = "Pending";
      }

      // Generate IDs
      const uniqueOrderNo = `SR-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10)}`;
      const uniqueKotNo = `KOT-${String(LocalDB.getKOTs().length + 1).padStart(4, "0")}`;
      const createdAtISO = new Date().toISOString();

      // Formulate Order Object for LocalDB saving
      const finalOrderItems = cart.map(item => ({
        menuItemId: item.isManual ? "manual" : item.id.replace("reg-", ""),
        name: item.name,
        price: item.price - (item.price * (item.discount / 100)), // discounted price
        quantity: item.quantity,
        customization: item.customization,
        // Store complete manual attributes for ledger reports
        isManual: item.isManual,
        category: item.category,
        gstRate: item.gstRate,
        discount: item.discount,
        hsnCode: item.hsnCode,
        notes: item.customization
      }));

      // 1. PERFORM REMOTE SUPABASE INSERTION FIRST
      const validRestId = await LocalDB.getValidRestaurantId();

      const payload: any = {
        id: uniqueOrderNo,
        customer_name: customerName.trim() || "Walk-in Guest",
        phone_number: customerPhone.trim() || "+91 00000 00000",
        email: customerEmail.trim() || "walkin@webrajyapos.com",
        order_type: orderType,
        table_number: orderType === "dine-in" ? selectedTable : null,
        address: orderType === "delivery" ? customerAddress.trim() : null,
        items: finalOrderItems,
        subtotal: Number(cartTotals.subtotal - cartTotals.itemDiscounts),
        gst: Number(cartTotals.gst),
        packaging_charge: Number(cartTotals.packaging),
        discount_amount: Number(cartTotals.couponDiscount),
        applied_coupon: appliedCoupon?.code || null,
        grand_total: Number(cartTotals.grandTotal),
        payment_status: finalPaymentStatus,
        order_status: "New Order",
        created_at: createdAtISO,
        payment_method: finalPaymentMode,
        payment_mode: finalPaymentMode,
        kot_number: uniqueKotNo
      };

      if (validRestId) {
        payload.restaurant_id = validRestId;
      }

      console.log("[POS Direct Checkout] Submitting payload to Supabase:", payload);
      const { error } = await supabase
        .from("orders")
        .insert(payload);

      if (error) {
        throw new Error(`Supabase Insert Failed: ${error.message}`);
      }

      // 2. REMOTE INSERT SUCESSFUL -> NOW SAVE LOCALLY
      const orderToSave: Order = {
        id: uniqueOrderNo,
        customerName: payload.customer_name,
        phoneNumber: payload.phone_number,
        email: payload.email,
        orderType: payload.order_type as any,
        tableNumber: payload.table_number || undefined,
        address: payload.address || undefined,
        items: payload.items,
        subtotal: payload.subtotal,
        gst: payload.gst,
        packagingCharge: payload.packaging_charge,
        discountAmount: payload.discount_amount,
        appliedCoupon: payload.applied_coupon || undefined,
        grandTotal: payload.grand_total,
        paymentStatus: payload.payment_status,
        orderStatus: payload.order_status as any,
        createdAt: payload.created_at,
        paymentMethod: payload.payment_method,
        paymentMode: payload.payment_mode,
        restaurantId: payload.restaurant_id || undefined,
        branchId: undefined,
        kotNumber: payload.kot_number
      };

      const currentOrders = LocalDB.getOrders();
      currentOrders.unshift(orderToSave);
      LocalDB.saveOrders(currentOrders);

      // Create matched KOT locally
      const freshKOT = {
        id: uniqueKotNo,
        orderId: uniqueOrderNo,
        tableNumber: orderType === "dine-in" ? selectedTable : "Takeaway",
        customerName: payload.customer_name,
        orderType: orderType,
        status: "New Order" as const,
        specialInstructions: finalOrderItems.map(i => i.customization || i.notes).filter(Boolean).join(", ") || "None",
        createdAt: createdAtISO,
        preparationTime: 15,
        items: finalOrderItems
      };
      const currentKots = LocalDB.getKOTs();
      currentKots.unshift(freshKOT);
      LocalDB.saveKOTs(currentKots);

      // Save customized report log details
      LocalDB.addAuditLog(
        "POS Checkout Completed",
        `Finalized invoice #${orderToSave.id} for ₹${orderToSave.grandTotal} containing ${cart.length} culinary elements.`,
        `POS (${currentRole})`
      );

      // If dine-in, let's mark table status
      if (orderType === "dine-in") {
        const dbTables = LocalDB.getTables();
        const targetStatus = (orderToSave.paymentStatus === "Paid") ? "Available" : "Occupied";
        LocalDB.saveTables(dbTables.map(t => t.tableNumber === selectedTable ? { ...t, status: targetStatus } : t));
      }

      // Refresh parents and launch direct thermal bill print preview!
      onOrderPlaced();
      setShowBillPrint(orderToSave);

      // Clean current checkout state
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerAddress("");
      setOrderType("takeaway");
      setSelectedTable("");
      setAppliedCoupon(null);
      setCouponCode("");
      
      // Reset payment mode to Cash
      setSelectedPaymentMode("Cash");
      setSplitAmounts({ Cash: 0, UPI: 0, Card: 0, Other: 0 });

    } catch (err: any) {
      console.error("[POS Direct Checkout Failure]:", err);
      alert(`⚠️ Printing Terminated: ${err.message || err.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived POS Performance analytics for reporting tab
  const posReports = useMemo(() => {
    // Filter orders which were created/billed via the POS module or contain manual items
    const completedPosOrders = orders.filter(o => o.orderStatus !== "Cancelled");
    
    let manualRevenueSum = 0;
    const manualProductsBilled: { [name: string]: { name: string; qty: number; revenue: number; gst: number; category: string; hsn: string } } = {};
    const staffBilledTally: { [staff: string]: { count: number; total: number } } = {};

    completedPosOrders.forEach(o => {
      // Find staff who performed the billing
      const staffMember = (o as any).billedBy || "POS System Master";
      
      if (!staffBilledTally[staffMember]) {
        staffBilledTally[staffMember] = { count: 0, total: 0 };
      }
      staffBilledTally[staffMember].count += 1;
      staffBilledTally[staffMember].total += o.grandTotal;

      // Extract manual items inside the order
      o.items.forEach((itm: any) => {
        if (itm.isManual) {
          const itemRevenue = itm.price * itm.quantity;
          const itemGst = itemRevenue * ((itm.gstRate || 5) / 100);
          manualRevenueSum += itemRevenue;

          if (!manualProductsBilled[itm.name]) {
            manualProductsBilled[itm.name] = {
              name: itm.name,
              qty: 0,
              revenue: 0,
              gst: 0,
              category: itm.category || "General",
              hsn: itm.hsnCode || "9963"
            };
          }
          manualProductsBilled[itm.name].qty += itm.quantity;
          manualProductsBilled[itm.name].revenue += itemRevenue;
          manualProductsBilled[itm.name].gst += itemGst;
        }
      });
    });

    // Calculate Dine-In Merge Analytics
    const dineInMergeAnalytics = completedPosOrders
      .filter(o => o.orderType === "dine-in")
      .map(o => {
        const initialTime = o.createdAt;
        const addOnCount = o.addOnCount || 0;
        
        // Sum quantities of items added after the initial session (sessionNumber > 1)
        const totalAddedLater = o.items
          .filter((itm: any) => itm.sessionNumber > 1)
          .reduce((sum, itm) => sum + (itm.quantity || 0), 0);

        // Find average time between subsequent orders (timeline timestamps)
        let averageTimeStr = "N/A";
        if (o.timeline && o.timeline.length > 1) {
          let totalDiffMs = 0;
          let diffCount = 0;
          for (let i = 1; i < o.timeline.length; i++) {
            const t1 = new Date(o.timeline[i - 1].timestamp).getTime();
            const t2 = new Date(o.timeline[i].timestamp).getTime();
            if (!isNaN(t1) && !isNaN(t2)) {
              totalDiffMs += Math.abs(t2 - t1);
              diffCount++;
            }
          }
          if (diffCount > 0) {
            const avgMins = Math.round((totalDiffMs / diffCount) / 60000);
            averageTimeStr = `${avgMins} mins`;
          }
        }

        return {
          orderId: o.id,
          tableNumber: o.tableNumber || "N/A",
          initialTime: new Date(initialTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          addOnCount,
          totalAddedLater,
          averageTimeStr,
          finalBillAmount: o.grandTotal
        };
      });

    return {
      manualRevenue: manualRevenueSum,
      manualProducts: Object.values(manualProductsBilled),
      staffTally: Object.entries(staffBilledTally).map(([staff, stats]) => ({ staff, ...stats })),
      dineInMergeAnalytics
    };
  }, [orders]);

  return (
    <div className="space-y-6 w-full text-xs font-sans text-stone-700" id="pos-billing-portal">
      {/* 1. Header Navigation Bar */}
      <div className="hidden bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#C67C4E]/10 rounded-lg text-[#C67C4E]">
              <Calculator className="w-5 h-5 animate-pulse" />
            </span>
            <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wide">
              POS Billing & Open Item Portal
            </h3>
          </div>
          <p className="text-[11px] text-stone-400">
            Rapidly create order invoices, apply custom discounts, and process manual culinary items seamlessly.
          </p>
        </div>

        {/* Controller selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Terminal Tab selector */}
          <div className="bg-stone-100 p-1 rounded-xl flex border border-stone-200">
            <button
              onClick={() => setPosTab("register")}
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                posTab === "register"
                  ? "bg-white text-stone-950 shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Active Register
            </button>
            <button
              onClick={() => setPosTab("reports")}
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                posTab === "reports"
                  ? "bg-white text-stone-950 shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              POS Ledger Report
            </button>
          </div>

          {/* Active Staff simulation dropdown */}
          <div className="bg-[#FAF6F0] border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#aa7c11]" />
            <span className="font-mono text-[10px] font-bold text-[#aa7c11] uppercase mr-1">ROLE:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as any)}
              className="font-mono font-bold text-[10px] bg-transparent text-stone-850 focus:outline-none uppercase border-none p-0 cursor-pointer"
            >
              <option value="Owner">Owner (Manager)</option>
              <option value="Manager">Manager (Full)</option>
              <option value="Cashier">Cashier (Restricted)</option>
            </select>
          </div>
        </div>
      </div>

      {posTab === "register" ? (
        /* 2. MAIN REGISTER DESK: TWO COLUMN LAYOUT */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (7/12 width): Menu Selector & Manual Item trigger */}
          <div className="xl:col-span-7 space-y-4">
            
            {/* Search Bar & Category Scroller Row */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3.5">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search standard menu catalog..."
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#C67C4E] rounded-xl text-xs focus:outline-none transition-colors"
                  />
                </div>
                
                {/* PROMINENT "+ Add Manual Item" BUTTON */}
                <button
                  onClick={() => {
                    // Check manual add permission
                    if (currentRole === "Cashier") {
                      setOverrideContext({
                        actionType: "add_manual",
                        fallbackFn: () => setShowManualModal(true)
                      });
                      setOverrideError(null);
                      setOverridePasscode("");
                      setShowOverrideModal(true);
                    } else {
                      setShowManualModal(true);
                    }
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#C67C4E] to-[#aa7c11] hover:from-[#aa7c11] hover:to-[#C67C4E] text-white font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Manual Item</span>
                </button>
              </div>

              {/* Category Scroller */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                      activeCategory === cat
                        ? "bg-[#C67C4E] text-white border-[#C67C4E]"
                        : "bg-stone-50 text-stone-500 border-stone-200 hover:text-stone-850 hover:bg-stone-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] pr-1">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddRegularToCart(item)}
                  className="bg-white p-3 rounded-xl border border-stone-200 hover:border-[#C67C4E] transition-all cursor-pointer hover:shadow-xs group flex flex-col justify-between h-28"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono font-bold uppercase border ${
                        item.isVeg 
                          ? "bg-green-50 text-green-700 border-green-100" 
                          : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                        {item.isVeg ? "Veg" : "Non-Veg"}
                      </span>
                      {item.isBestseller && (
                        <span className="bg-amber-50 text-amber-700 text-[8px] font-bold px-1 rounded-sm border border-amber-100">POPULAR</span>
                      )}
                    </div>
                    <h5 className="font-serif font-bold text-stone-850 group-hover:text-[#C67C4E] transition-colors leading-tight line-clamp-2 mt-1">
                      {item.name}
                    </h5>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-stone-100 pt-2 mt-auto">
                    <span className="text-stone-900 font-mono font-bold">₹{item.price}</span>
                    <span className="w-5 h-5 bg-stone-100 rounded-lg group-hover:bg-[#C67C4E] group-hover:text-white flex items-center justify-center text-stone-500 text-xs font-bold transition-all">
                      +
                    </span>
                  </div>
                </div>
              ))}

              {filteredMenuItems.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white border border-stone-200 rounded-xl">
                  <p className="text-stone-400 font-medium">No matching culinary items found in catalog.</p>
                  <p className="text-[10px] text-stone-400 mt-1">Try refining search or click "+ Add Manual Item" to bill dynamically.</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column (5/12 width): Billing Checkout Station */}
          <div className="xl:col-span-5 bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            
            {/* Header: Customer Details */}
            <div className="p-4 bg-stone-50 border-b border-stone-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest flex items-center gap-1">
                  <ShoppingCart className="w-3.5 h-3.5 text-[#C67C4E]" />
                  Active Billing Cart
                </span>
                <span className="text-stone-900 font-bold font-mono">
                  {cart.length} Item{cart.length !== 1 && "s"}
                </span>
              </div>

              {/* Order Type Toggle Selector */}
              <div className="grid grid-cols-2 gap-1 bg-stone-200 p-0.5 rounded-xl border border-stone-250">
                {(["takeaway", "delivery"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setOrderType(type);
                      setSelectedTable("");
                    }}
                    className={`py-1.5 rounded-lg font-bold text-[9px] tracking-wider uppercase transition-all cursor-pointer ${
                      orderType === type
                        ? "bg-[#C67C4E] text-white shadow-2xs"
                        : "text-stone-500 hover:text-stone-850"
                    }`}
                  >
                    {type === "takeaway" ? "Takeaway" : "Delivery"}
                  </button>
                ))}
              </div>

              {/* Dynamic Information Inputs */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {orderType === "dine-in" && (
                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-stone-450 uppercase tracking-wider block">ALLOCATE TABLE *</label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 text-stone-800 focus:outline-none focus:border-[#C67C4E]"
                    >
                      <option value="">-- Choose Table Seating --</option>
                      {tables.map(table => (
                        <option key={table.id} value={table.tableNumber}>
                          Table #{table.tableNumber} ({table.capacity} pax - {table.seatingArea})
                        </option>
                      ))}
                    </select>
                    {activeOrderForSelectedTable && (
                      <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-center gap-1.5 font-medium animate-pulse">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        <span>Active order found. New items will be added to the existing bill.</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-stone-450 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" /> GUEST NAME
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Guest"
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-[#C67C4E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-450 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3" /> MOBILE CONTACT
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9123456789"
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-[#C67C4E]"
                  />
                </div>

                {orderType === "delivery" && (
                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-stone-450 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> POSTAL SHIPPING ADDRESS *
                    </label>
                    <textarea
                      rows={2}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Enter complete door address for delivery routing..."
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-[#C67C4E]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items List Container */}
            <div className="flex-grow overflow-y-auto max-h-[35vh] p-4 space-y-2 divide-y divide-stone-100">
              {cart.map((item) => {
                const isEditing = editingItemId === item.id;
                
                return (
                  <div key={item.id} className="pt-2 first:pt-0 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-1.5">
                      <div className="space-y-0.5">
                        <div className="font-bold text-stone-900 flex items-center gap-1 flex-wrap">
                          {item.name}
                          {item.isManual && (
                            <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                              MANUAL
                            </span>
                          )}
                        </div>
                        {item.hsnCode && (
                          <div className="text-[8px] font-mono text-stone-400">HSN: {item.hsnCode}</div>
                        )}
                        {item.customization && (
                          <div className="text-[9px] italic text-[#C67C4E] mt-0.5">Notes: {item.customization}</div>
                        )}
                        
                        <div className="text-[10px] font-mono text-stone-500">
                          ₹{item.price} x {item.quantity}
                          {item.discount > 0 && (
                            <span className="text-green-600 font-bold ml-1.5">(-{item.discount}% item disc)</span>
                          )}
                          <span className="text-stone-400 ml-1.5">| GST: {item.gstRate}%</span>
                        </div>
                      </div>

                      {/* Math Result */}
                      <div className="text-right space-y-1">
                        <span className="font-mono font-bold text-stone-850 block">
                          ₹{((item.price * item.quantity) - (item.price * item.quantity * (item.discount / 100))).toFixed(0)}
                        </span>
                        
                        {/* Adjust inline Quantity */}
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 h-5 overflow-hidden select-none">
                          <button
                            onClick={() => handleAdjustQuantity(item.id, -1)}
                            className="px-1.5 text-stone-500 hover:bg-stone-200 cursor-pointer h-full font-bold flex items-center"
                          >
                            -
                          </button>
                          <span className="px-1.5 font-mono text-[10px] font-bold text-stone-900">{item.quantity}</span>
                          <button
                            onClick={() => handleAdjustQuantity(item.id, 1)}
                            className="px-1.5 text-stone-500 hover:bg-stone-200 cursor-pointer h-full font-bold flex items-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Editor Trigger Row & Quick Action elements */}
                    <div className="flex items-center justify-between gap-1 mt-1">
                      {isEditing ? (
                        <div className="flex gap-1.5 items-center bg-stone-50 p-2 rounded-lg border border-stone-200 w-full">
                          <div className="space-y-0.5 flex-1">
                            <span className="text-[8px] font-bold text-stone-400 block uppercase">UNIT PRICE (₹)</span>
                            <input
                              type="number"
                              value={editPriceVal}
                              onChange={(e) => setEditPriceVal(e.target.value)}
                              placeholder={item.price.toString()}
                              className="w-full bg-white border border-stone-200 rounded px-1.5 py-0.5 text-[10px]"
                            />
                          </div>
                          
                          <div className="space-y-0.5 flex-1">
                            <span className="text-[8px] font-bold text-stone-400 block uppercase">DISCOUNT (%)</span>
                            <input
                              type="number"
                              value={editDiscountVal}
                              onChange={(e) => setEditDiscountVal(e.target.value)}
                              placeholder={item.discount.toString()}
                              className="w-full bg-white border border-stone-200 rounded px-1.5 py-0.5 text-[10px]"
                            />
                          </div>

                          <div className="flex gap-1 self-end">
                            <button
                              onClick={() => {
                                if (editPriceVal && parseFloat(editPriceVal) !== item.price) {
                                  handleUpdatePrice(item.id, editPriceVal);
                                } else if (editDiscountVal && parseInt(editDiscountVal, 10) !== item.discount) {
                                  handleUpdateDiscount(item.id, editDiscountVal);
                                } else {
                                  setEditingItemId(null);
                                }
                              }}
                              className="px-2 py-1 bg-green-600 text-white rounded text-[9px] uppercase font-bold cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="px-2 py-1 bg-stone-400 text-white rounded text-[9px] uppercase font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2.5 items-center pl-1">
                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditPriceVal(item.price.toString());
                              setEditDiscountVal(item.discount.toString());
                            }}
                            className="text-[#C67C4E] hover:text-[#aa7c11] flex items-center gap-1 cursor-pointer font-bold font-mono text-[9px]"
                          >
                            <Edit3 className="w-3 h-3" />
                            EDIT PARAMETERS
                          </button>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer font-bold font-mono text-[9px]"
                          >
                            <Trash2 className="w-3 h-3" />
                            DELETE
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-stone-100 rounded-full text-stone-300">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-600">POS Terminal is empty.</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">Click standard catalog items or add a manual open item above.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Promos & Coupon codes */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-2">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Promo Code (e.g. WEBRAJYA10)"
                  className="bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs flex-grow uppercase focus:outline-none focus:border-[#C67C4E]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-stone-850 hover:bg-stone-900 text-white rounded-lg text-[10px] uppercase tracking-wider font-bold cursor-pointer"
                >
                  Apply
                </button>
              </form>
              
              {couponError && (
                <p className="text-red-600 text-[10px] font-mono leading-tight">{couponError}</p>
              )}
              {appliedCoupon && (
                <div className="flex justify-between items-center bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg">
                  <span className="font-bold">PROMO CODE ACTIVE: {appliedCoupon.code}</span>
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      LocalDB.addAuditLog("POS Coupon Cleared", "Cleared global promo coupon", `POS (${currentRole})`);
                    }}
                    className="text-green-800 hover:text-green-950 font-bold ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Bill Summary Calculations */}
            <div className="p-4 bg-stone-900 text-stone-200 space-y-2.5">
              <div className="space-y-1.5 text-[11px] font-sans">
                <div className="flex justify-between text-stone-400">
                  <span>Cart Subtotal</span>
                  <span className="font-mono">₹{cartTotals.subtotal}</span>
                </div>
                {cartTotals.itemDiscounts > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Item-Level Discounts</span>
                    <span className="font-mono">-₹{cartTotals.itemDiscounts}</span>
                  </div>
                )}
                {cartTotals.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Surcharge ({appliedCoupon?.code})</span>
                    <span className="font-mono">-₹{cartTotals.couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400">
                  <span>CGST & SGST Surcharges</span>
                  <span className="font-mono">₹{cartTotals.gst}</span>
                </div>
                {cartTotals.packaging > 0 && (
                  <div className="flex justify-between text-stone-400">
                    <span>Packaging Surcharge</span>
                    <span className="font-mono">₹{cartTotals.packaging}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stone-800 pt-2 font-bold text-white text-sm">
                  <span className="text-[#C67C4E]">GRAND DISPATCH TOTAL</span>
                  <span className="text-[#C67C4E] font-mono">₹{cartTotals.grandTotal}</span>
                </div>
              </div>

              {orderType === "dine-in" && (
                <div className="flex justify-between items-center bg-stone-800 p-2 rounded-lg border border-stone-700 text-[9px] gap-2">
                  <span className="font-bold text-stone-300 uppercase tracking-wider">SETTLEMENT:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPosPaymentStatus("Pending")}
                      className={`px-2 py-1 rounded font-bold uppercase tracking-wide transition-all ${
                        posPaymentStatus === "Pending"
                          ? "bg-[#C67C4E] text-white shadow-xs"
                          : "bg-stone-700 text-stone-300 hover:bg-stone-600"
                      }`}
                    >
                      Keep Unpaid (Active)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosPaymentStatus("Paid")}
                      className={`px-2 py-1 rounded font-bold uppercase tracking-wide transition-all ${
                        posPaymentStatus === "Paid"
                          ? "bg-green-600 text-white shadow-xs"
                          : "bg-stone-700 text-stone-300 hover:bg-stone-600"
                      }`}
                    >
                      Pay/Settle Now
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Mode Selection */}
              <div className="space-y-2 border-t border-stone-200/50 pt-3 my-2 bg-stone-50/50 p-2.5 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Select Payment Mode:</span>
                  {selectedPaymentMode && (
                    <span className="text-[9px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                      ✓ {selectedPaymentMode}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: "Cash", label: "Cash", icon: "💵" },
                    { id: "UPI", label: "UPI", icon: "📱" },
                    { id: "Card", label: "Card", icon: "💳" },
                    { id: "Bank Transfer", label: "Bank Trsf", icon: "🏦" },
                    { id: "Credit", label: "Credit", icon: "🧾" },
                    { id: "Complimentary", label: "Compl.", icon: "🎁" },
                    { id: "Split Payment", label: "Split", icon: "🔀" },
                    { id: "Other", label: "Other", icon: "⚙" }
                  ].map(mode => {
                    const isSelected = selectedPaymentMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSelectedPaymentMode(mode.id)}
                        className={`relative py-1.5 px-1 rounded-lg text-center flex flex-col items-center justify-center border transition-all text-[9px] font-semibold gap-0.5 ${
                          isSelected
                            ? "bg-green-600 border-green-700 text-white shadow-xs font-bold"
                            : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className="w-2.5 h-2.5 text-white absolute top-1 right-1" />
                        )}
                        <span className="text-sm">{mode.icon}</span>
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* If Split Payment is selected, show split inputs */}
                {selectedPaymentMode === "Split Payment" && (
                  <div className="p-2 bg-white rounded-lg border border-stone-200 space-y-1.5 mt-2 animate-fade-in text-[10px]">
                    <div className="flex justify-between items-center text-[9px] font-bold text-stone-500 border-b pb-1">
                      <span>SPLIT ALLOCATIONS:</span>
                      <span className="font-mono text-stone-700">Total: ₹{cartTotals.grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {["Cash", "UPI", "Card", "Other"].map(field => (
                        <div key={field} className="flex flex-col gap-0.5">
                          <label className="font-semibold text-stone-600 text-[9px]">{field}:</label>
                          <div className="relative">
                            <span className="absolute left-1.5 top-1 text-stone-400">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={splitAmounts[field] || ""}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                setSplitAmounts(prev => ({
                                  ...prev,
                                  [field]: val
                                }));
                              }}
                              className="w-full text-right bg-stone-50 border border-stone-200 rounded p-0.5 pl-4 focus:outline-none focus:border-green-600 font-mono text-[10px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Auto-fill buttons */}
                    <div className="flex justify-between items-center pt-1 border-t mt-1 text-[9px]">
                      {(() => {
                        const allocated = (Object.values(splitAmounts) as number[]).reduce((a, b) => a + b, 0);
                        const remaining = Math.max(0, cartTotals.grandTotal - allocated);
                        const isPerfect = Math.abs(allocated - cartTotals.grandTotal) < 0.01;
                        
                        return (
                          <>
                            <span className={`font-bold ${isPerfect ? "text-green-600" : "text-amber-600"}`}>
                              Allocated: ₹{allocated.toFixed(2)} / ₹{cartTotals.grandTotal.toFixed(2)}
                            </span>
                            {remaining > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Auto-fill into Cash
                                  setSplitAmounts(prev => ({
                                    ...prev,
                                    Cash: Number((prev.Cash + remaining).toFixed(2))
                                  }));
                                }}
                                className="px-1.5 py-0.5 bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200 font-bold"
                              >
                                Fill Remaining
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Final checkout dispatch trigger */}
              <button
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleFinalizeCheckout}
                className={`w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all ${
                  cart.length === 0 || isSubmitting
                    ? "opacity-55 cursor-not-allowed"
                    : "hover:from-emerald-700 hover:to-green-600 shadow-lg cursor-pointer"
                }`}
              >
                <span>{isSubmitting ? "Finalizing Transaction..." : "Finalize & Bill Print"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* 3. REPORTING & AUDITING REGISTER SHEET */
        <div className="space-y-6" id="pos-reporting-panel">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest block">
                Total Manual Billing Revenue
              </span>
              <div className="text-xl font-serif font-black text-[#C67C4E]">
                ₹{posReports.manualRevenue.toLocaleString()}
              </div>
              <p className="text-[9px] text-stone-400 leading-tight">
                Cumulative revenue itemized separately from manual/open items.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest block">
                Total Manual Products Billed
              </span>
              <div className="text-xl font-serif font-black text-stone-900">
                {posReports.manualProducts.reduce((sum, p) => sum + p.qty, 0)} Items
              </div>
              <p className="text-[9px] text-stone-400 leading-tight">
                Unique manual items added and billed to current registers.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest block">
                Active Billed Terminals
              </span>
              <div className="text-xl font-serif font-black text-stone-900">
                {posReports.staffTally.length} Users
              </div>
              <p className="text-[9px] text-stone-400 leading-tight">
                Distinct staff registers recorded for active POS checkouts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Manual products billed sheet (7/12) */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <h4 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-[#C67C4E]" />
                  Itemized Manual Products Billed
                </h4>
                <span className="text-[9px] bg-stone-100 text-stone-500 font-bold px-2 py-0.5 rounded-full uppercase">
                  LEDS SHEET
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-stone-150 font-bold font-mono text-stone-400">
                      <th className="py-2 pr-2">PRODUCT NAME</th>
                      <th className="py-2 px-2">CATEGORY</th>
                      <th className="py-2 px-2">HSN</th>
                      <th className="py-2 px-2 text-center">QTY</th>
                      <th className="py-2 px-2 text-right">GST REVENUE</th>
                      <th className="py-2 pl-2 text-right">TOTAL EARNED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {posReports.manualProducts.map((p) => (
                      <tr key={p.name} className="hover:bg-stone-50/50">
                        <td className="py-2.5 pr-2 font-semibold text-stone-900">{p.name}</td>
                        <td className="py-2.5 px-2">
                          <span className="bg-stone-100 text-stone-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-stone-450">{p.hsn}</td>
                        <td className="py-2.5 px-2 text-center font-bold font-mono text-[#C67C4E]">{p.qty}</td>
                        <td className="py-2.5 px-2 text-right font-mono">₹{p.gst.toFixed(0)}</td>
                        <td className="py-2.5 pl-2 text-right font-mono font-bold text-stone-900">₹{p.revenue}</td>
                      </tr>
                    ))}

                    {posReports.manualProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-stone-400 font-medium">
                          No manual items have been billed yet. All revenue is associated with standard database items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff Billing Tally Ledger (4/12) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <h4 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#C67C4E]" />
                  Staff Workstation Tally
                </h4>
              </div>

              <div className="space-y-3.5">
                {posReports.staffTally.map((st) => (
                  <div key={st.staff} className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-2 flex justify-between items-center">
                    <div>
                      <div className="font-mono font-extrabold text-stone-850 uppercase text-[10px] truncate max-w-[150px]">{st.staff}</div>
                      <div className="text-[9px] text-stone-400 mt-0.5">{st.count} bills completed</div>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#C67C4E]">
                      ₹{st.total.toLocaleString()}
                    </span>
                  </div>
                ))}

                {posReports.staffTally.length === 0 && (
                  <div className="py-12 text-center text-stone-400 font-medium">
                    No active staff register entries.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dine-In Order Merging Reports */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h4 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#C67C4E]" />
                Dine-In Automatic Order Merging Analytics
              </h4>
              <span className="text-[9px] bg-[#C67C4E]/10 text-[#C67C4E] font-bold px-2 py-0.5 rounded-full uppercase">
                Active & Settled Sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-sans border-collapse">
                <thead>
                  <tr className="border-b border-stone-150 font-bold font-mono text-stone-400">
                    <th className="py-2 pr-2">ORDER ID</th>
                    <th className="py-2 px-2">TABLE NO</th>
                    <th className="py-2 px-2">INITIAL ORDER TIME</th>
                    <th className="py-2 px-2 text-center">ADD-ON MERGES</th>
                    <th className="py-2 px-2 text-center">TOTAL ITEMS ADDED LATER</th>
                    <th className="py-2 px-2 text-center">AVG TIME BETWEEN ORDERS</th>
                    <th className="py-2 pl-2 text-right">FINAL BILL AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {posReports.dineInMergeAnalytics.map((o) => (
                    <tr key={o.orderId} className="hover:bg-stone-50/50">
                      <td className="py-2.5 pr-2 font-mono font-bold text-stone-900">#{o.orderId}</td>
                      <td className="py-2.5 px-2">
                        <span className="bg-stone-100 text-stone-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                          Table #{o.tableNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-mono">{o.initialTime}</td>
                      <td className="py-2.5 px-2 text-center font-bold font-mono text-[#C67C4E]">
                        {o.addOnCount}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono">
                        {o.totalAddedLater} units
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-stone-500">
                        {o.averageTimeStr}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-mono font-bold text-stone-900">
                        ₹{o.finalBillAmount}
                      </td>
                    </tr>
                  ))}

                  {posReports.dineInMergeAnalytics.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400 font-medium">
                        No dine-in sessions or merged orders recorded yet in current registers.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL DIALOGS AND SECURITY OVERLAYS */}
      {/* ======================================================== */}

      {/* MODAL 1: ADD MANUAL CULINARY ITEM FORM */}
      <AnimatePresence>
        {showManualModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualModal(false)}
              className="fixed inset-0 bg-[#0c0a09]/40 z-40 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 max-w-md mx-auto my-auto h-fit bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 z-50 shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <div className="flex justify-between items-start border-b border-stone-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#C67C4E]/10 text-[#C67C4E] rounded-xl">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wide">
                      Add Manual Item
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">Bill a product/service not present in the menu</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {manualFormErrors.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 p-3.5 rounded-xl text-[10px] text-red-800 space-y-1">
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> validation errors found:
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 font-sans">
                    {manualFormErrors.map(e => <li key={e}>{e}</li>)}
                  </ul>
                </div>
              )}

              <form onSubmit={handleAddManualItemSubmit} className="space-y-4 text-xs font-sans text-stone-700">
                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest">
                    ITEM NAME *
                  </label>
                  <input
                    required
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Butter Naan Special Pack"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-[#C67C4E]"
                  />
                </div>

                {/* Price & Quantity Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest">
                      UNIT PRICE (INR) *
                    </label>
                    <input
                      required
                      type="number"
                      step="any"
                      min="0.01"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      placeholder="₹250.00"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-[#C67C4E]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest">
                      QUANTITY *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      placeholder="1"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-[#C67C4E]"
                    />
                  </div>
                </div>

                {/* GST & Discount Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest">
                      GST RATE *
                    </label>
                    <select
                      value={manualGstRate}
                      onChange={(e) => setManualGstRate(parseInt(e.target.value, 10))}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-[#C67C4E]"
                    >
                      <option value={0}>0% Exempted</option>
                      <option value={5}>5% Standard F&B</option>
                      <option value={12}>12% Butter/Dairy</option>
                      <option value={18}>18% Luxury Surcharge</option>
                      <option value={28}>28% Sin/Cess Rate</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest">
                      DISCOUNT (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={manualDiscount}
                      onChange={(e) => setManualDiscount(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-[#C67C4E]"
                    />
                  </div>
                </div>

                {/* Category & HSN Code */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest">
                      CATEGORY (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      placeholder="e.g. Desserts"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-[#C67C4E]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest">
                      HSN CODE
                    </label>
                    <input
                      type="text"
                      value={manualHsnCode}
                      onChange={(e) => setManualHsnCode(e.target.value)}
                      placeholder="e.g. 9963"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-[#C67C4E]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest">
                    CULINARY PREPARATION NOTES
                  </label>
                  <textarea
                    rows={2}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Provide special tandoor prep notes, packing specifications..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-[#C67C4E]"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 pt-3">
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-[#C67C4E] hover:bg-[#aa7c11] text-white font-mono font-semibold tracking-wider text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Add to Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-semibold tracking-wider text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 2: MANAGER SECURITY OVERRIDE DIALOG */}
      <AnimatePresence>
        {showOverrideModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowOverrideModal(false);
                setOverrideContext(null);
              }}
              className="fixed inset-0 bg-[#0c0a09]/50 z-55 backdrop-blur-xs"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 max-w-sm mx-auto my-auto h-fit bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 z-60 shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-4">
                <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-xl animate-pulse">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wide">
                    Manager Authorization
                  </h3>
                  <p className="text-[9px] text-stone-400 mt-0.5 font-mono">RESTRICTED ACTION OVERRIDE</p>
                </div>
              </div>

              <p className="text-stone-500 font-sans text-[11px] leading-relaxed mb-4">
                Cashier role accounts do not possess administrative permissions to perform: 
                <span className="font-bold text-stone-850 block mt-1 uppercase font-mono bg-stone-100 p-1.5 rounded text-[10px] text-center border border-stone-150">
                  {overrideContext?.actionType.replace("_", " ")}
                </span>
                Please enter a valid manager administrative passcode to override this action.
              </p>

              {overrideError && (
                <div className="mb-4 bg-red-50 border border-red-200 p-2.5 rounded-lg text-[10px] text-red-800 font-bold font-mono">
                  {overrideError}
                </div>
              )}

              <form onSubmit={handleVerifyOverride} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono text-stone-450 uppercase tracking-widest">
                    MANAGER PASSCODE
                  </label>
                  <input
                    required
                    type="password"
                    value={overridePasscode}
                    onChange={(e) => setOverridePasscode(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-center font-mono focus:outline-none focus:border-red-500 text-sm tracking-widest"
                  />
                  <div className="text-[9px] text-stone-400 font-mono text-center">
                    Default Passcodes: <span className="text-[#C67C4E]">admin123</span> or <span className="text-[#C67C4E]">password123</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-grow py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono font-semibold tracking-wider text-[10px] uppercase rounded-xl cursor-pointer shadow-sm"
                  >
                    Authorize Action
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Sandbox auto override for developers
                      setOverridePasscode("admin123");
                    }}
                    className="px-2.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-[#aa7c11] border border-amber-200 font-mono font-semibold tracking-wider text-[10px] uppercase rounded-xl cursor-pointer"
                  >
                    Quick Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOverrideModal(false);
                      setOverrideContext(null);
                    }}
                    className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-semibold tracking-wider text-[10px] uppercase rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
