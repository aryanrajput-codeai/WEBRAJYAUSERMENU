import { MenuItem, Review, KOT, KOTStatus, OrderItem, RestaurantTable, PrinterEmulatorLog, Category } from "../types";
import { menuItems as defaultMenuItems, reviews as defaultReviews, categories as defaultCategories } from "../data";
import { createClient } from "@supabase/supabase-js";

// Load configuration with broad support for multiple environments
const anyMeta = import.meta as any;
const supabaseUrl = anyMeta.env?.VITE_SUPABASE_URL || 
                    anyMeta.env?.NEXT_PUBLIC_SUPABASE_URL || 
                    "https://krvlckokabfhivmegukb.supabase.co";

const supabaseKey = anyMeta.env?.VITE_SUPABASE_ANON_KEY || 
                    anyMeta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtydmxja29rYWJmaGl2bWVndWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODkyODcsImV4cCI6MjA5OTg2NTI4N30.-wl0k_-Iq_WjQUPKi35ttuuY5ybsQdvGVbDH42RGQv4";

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface OrderTimelineEvent {
  event: string;
  timestamp: string;
  details?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  tableNumber?: string;
  address?: string;
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    customization?: string;
    addedAt?: string;
    addedBy?: string;
    kotNumber?: string;
    sessionNumber?: number;
  }[];
  subtotal: number;
  gst: number;
  packagingCharge: number;
  discountAmount: number;
  appliedCoupon?: string;
  grandTotal: number;
  paymentStatus: "Pending" | "Paid" | "Failed";
  orderStatus: "New Order" | "Accepted" | "Preparing" | "Ready" | "Out For Delivery" | "Delivered" | "Cancelled" | "Served";
  createdAt: string; // ISO string or date
  paymentMethod?: string;
  paymentMode?: string;
  restaurantId?: string;
  branchId?: string;
  kotNumber?: string;
  kotPrintStatus?: "Pending" | "Printing" | "Printed" | "Failed";
  kotPrintTimestamp?: string;
  billPrintStatus?: "Pending" | "Printing" | "Printed" | "Failed";
  billPrintTimestamp?: string;
  timeline?: OrderTimelineEvent[];
  addOnCount?: number;
}

export interface Coupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  minOrderAmount?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number; // in kg or units
  unit: string;
  minAlertLevel: number;
  category: "Dairy" | "Dry Goods" | "Vegetables" | "Spices" | "Packaging" | "Other";
  lastRestocked: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface RestaurantSettings {
  name: string;
  contactNumber: string;
  address: string;
  businessHours: string;
  deliveryCharges: number;
  gstPercentage: number;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  googleMapsUrl: string;
}

// Generate premium mock orders spanning the last 30 days
const generateMockOrders = (initialMenuItems: MenuItem[]): Order[] => {
  const orders: Order[] = [];
  const names = [
    "Aarav Sharma", "Sneha Patel", "Vikas Rajput", "Rohan Verma", "Ananya Iyer",
    "Aditya Rao", "Pooja Hegde", "Kabir Mehra", "Meera Nair", "Rahul Singhania",
    "Neha Gupta", "Amit Trivedi", "Siddharth Sen", "Deepa Joshi", "Karan Malhotra"
  ];
  const phones = [
    "+91 98765 43210", "+91 91234 56789", "+91 88888 77777", "+91 99999 88888", "+91 98111 22233",
    "+91 95400 11223", "+91 87654 32109", "+91 90123 45678", "+91 93123 93123", "+91 99887 76655",
    "+91 88776 65544", "+91 77665 54433", "+91 96543 21098", "+91 92345 67890", "+91 93456 78901"
  ];
  const emails = names.map(n => n.toLowerCase().replace(" ", ".") + "@gmail.com");

  const today = new Date();
  
  // Pick some items for diverse ordering
  const getRandItems = () => {
    const pool = initialMenuItems.slice(0, 15); // get some of the first pieces
    const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
    const selected: typeof pool = [];
    for (let i = 0; i < count; i++) {
      const item = pool[Math.floor(Math.random() * pool.length)];
      if (!selected.some(s => s.id === item.id)) {
        selected.push(item);
      }
    }
    return selected.map(item => ({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: Math.floor(Math.random() * 2) + 1,
      customization: Math.random() > 0.7 ? "Less spicy, please" : undefined
    }));
  };

  // Generate 25 orders distributed over the last 30 days
  for (let i = 24; i >= 0; i--) {
    const orderDate = new Date();
    orderDate.setDate(today.getDate() - Math.floor(i * 1.2));
    // randomize hour
    orderDate.setHours(12 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

    const items = getRandItems();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const gst = Math.round(subtotal * 0.05);
    const orderType = ["dine-in", "takeaway", "delivery"][Math.floor(Math.random() * 3)] as any;
    const packagingCharge = orderType === "dine-in" ? 0 : 25;
    
    let discountAmount = 0;
    let appliedCoupon: string | undefined;
    if (Math.random() > 0.6) {
      discountAmount = Math.round(subtotal * 0.1); // 10% coupon promo
      appliedCoupon = "IDLI10";
    }

    const grandTotal = subtotal + gst + packagingCharge - discountAmount;
    const statuses: Order["orderStatus"][] = ["New Order", "Accepted", "Preparing", "Ready", "Out For Delivery", "Delivered", "Cancelled"];
    let orderStatus: Order["orderStatus"] = "Delivered"; 
    
    // If it's today's date, make some pending or preparing
    if (i === 0) {
      orderStatus = ["New Order", "Preparing", "Out For Delivery", "Delivered"][Math.floor(Math.random() * 4)] as any;
    } else if (i === 1) {
      orderStatus = Math.random() > 0.8 ? "Cancelled" : "Delivered";
    }

    const paymentStatus: Order["paymentStatus"] = orderStatus === "Cancelled" ? "Failed" : (orderStatus === "New Order" ? "Pending" : "Paid");

    const tableNumber = orderType === "dine-in" ? String(Math.floor(Math.random() * 12) + 1) : undefined;
    const address = orderType === "delivery" ? `${Math.floor(Math.random() * 200) + 1}, Sector-4, Dwarka, New Delhi` : undefined;

    const uIdx = Math.floor(Math.random() * names.length);
    orders.push({
      id: `SR-${1000 + orders.length}`,
      customerName: names[uIdx],
      phoneNumber: phones[uIdx],
      email: emails[uIdx],
      orderType,
      tableNumber,
      address,
      items,
      subtotal,
      gst,
      packagingCharge,
      discountAmount,
      appliedCoupon,
      grandTotal,
      paymentStatus,
      orderStatus,
      createdAt: orderDate.toISOString()
    });
  }

  return orders;
};

// Initial Stock setup
const defaultInventory: InventoryItem[] = [
  { id: "i1", name: "Premium Basmati Rice", stock: 120, unit: "kg", minAlertLevel: 30, category: "Dry Goods", lastRestocked: "2026-06-10" },
  { id: "i2", name: "Fresh Paneer (Cottage Cheese)", stock: 8, unit: "kg", minAlertLevel: 15, category: "Dairy", lastRestocked: "2026-06-14" },
  { id: "i3", name: "Fermented Dosa Batter", stock: 12, unit: "Litre", minAlertLevel: 20, category: "Dry Goods", lastRestocked: "2026-06-15" },
  { id: "i4", name: "Potatoes (Sourced Red)", stock: 85, unit: "kg", minAlertLevel: 25, category: "Vegetables", lastRestocked: "2026-06-12" },
  { id: "i5", name: "Red Tomatoes", stock: 10, unit: "kg", minAlertLevel: 20, category: "Vegetables", lastRestocked: "2026-06-14" },
  { id: "i6", name: "Soya Chaap Skewers", stock: 45, unit: "units", minAlertLevel: 15, category: "Dry Goods", lastRestocked: "2026-06-12" },
  { id: "i7", name: "Pure Cow Ghee", stock: 24, unit: "kg", minAlertLevel: 10, category: "Dairy", lastRestocked: "2026-06-11" },
  { id: "i8", name: "Wholewheat Atta / Flour", stock: 150, unit: "kg", minAlertLevel: 40, category: "Dry Goods", lastRestocked: "2026-06-08" },
  { id: "i9", name: "Mozzarella Grated Cheese", stock: 6, unit: "kg", minAlertLevel: 12, category: "Dairy", lastRestocked: "2026-06-13" },
  { id: "i10", name: "Eco Packaging boxes", stock: 320, unit: "units", minAlertLevel: 100, category: "Packaging", lastRestocked: "2026-06-09" }
];

// Initial Coupons setup
const defaultCoupons: Coupon[] = [
  { code: "IDLI20", type: "percentage", value: 20, expiryDate: "2200-12-31", usageLimit: 500, usageCount: 0, minOrderAmount: 250 },
  { code: "WELCOME50", type: "fixed", value: 50, expiryDate: "2200-06-30", usageLimit: 1000, usageCount: 0, minOrderAmount: 150 },
  { code: "CHEFGIFT", type: "percentage", value: 15, expiryDate: "2026-08-31", usageLimit: 100, usageCount: 0, minOrderAmount: 300 }
];

// Initial default settings
const defaultSettings: RestaurantSettings = {
  name: "IDLI JUNCTION",
  contactNumber: "+91 92095 21933",
  address: "Shop No. G-3, Shivpuja Apartment, Plot No. 50, Beside Trimurti Nagar Bus Stop, Mankapur Ring Road, Subhash Nagar, Trimurti Nagar, Nagpur, Maharashtra 440022",
  businessHours: "Mon-Thu: 7:00 AM - 10:30 PM | Fri-Sat: 7:00 AM - 10:00 PM | Sun: 7:00 AM - 10:30 PM",
  deliveryCharges: 25,
  gstPercentage: 5,
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com/idli.junction",
  twitterUrl: "https://twitter.com",
  googleMapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.0772718136367!2d77.1082!3d28.6322!2m3!1f0!2f0!3f0!3m2!1i1248!2i786!4m2!3m1!1s0x0%3A0x0!2zMjgmdW5pcXVl!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
};

// Initial logs
const defaultAuditLogs: AuditLog[] = [
  { id: "log-1", timestamp: new Date().toISOString(), user: "Admin (owner)", action: "System Initialized", details: "Local database initialized clean. Ready for real orders.", ipAddress: "127.0.0.1" }
];

// Self-executing migration to clean up all old simulated/mock transactions and prefilled data
if (typeof window !== "undefined") {
  const ERASE_VERSION = "v3";
  if (localStorage.getItem("ij_db_erased_version") !== ERASE_VERSION) {
    // Erase all simulation history (orders, logs, and reviews) while preserving settings/menu catalogs
    localStorage.setItem("ij_orders", JSON.stringify([]));
    localStorage.setItem("ij_reviews", JSON.stringify([]));
    localStorage.setItem("ij_audit_logs", JSON.stringify(defaultAuditLogs));
    
    // Wipe static cache items to re-initialize clean default settings/coupons/inventory
    localStorage.removeItem("ij_coupons");
    localStorage.removeItem("ij_settings");
    localStorage.removeItem("ij_inventory");
    
    localStorage.setItem("ij_db_erased_version", ERASE_VERSION);
  }
}

// Deterministic string-to-64bit-integer hash function to handle legacy/live bigint IDs safely within JS MAX_SAFE_INTEGER
export function stringToNumericId(str: string): number {
  if (!str) return 0;
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) % 9007199254740991; // Safe inside JS 53-bit float and Postgres bigint
}

// Database state managers with both offline localStorage caching and full-stack Express API integration
export class LocalDB {
  static apiCallCount = 0;
  static incrementApiCallCount(apiName: string) {
    this.apiCallCount++;
    console.log(`[Supabase API Call Count] Total calls: ${this.apiCallCount} (Triggered by: ${apiName})`);
  }

  static getMenuItems(): MenuItem[] {
    const stored = localStorage.getItem("ij_menu_items");
    if (!stored) {
      localStorage.setItem("ij_menu_items", JSON.stringify(defaultMenuItems));
      return defaultMenuItems;
    }
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem("ij_menu_items", JSON.stringify(defaultMenuItems));
        return defaultMenuItems;
      }
      return parsed;
    } catch (_) {
      localStorage.setItem("ij_menu_items", JSON.stringify(defaultMenuItems));
      return defaultMenuItems;
    }
  }

  static saveMenuItems(items: MenuItem[]): void {
    localStorage.setItem("ij_menu_items", JSON.stringify(items));
    window.dispatchEvent(new Event("storage"));
  }

  static getReviews(): Review[] {
    const stored = localStorage.getItem("ij_reviews");
    if (!stored) {
      localStorage.setItem("ij_reviews", JSON.stringify([]));
      return [];
    }
    return JSON.parse(stored);
  }

  static saveReviews(reviews: any[]): void {
    localStorage.setItem("ij_reviews", JSON.stringify(reviews));
  }

  static getOrders(): Order[] {
    const stored = localStorage.getItem("ij_orders");
    if (!stored) {
      localStorage.setItem("ij_orders", JSON.stringify([]));
      return [];
    }
    return JSON.parse(stored);
  }

  static saveOrders(orders: Order[]): void {
    localStorage.setItem("ij_orders", JSON.stringify(orders));
    window.dispatchEvent(new Event("storage"));
  }

  static getTables(): RestaurantTable[] {
    const stored = localStorage.getItem("ij_tables");
    if (!stored) {
      const defaultTables: RestaurantTable[] = [
        { id: "tbl-1", tableNumber: "1", capacity: 4, seatingArea: "Main Dining Hall", status: "Available" },
        { id: "tbl-2", tableNumber: "2", capacity: 4, seatingArea: "Main Dining Hall", status: "Available" },
        { id: "tbl-3", tableNumber: "3", capacity: 2, seatingArea: "Window Alcove", status: "Available" },
        { id: "tbl-4", tableNumber: "4", capacity: 6, seatingArea: "Family Suite", status: "Available" },
        { id: "tbl-5", tableNumber: "5", capacity: 8, seatingArea: "VIP Lounge", status: "Reserved" },
        { id: "tbl-6", tableNumber: "6", capacity: 2, seatingArea: "Balcony", status: "Available" },
        { id: "tbl-7", tableNumber: "7", capacity: 4, seatingArea: "Courtyard Garden", status: "Available" },
        { id: "tbl-8", tableNumber: "8", capacity: 4, seatingArea: "Courtyard Garden", status: "Available" }
      ];
      localStorage.setItem("ij_tables", JSON.stringify(defaultTables));
      return defaultTables;
    }
    return JSON.parse(stored);
  }

  static saveTables(tables: RestaurantTable[]): void {
    localStorage.setItem("ij_tables", JSON.stringify(tables));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("tables_updated"));
  }


  static addOrder(order: Omit<Order, "id" | "createdAt">): Order {
    if (order.orderType === "dine-in" && order.tableNumber) {
      const activeOrder = this.getActiveOrderForTable(order.tableNumber);
      if (activeOrder) {
        const orders = this.getOrders();
        const idx = orders.findIndex(o => o.id === activeOrder.id);
        if (idx !== -1) {
          const kotCount = this.getKOTs().length + 1;
          const kotNumber = `KOT-${String(kotCount).padStart(4, "0")}`;
          const addOnCount = (activeOrder.addOnCount || 0) + 1;
          
          const newlyAddedItemsWithTracking = order.items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            customization: item.customization || "",
            addedAt: new Date().toISOString(),
            addedBy: (order as any).billedBy || "Waiter",
            kotNumber: kotNumber,
            sessionNumber: addOnCount + 1
          }));

          const existingItemsWithTracking = activeOrder.items.map(item => ({
            ...item,
            addedAt: item.addedAt || activeOrder.createdAt,
            addedBy: item.addedBy || "Guest",
            kotNumber: item.kotNumber || activeOrder.kotNumber || "KOT-0001",
            sessionNumber: item.sessionNumber || 1
          }));

          const combinedItems = [...existingItemsWithTracking, ...newlyAddedItemsWithTracking];
          const subtotal = combinedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const gst = Math.round(subtotal * 0.05);
          const packagingCharge = 0;
          
          let discountAmount = activeOrder.discountAmount || 0;
          if (activeOrder.appliedCoupon) {
            const coupon = this.getCoupons().find(c => c.code === activeOrder.appliedCoupon);
            if (coupon) {
              if (coupon.type === "percentage") {
                discountAmount = Math.round(subtotal * (coupon.value / 100));
              } else {
                discountAmount = Math.min(coupon.value, subtotal);
              }
            }
          }
          const grandTotal = subtotal + gst + packagingCharge - discountAmount;

          const timeline = activeOrder.timeline || [
            { event: "Order Created", timestamp: activeOrder.createdAt, details: "Initial order created." }
          ];
          timeline.push({
            event: "Additional Items Added",
            timestamp: new Date().toISOString(),
            details: `Added ${newlyAddedItemsWithTracking.length} items via ${kotNumber}.`
          });

          const updatedOrder: Order = {
            ...activeOrder,
            items: combinedItems,
            subtotal,
            gst,
            grandTotal,
            discountAmount,
            timeline,
            addOnCount
          };

          orders[idx] = updatedOrder;
          this.saveOrders(orders);

          // Add add-on KOT
          const freshKOT: KOT = {
            id: kotNumber,
            orderId: activeOrder.id,
            tableNumber: activeOrder.tableNumber || "Takeaway",
            customerName: activeOrder.customerName,
            orderType: activeOrder.orderType,
            status: "New Order",
            specialInstructions: newlyAddedItemsWithTracking.map(i => i.customization).filter(Boolean).join(", ") || "None",
            createdAt: new Date().toISOString(),
            preparationTime: 15,
            items: newlyAddedItemsWithTracking.map(item => ({
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              customization: item.customization
            })),
            isAddOn: true
          };

          const localKOTs = this.getKOTs();
          localKOTs.unshift(freshKOT);
          this.saveKOTs(localKOTs);

          // Trigger background Supabase sync
          this.apiSyncOrderTimelineAndItems(activeOrder.id, combinedItems, timeline, addOnCount).catch(e => console.warn(e));
          this.apiAddOrderItems(activeOrder.id, newlyAddedItemsWithTracking).catch(e => console.warn(e));
          this.apiAddKOT(freshKOT).catch(e => console.warn(e));

          // Play sound
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
          } catch (e) {
            // Audio lock bypass
          }

          // Dispatch events
          const event = new CustomEvent("new_order", { detail: updatedOrder });
          window.dispatchEvent(event);
          window.dispatchEvent(new Event("storage"));

          // Fire auto print notification for printers
          window.dispatchEvent(new CustomEvent("order_updated_auto_print", {
            detail: { orderId: activeOrder.id, kotId: kotNumber }
          }));

          return updatedOrder;
        }
      }
    }

    const orders = this.getOrders();
    const newId = `SR-${1000 + orders.length + Math.floor(Math.random() * 10)}`;
    const kotCount = this.getKOTs().length + 1;
    const kotNumber = `KOT-${String(kotCount).padStart(4, "0")}`;

    const initialItemsWithTracking = order.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization || "",
      addedAt: new Date().toISOString(),
      addedBy: (order as any).billedBy || "Waiter",
      kotNumber: kotNumber,
      sessionNumber: 1
    }));

    const timeline = [
      { event: "Order Created", timestamp: new Date().toISOString(), details: `Initial order created with ${order.items.length} items.` }
    ];

    const fullOrder: Order = {
      ...order,
      items: initialItemsWithTracking,
      id: newId,
      createdAt: new Date().toISOString(),
      timeline,
      addOnCount: 0,
      kotNumber: kotNumber
    };
    orders.unshift(fullOrder);
    this.saveOrders(orders);
    
    // Play sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Audio lock bypass
    }

    const event = new CustomEvent("new_order", { detail: fullOrder });
    window.dispatchEvent(event);

    return fullOrder;
  }

  static getInventory(): InventoryItem[] {
    const stored = localStorage.getItem("ij_inventory");
    if (!stored) {
      localStorage.setItem("ij_inventory", JSON.stringify(defaultInventory));
      return defaultInventory;
    }
    return JSON.parse(stored);
  }

  static saveInventory(inventory: InventoryItem[]): void {
    localStorage.setItem("ij_inventory", JSON.stringify(inventory));
  }

  static getCoupons(): Coupon[] {
    const stored = localStorage.getItem("ij_coupons");
    if (!stored) {
      localStorage.setItem("ij_coupons", JSON.stringify(defaultCoupons));
      return defaultCoupons;
    }
    return JSON.parse(stored);
  }

  static saveCoupons(coupons: Coupon[]): void {
    localStorage.setItem("ij_coupons", JSON.stringify(coupons));
  }

  static getSettings(): RestaurantSettings {
    const stored = localStorage.getItem("ij_settings");
    if (!stored) {
      localStorage.setItem("ij_settings", JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    const settings: RestaurantSettings = JSON.parse(stored);
    return settings;
  }

  static saveSettings(settings: RestaurantSettings): void {
    localStorage.setItem("ij_settings", JSON.stringify(settings));
    window.dispatchEvent(new Event("storage"));
  }

  static getCategories(): Category[] {
    const stored = localStorage.getItem("ij_categories");
    if (!stored) {
      localStorage.setItem("ij_categories", JSON.stringify(defaultCategories));
      return defaultCategories;
    }
    return JSON.parse(stored);
  }

  static saveCategories(cats: Category[]): void {
    localStorage.setItem("ij_categories", JSON.stringify(cats));
    window.dispatchEvent(new Event("storage"));
  }

  static getAuditLogs(): AuditLog[] {
    const stored = localStorage.getItem("ij_audit_logs");
    if (!stored) {
      localStorage.setItem("ij_audit_logs", JSON.stringify(defaultAuditLogs));
      return defaultAuditLogs;
    }
    return JSON.parse(stored);
  }

  static addAuditLog(action: string, details: string, user: string = "Admin (owner)"): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      details,
      ipAddress: "127.0.0.1"
    };
    logs.unshift(newLog);
    localStorage.setItem("ij_audit_logs", JSON.stringify(logs));
  }

  static addOrderTimelineEvent(orderId: string, event: string, details?: string): void {
    try {
      const orders = this.getOrders();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        if (!orders[idx].timeline) {
          orders[idx].timeline = [
            { event: "Order Created", timestamp: orders[idx].createdAt || new Date().toISOString(), details: "Initial order created." }
          ];
        }
        orders[idx].timeline!.push({
          event,
          timestamp: new Date().toISOString(),
          details: details || ""
        });
        this.saveOrders(orders);
        
        // Push the entire order timeline or items to Supabase too if online
        this.apiSyncOrderTimelineAndItems(orderId, orders[idx].items, orders[idx].timeline, orders[idx].addOnCount);
      }
    } catch (err) {
      console.error("[LocalDB Exception adding timeline event]", err);
    }
  }

  static async apiSyncOrderTimelineAndItems(orderId: string, items: any[], timeline: any[], addOnCount?: number): Promise<void> {
    try {
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const gst = Math.round(subtotal * 0.05);
      const grand_total = subtotal + gst;
      
      const updatePayload: any = {
        items: items,
        subtotal,
        gst,
        grand_total
      };

      await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId);
    } catch (err) {
      console.error("[Supabase Sync Timeline and Items failed]", err);
    }
  }

  // --- SUPABASE DIRECT INTEGRATION CODES & BACKENDS ---
  
  static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("ij_admin_jwt") || sessionStorage.getItem("ij_admin_jwt");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  static async fetchOrders(): Promise<Order[]> {
    this.incrementApiCallCount("fetchOrders");
    console.log("[Supabase API Request] Loading orders list...");
    try {
      const { data, error, status } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase API Warning] Orders fetch failed:", error);
        this.addAuditLog(
          "Supabase API Warning",
          `HTTP ${status} - Failed to fetch orders from Supabase REST endpoint: ${error.message} (${error.details}). Check if 'orders' table exists in dashboard. Falling back to local ledger cache.`,
          "System (Supabase)"
        );
        return this.getOrders();
      }

      console.log("[Supabase API Response] Successfully fetched orders:", data);

      // Translate snake_case keys back to client camelCase
      const mapped: Order[] = (data || []).map((item: any) => ({
        id: item.id,
        customerName: item.customer_name || "Guest User",
        phoneNumber: item.phone_number || "",
        email: item.email || "",
        orderType: item.order_type || "takeaway",
        tableNumber: item.table_number || undefined,
        address: item.address || undefined,
        items: Array.isArray(item.items) ? item.items : (typeof item.items === 'string' ? JSON.parse(item.items) : []),
        subtotal: Number(item.subtotal || 0),
        gst: Number(item.gst || 0),
        packagingCharge: Number(item.packaging_charge || 0),
        discountAmount: Number(item.discount_amount || 0),
        appliedCoupon: item.applied_coupon || undefined,
        grandTotal: Number(item.grand_total || 0),
        paymentStatus: item.payment_status || "Pending",
        orderStatus: item.order_status || "New Order",
        createdAt: item.created_at || new Date().toISOString(),
        paymentMethod: item.payment_method || "Cash on Delivery",
        paymentMode: item.payment_mode || item.payment_method || "Cash",
        restaurantId: item.restaurant_id || undefined,
        branchId: item.branch_id || undefined
      }));

      this.saveOrders(mapped);
      return mapped;
    } catch (err: any) {
      console.warn("[Supabase Transport Warning] Failed to contact rest endpoint:", err);
      this.addAuditLog(
        "Supabase Bridge Offline",
        `Transport link offline: ${err.message || err.toString()}. Reading orders offline from local disk cache.`,
        "System (Offline)"
      );
      return this.getOrders();
    }
  }

  static getActiveOrderForTable(tableNumber: string): Order | undefined {
    const orders = this.getOrders();
    return orders.find(o => 
      o.orderType === "dine-in" && 
      o.tableNumber === tableNumber && 
      o.paymentStatus !== "Paid" && 
      o.orderStatus !== "Cancelled"
    );
  }

  static async apiMergeIntoExistingOrder(existingOrder: Order, newItems: any[], addedBy: string): Promise<Order> {
    console.log(`[LocalDB] Merging items into active order ${existingOrder.id} for Table ${existingOrder.tableNumber}`);
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === existingOrder.id);
    const kotCount = this.getKOTs().length + 1;
    const kotNumber = `KOT-${String(kotCount).padStart(4, "0")}`;
    const addOnCount = (existingOrder.addOnCount || 0) + 1;

    const newlyAddedItemsWithTracking = newItems.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization || "",
      addedAt: new Date().toISOString(),
      addedBy: addedBy || "Waiter",
      kotNumber: kotNumber,
      sessionNumber: addOnCount + 1
    }));

    const existingItemsWithTracking = existingOrder.items.map(item => ({
      ...item,
      addedAt: item.addedAt || existingOrder.createdAt,
      addedBy: item.addedBy || "Guest",
      kotNumber: item.kotNumber || existingOrder.kotNumber || "KOT-0001",
      sessionNumber: item.sessionNumber || 1
    }));

    const combinedItems = [...existingItemsWithTracking, ...newlyAddedItemsWithTracking];
    const subtotal = combinedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const gst = Math.round(subtotal * 0.05);
    const packagingCharge = 0;
    
    let discountAmount = existingOrder.discountAmount || 0;
    if (existingOrder.appliedCoupon) {
      const coupon = this.getCoupons().find(c => c.code === existingOrder.appliedCoupon);
      if (coupon) {
        if (coupon.type === "percentage") {
          discountAmount = Math.round(subtotal * (coupon.value / 100));
        } else {
          discountAmount = Math.min(coupon.value, subtotal);
        }
      }
    }
    const grandTotal = subtotal + gst + packagingCharge - discountAmount;

    const timeline = existingOrder.timeline || [
      { event: "Order Created", timestamp: existingOrder.createdAt, details: "Initial order created." }
    ];
    timeline.push({
      event: "Additional Items Added",
      timestamp: new Date().toISOString(),
      details: `Added ${newlyAddedItemsWithTracking.length} items via ${kotNumber}.`
    });

    const updatedOrder: Order = {
      ...existingOrder,
      items: combinedItems,
      subtotal,
      gst,
      grandTotal,
      discountAmount,
      timeline,
      addOnCount
    };

    if (idx !== -1) {
      orders[idx] = updatedOrder;
      this.saveOrders(orders);
    }

    // Add add-on KOT
    const freshKOT: KOT = {
      id: kotNumber,
      orderId: existingOrder.id,
      tableNumber: existingOrder.tableNumber || "Takeaway",
      customerName: existingOrder.customerName,
      orderType: existingOrder.orderType,
      status: "New Order",
      specialInstructions: newlyAddedItemsWithTracking.map(i => i.customization).filter(Boolean).join(", ") || "None",
      createdAt: new Date().toISOString(),
      preparationTime: 15,
      items: newlyAddedItemsWithTracking.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customization: item.customization
      })),
      isAddOn: true
    };

    const localKOTs = this.getKOTs();
    localKOTs.unshift(freshKOT);
    this.saveKOTs(localKOTs);

    // Trigger background Supabase sync
    try {
      await this.apiSyncOrderTimelineAndItems(existingOrder.id, combinedItems, timeline, addOnCount);
      await this.apiAddOrderItems(existingOrder.id, newlyAddedItemsWithTracking);
      await this.apiAddKOT(freshKOT);
    } catch (err) {
      console.warn("[apiMergeIntoExistingOrder Sync warning]", err);
    }

    // Dispatch events
    const event = new CustomEvent("new_order", { detail: updatedOrder });
    window.dispatchEvent(event);
    window.dispatchEvent(new Event("storage"));

    // Play sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Audio lock bypass
    }

    // Fire auto print notification for printers
    window.dispatchEvent(new CustomEvent("order_updated_auto_print", {
      detail: { orderId: existingOrder.id, kotId: kotNumber }
    }));

    return updatedOrder;
  }

  static async apiAddOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order> {
    // Core boundary validation for Table QR code source
    if (order.orderType === "dine-in") {
      if (!order.tableNumber) {
        throw new Error("Missing Table Number: Dine-In checkout requires a scanned table QR source.");
      }
      const validTables = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
      if (!validTables.includes(order.tableNumber)) {
        throw new Error(`Invalid QR Code Source: Table number #${order.tableNumber} is not registered in our dining area.`);
      }

      // Check if table already has an active unpaid order
      const activeOrder = this.getActiveOrderForTable(order.tableNumber);
      if (activeOrder) {
        return this.apiMergeIntoExistingOrder(activeOrder, order.items, (order as any).billedBy || "Waiter");
      }
    }

    const orders = this.getOrders();
    const newId = `SR-${1000 + orders.length + Math.floor(Math.random() * 100)}`;
    const kotCount = this.getKOTs().length + 1;
    const kotNumber = `KOT-${String(kotCount).padStart(4, "0")}`;

    const initialItemsWithTracking = order.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization || "",
      addedAt: new Date().toISOString(),
      addedBy: (order as any).billedBy || "Waiter",
      kotNumber: kotNumber,
      sessionNumber: 1
    }));

    const timeline = [
      { event: "Order Created", timestamp: new Date().toISOString(), details: `Initial order created with ${order.items.length} items.` }
    ];

    const fullOrder: Order = {
      ...order,
      items: initialItemsWithTracking,
      id: newId,
      createdAt: new Date().toISOString(),
      timeline,
      addOnCount: 0,
      kotNumber: kotNumber
    };

    const payload = {
      id: fullOrder.id,
      customer_name: fullOrder.customerName,
      phone_number: fullOrder.phoneNumber,
      email: fullOrder.email,
      order_type: fullOrder.orderType,
      table_number: fullOrder.tableNumber || null,
      address: fullOrder.address || null,
      items: fullOrder.items,
      subtotal: Number(fullOrder.subtotal || 0),
      gst: Number(fullOrder.gst || 0),
      packaging_charge: Number(fullOrder.packagingCharge || 0),
      discount_amount: Number(fullOrder.discountAmount || 0),
      applied_coupon: fullOrder.appliedCoupon || null,
      grand_total: Number(fullOrder.grandTotal || 0),
      payment_status: fullOrder.paymentStatus || "Pending",
      order_status: fullOrder.orderStatus || "New Order",
      created_at: fullOrder.createdAt,
      payment_method: fullOrder.paymentMethod || "Cash on Delivery",
      payment_mode: fullOrder.paymentMode || "Cash",
      restaurant_id: fullOrder.restaurantId || "rest-1",
      branch_id: fullOrder.branchId || "branch-1",
      kot_number: kotNumber
    };

    console.log("[Supabase API POST Payload] Submitting new order:", payload);

    try {
      const { error, status } = await supabase
        .from("orders")
        .insert(payload);

      if (error) {
        console.warn("[Supabase API Warning] Failed to submit order payload:", error);
        this.addAuditLog(
          "Supabase Sync Warning",
          `HTTP ${status} - Error syncing order to server: ${error.message}. Local ledger fallback activated.`,
          "System"
        );
      } else {
        console.log(`[Supabase API POST Success] Order ${newId} synchronized in cloud ledger.`);
        this.addAuditLog(
          "Supabase Sync Success",
          `Order reference ${newId} with total ₹${fullOrder.grandTotal} stored inside cloud database successfully.`,
          "System"
        );
      }

      // Successfully saved order or fell back. Now save order items and KOT in Supabase
      try {
        await this.apiAddOrderItems(fullOrder.id, fullOrder.items);
        
        const freshKOT: KOT = {
          id: kotNumber,
          orderId: fullOrder.id,
          tableNumber: fullOrder.tableNumber || "Takeaway",
          customerName: fullOrder.customerName,
          orderType: fullOrder.orderType,
          status: "New Order",
          specialInstructions: fullOrder.items.map(i => i.customization).filter(Boolean).join(", ") || "None",
          createdAt: fullOrder.createdAt,
          preparationTime: 15,
          items: fullOrder.items
        };
        await this.apiAddKOT(freshKOT);
      } catch (childErr) {
        console.warn("[KOT/Items Child Sync Warning] Handled locally:", childErr);
      }
    } catch (err: any) {
      console.warn("[Supabase API Network Warning] Relying on local database:", err);
      this.addAuditLog(
        "Supabase Sync Offline",
        `Network or server connection issues: ${err.message || err.toString()}. Saved locally.`,
        "System"
      );
    }

    // Play audio ring
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}

    // Save KOT locally
    try {
      const freshKOT: KOT = {
        id: kotNumber,
        orderId: fullOrder.id,
        tableNumber: fullOrder.tableNumber || "Takeaway",
        customerName: fullOrder.customerName,
        orderType: fullOrder.orderType,
        status: "New Order",
        specialInstructions: fullOrder.items.map(i => i.customization).filter(Boolean).join(", ") || "None",
        createdAt: fullOrder.createdAt,
        preparationTime: 15,
        items: fullOrder.items
      };
      
      const localKOTs = this.getKOTs();
      if (!localKOTs.some(k => k.id === freshKOT.id)) {
        localKOTs.unshift(freshKOT);
        this.saveKOTs(localKOTs);
      }
    } catch (kotErr) {
      console.warn("Local KOT save warning:", kotErr);
    }

    // Save order locally
    const current = this.getOrders();
    if (!current.some(o => o.id === fullOrder.id)) {
      current.unshift(fullOrder);
      this.saveOrders(current);
    }

    // Notify other live tabs
    const event = new CustomEvent("new_order", { detail: fullOrder });
    window.dispatchEvent(event);
    window.dispatchEvent(new Event("storage"));

    return fullOrder;
  }

  static async apiUpdatePaymentDetails(
    orderId: string, 
    paymentMode: string, 
    paymentStatus: Order["paymentStatus"],
    restaurantId?: string,
    branchId?: string
  ): Promise<Order> {
    console.log(`[LocalDB & Supabase] Updating Order ${orderId} payment details: Mode=${paymentMode}, Status=${paymentStatus}`);
    
    // 1. UPDATE LOCAL DB FIRST (Guarantees responsive UI and reliable fallback offline)
    const current = this.getOrders();
    const idx = current.findIndex(o => o.id === orderId);
    let orderCopy: Order | null = null;

    if (idx !== -1) {
      current[idx].paymentMode = paymentMode;
      current[idx].paymentStatus = paymentStatus;
      current[idx].paymentMethod = paymentMode;
      
      if (restaurantId) current[idx].restaurantId = restaurantId;
      if (branchId) current[idx].branchId = branchId;

      this.saveOrders(current);
      orderCopy = { ...current[idx] };
      window.dispatchEvent(new Event("storage"));
    }

    // 2. ATTEMPT SUPABASE SYNC (throw error if it fails)
    const updatePayload: any = {
      payment_mode: paymentMode,
      payment_method: paymentMode,
      payment_status: paymentStatus
    };
    if (restaurantId) updatePayload.restaurant_id = restaurantId;
    if (branchId) updatePayload.branch_id = branchId;

    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (error) {
      console.error("[Supabase API Sync Error] Payment details update failed:", error);
      this.addAuditLog(
        "Supabase Sync Failure",
        `Failed to update payment details on server for Order ${orderId}: ${error.message}`,
        "System"
      );
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log(`[Supabase API Sync Success] Payment details for ${orderId} synced.`);
    this.addAuditLog(
      "Supabase Sync Success",
      `Payment details updated for Order ${orderId} - Mode: ${paymentMode}, Status: ${paymentStatus}`,
      "System"
    );

    return orderCopy || (current[idx] || { id: orderId, paymentMode, paymentStatus } as any);
  }

  static async apiUpdateOrderStatus(orderId: string, status: Order["orderStatus"], paymentStatus?: string): Promise<Order> {
    console.log(`[LocalDB & Supabase] Updating Order ${orderId} status to ${status}`);
    
    // 1. UPDATE LOCAL DB FIRST (Guarantees responsive UI and reliable fallback offline)
    const current = this.getOrders();
    const idx = current.findIndex(o => o.id === orderId);
    let previousStatus = "";
    let previousPaymentStatus = "";
    let orderCopy: Order | null = null;

    if (idx !== -1) {
      previousStatus = current[idx].orderStatus;
      previousPaymentStatus = current[idx].paymentStatus || "Pending";
      current[idx].orderStatus = status;
      if (paymentStatus) {
        current[idx].paymentStatus = paymentStatus as any;
      }
      this.saveOrders(current);
      orderCopy = { ...current[idx] };
      // Dispatch storage event so other components and tabs update immediately
      window.dispatchEvent(new Event("storage"));
    }

    // 2. ATTEMPT SUPABASE SYNC IN BACKGROUND / GRACEFULLY
    try {
      const updatePayload: any = { order_status: status };
      if (paymentStatus) {
        updatePayload.payment_status = paymentStatus;
      }

      const { error, status: httpStatus } = await supabase
         .from("orders")
         .update(updatePayload)
         .eq("id", orderId);

      if (error) {
        console.warn("[Supabase API Sync Warning] Order status update failed on remote server:", error);
        this.addAuditLog(
          "Supabase Sync Warning",
          `HTTP ${httpStatus} - Failed to update order status on server: ${error.message}. Local changes retained.`,
          "Admin (owner)"
        );
      } else {
        console.log(`[Supabase API Sync Success] Order ${orderId} synced.`);
      }
    } catch (err: any) {
      console.warn("[Supabase API Network Exception] Relying on local database:", err);
      this.addAuditLog(
        "Supabase Sync Offline",
        `Network/Fetch error syncing order status (LocalDB fallback active): ${err.message || err}`,
        "Admin (owner)"
      );
    }

    if (orderCopy) {
      window.dispatchEvent(new CustomEvent("order_updated_auto_print", {
        detail: {
          order: orderCopy,
          previousStatus,
          previousPaymentStatus
        }
      }));
    }

    // 3. Always return the updated local order
    return current[idx] || { id: orderId, orderStatus: status, paymentStatus: paymentStatus } as any;
  }

  static supportedColumns: string[] = [];

  static async detectSupportedColumns(): Promise<string[]> {
    if (this.supportedColumns.length > 0) return this.supportedColumns;
    
    const candidateColumns = [
      "id", "name", "item_name", "price", "category", "description", 
      "is_veg", "is_bestseller", "is_chef_special", "image", "image_url", 
      "spiciness", "rating", "rating_count",
      "gst_percent", "gst_percentage", "gst", "hsn_code", "hsn", "available", "is_available"
    ];
    
    const detected: string[] = [];
    for (const col of candidateColumns) {
      try {
        const { error } = await supabase.from("menu_items").select(col).limit(1);
        if (!error || error.code !== "42703") {
          detected.push(col);
        }
      } catch (e) {
        // Fallback to including it if unsure
        detected.push(col);
      }
    }
    this.supportedColumns = detected;
    return detected;
  }

  static findMatchingCategoryId(inputCat: string): string {
    const activeCategories = this.getCategories();
    if (!inputCat) return activeCategories[0]?.id || "soups";
    const normalizedInput = inputCat.trim().toLowerCase();
    
    // Try exact match on ID
    const matchById = activeCategories.find(c => c.id.toLowerCase() === normalizedInput);
    if (matchById) return matchById.id;

    // Try exact match on name
    const matchByName = activeCategories.find(c => c.name.toLowerCase() === normalizedInput);
    if (matchByName) return matchByName.id;

    // Try matched slugified (replace space with dash)
    const slugified = normalizedInput.replace(/\s+/g, "-");
    const matchBySlug = activeCategories.find(c => c.id.toLowerCase() === slugified || c.name.toLowerCase().replace(/\s+/g, "-") === slugified);
    if (matchBySlug) return matchBySlug.id;

    // Try partial match or word match (e.g. "Main Course" -> matches "Indian Main Course")
    const matchByPartial = activeCategories.find(c => {
      const nameLower = c.name.toLowerCase();
      const idLower = c.id.toLowerCase();
      return nameLower.includes(normalizedInput) || normalizedInput.includes(nameLower) || idLower.includes(normalizedInput) || normalizedInput.includes(idLower);
    });
    if (matchByPartial) return matchByPartial.id;

    return activeCategories[0]?.id || "soups"; // Fallback to first category instead of "Other"
  }

  static mapDatabaseMenuItem(item: any): MenuItem {
    if (!item) {
      return {
        id: `item-${Date.now()}-${Math.random()}`,
        itemCode: "ITEM-UNKNOWN",
        category: "soups",
        name: "Unnamed Item",
        description: "",
        price: 0,
        isVeg: true,
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
        rating: 4.5,
        ratingCount: 0,
        isBestseller: false,
        isChefSpecial: false,
        spiciness: 0,
      };
    }

    const rawId = item.id !== undefined && item.id !== null ? String(item.id) : `item-${Date.now()}-${Math.random()}`;
    return {
      id: rawId,
      itemCode: item.item_code || `ITEM-${rawId.toUpperCase()}`,
      category: this.findMatchingCategoryId(item.category),
      name: item.name || item.item_name || "Unnamed Item",
      description: item.description || "",
      price: Number(item.price || 0),
      isVeg: item.is_veg !== undefined && item.is_veg !== null 
        ? !!item.is_veg 
        : (item.food_type 
            ? (String(item.food_type).trim().toLowerCase() === "veg") 
            : true),
      imageUrl: item.image_url || item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
      rating: Number(item.rating !== undefined && item.rating !== null ? item.rating : 4.5),
      ratingCount: Number(item.rating_count !== undefined && item.rating_count !== null ? item.rating_count : (item.ratingCount || 0)),
      isBestseller: item.is_bestseller !== undefined && item.is_bestseller !== null ? !!item.is_bestseller : (!!item.isBestseller),
      isChefSpecial: item.is_chef_special !== undefined && item.is_chef_special !== null ? !!item.is_chef_special : (!!item.isChefSpecial),
      spiciness: Number(item.spiciness !== undefined && item.spiciness !== null ? item.spiciness : 0),
      gstPercent: item.gst_percent !== undefined ? Number(item.gst_percent) : (item.gst_percentage !== undefined ? Number(item.gst_percentage) : (item.gst !== undefined ? Number(item.gst) : undefined)),
      hsnCode: item.hsn_code || item.hsn || undefined,
      available: item.available !== undefined ? !!item.available : (item.is_available !== undefined ? !!item.is_available : undefined),
    };
  }

  static mapMenuItemForInsert(item: MenuItem, supportedColumns: string[]): any {
    const obj: any = {};
    const isPureDigits = /^\d+$/.test(item.id);
    obj.id = isPureDigits ? Number(item.id) : item.id;

    if (supportedColumns.includes("item_code")) {
      obj.item_code = item.itemCode || `ITEM-${item.id.toUpperCase()}`;
    }
    if (supportedColumns.includes("category")) {
      obj.category = item.category;
    }
    if (supportedColumns.includes("name")) {
      obj.name = item.name;
    }
    if (supportedColumns.includes("item_name")) {
      obj.item_name = item.name;
    }
    if (supportedColumns.includes("description")) {
      obj.description = item.description;
    }
    if (supportedColumns.includes("price")) {
      obj.price = Number(item.price || 0);
    }
    if (supportedColumns.includes("is_veg")) {
      obj.is_veg = item.isVeg;
    }
    if (supportedColumns.includes("food_type")) {
      obj.food_type = item.isVeg ? "Veg" : "Non-Veg";
    }
    if (supportedColumns.includes("image_url")) {
      obj.image_url = item.imageUrl;
    }
    if (supportedColumns.includes("image")) {
      obj.image = item.imageUrl;
    }
    if (supportedColumns.includes("rating")) {
      obj.rating = Number(item.rating !== undefined ? item.rating : 4.5);
    }
    if (supportedColumns.includes("rating_count")) {
      obj.rating_count = Number(item.ratingCount !== undefined ? item.ratingCount : 0);
    }
    if (supportedColumns.includes("is_bestseller")) {
      obj.is_bestseller = !!item.isBestseller;
    }
    if (supportedColumns.includes("is_chef_special")) {
      obj.is_chef_special = !!item.isChefSpecial;
    }
    if (supportedColumns.includes("spiciness")) {
      obj.spiciness = Number(item.spiciness !== undefined ? item.spiciness : 0);
    }
    if (supportedColumns.includes("gst_percent")) {
      obj.gst_percent = Number(item.gstPercent !== undefined ? item.gstPercent : 5);
    } else if (supportedColumns.includes("gst_percentage")) {
      obj.gst_percentage = Number(item.gstPercent !== undefined ? item.gstPercent : 5);
    } else if (supportedColumns.includes("gst")) {
      obj.gst = Number(item.gstPercent !== undefined ? item.gstPercent : 5);
    }
    if (supportedColumns.includes("hsn_code")) {
      obj.hsn_code = item.hsnCode || "";
    } else if (supportedColumns.includes("hsn")) {
      obj.hsn = item.hsnCode || "";
    }
    if (supportedColumns.includes("available")) {
      obj.available = item.available !== undefined ? item.available : true;
    } else if (supportedColumns.includes("is_available")) {
      obj.is_available = item.available !== undefined ? item.available : true;
    }

    return obj;
  }

  static mapMenuItemForUpdate(item: MenuItem, supportedColumns: string[]): any {
    return this.mapMenuItemForInsert(item, supportedColumns);
  }

  static async fetchMenuItems(): Promise<MenuItem[]> {
    this.incrementApiCallCount("fetchMenuItems");
    console.log("[Supabase API Request] Loading menus list with robust fallback mapping...");
    try {
      const { data, error, status } = await supabase
        .from("menu_items")
        .select("*");

      if (error) {
        console.warn("[Supabase API Error] Menu catalog load failed:", error);
        this.addAuditLog(
          "Catalog Sync Error",
          `HTTP ${status} - Failed to fetch menu catalog from Supabase: ${error.message}. Using offline defaults.`,
          "System (Supabase)"
        );
        return this.getMenuItems();
      }

      console.log("[Supabase API Response] Successfully fetched menus count:", data?.length);

      if (!data || data.length === 0) {
        console.log("[Supabase API] Menu table is empty in Supabase. Attempting to seed default items...");
        try {
          await this.apiSaveMenuItems(defaultMenuItems);
          console.log("[Supabase API] Successfully auto-seeded empty database menu table.");
          this.saveMenuItems(defaultMenuItems);
          return defaultMenuItems;
        } catch (seedError) {
          console.error("[Supabase API Error] Seeding empty database table failed, returning defaults:", seedError);
          this.saveMenuItems(defaultMenuItems);
          return defaultMenuItems;
        }
      }

      const mapped: MenuItem[] = (data || []).map((item: any) => this.mapDatabaseMenuItem(item));

      // De-duplicate items by category and name (uniqueness is per category using existing category column)
      const uniqueMapped: MenuItem[] = [];
      const seenKeys = new Set<string>();
      
      for (const item of mapped) {
        const key = `${(item.category || "").toLowerCase().trim()}::${(item.name || "").toLowerCase().trim()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueMapped.push(item);
        }
      }

      // Identify actual duplicates in the database to trigger a background cleanup (uniqueness is per category and name)
      const duplicateIds: any[] = [];
      const seenDbKeys = new Set<string>();
      
      for (const item of (data || [])) {
        const mappedItem = this.mapDatabaseMenuItem(item);
        const key = `${(mappedItem.category || "").toLowerCase().trim()}::${(mappedItem.name || "").toLowerCase().trim()}`;
        if (seenDbKeys.has(key)) {
          duplicateIds.push(item.id);
        } else {
          seenDbKeys.add(key);
        }
      }

      if (duplicateIds.length > 0) {
        console.log("[Supabase API] Detected duplicate item rows in database. Cleaning up background IDs:", duplicateIds);
        supabase.from("menu_items").delete().in("id", duplicateIds).then(({ error }) => {
          if (error) console.error("[Supabase API] Background duplicate cleanup failed:", error);
          else console.log("[Supabase API] Background duplicate cleanup completed successfully.");
        });
      }

      // Sort on frontend to avoid database column order issues
      uniqueMapped.sort((a, b) => a.name.localeCompare(b.name));

      this.saveMenuItems(uniqueMapped);
      return uniqueMapped;
    } catch (err: any) {
      console.error("[Menu Transport Sync Error]", err);
      return this.getMenuItems();
    }
  }

  static async apiSaveMenuItems(items: MenuItem[]): Promise<void> {
    this.incrementApiCallCount("apiSaveMenuItems");
    try {
      const supported = await this.detectSupportedColumns();
      console.log("[Supabase API] Supported columns on menu_items table detected:", supported);

      // 1. Fetch current database state to check what actually exists using verified existing columns only
      const { data: dbItems, error: fetchErr } = await supabase
        .from("menu_items")
        .select("id, name, category");

      if (fetchErr) {
        console.warn("[Supabase Sync Warning] Failed to fetch current items for matching, proceeding with empty array:", fetchErr);
      }

      const existingDbItems = dbItems || [];

      // 2. Classify items into Updates and Inserts with strict validation
      const updates: { id: any; payload: any; item: MenuItem }[] = [];
      const inserts: { payload: any; item: MenuItem }[] = [];
      const matchedDbIds = new Set<any>();

      for (const item of items) {
        // Find if this item has an existing match in the database by ID
        let dbMatch: any = null;

        const isNumericId = /^\d+$/.test(String(item.id));
        if (isNumericId) {
          const numId = Number(item.id);
          dbMatch = existingDbItems.find((x: any) => Number(x.id) === numId);
        } else {
          dbMatch = existingDbItems.find((x: any) => String(x.id).toLowerCase() === String(item.id).toLowerCase());
        }

        // If not matched by ID, but it is a standard default seeded item (e.g. s1, s2, i1, i2, etc. or a numeric index),
        // we try to resolve it to an existing database row by Name + Category to prevent duplicate inserts and bridge IDs.
        const isDefaultSeededItem = /^s\d+$/.test(String(item.id)) || /^\d+$/.test(String(item.id)) || /^i\d+$/.test(String(item.id));
        if (!dbMatch && isDefaultSeededItem && item.name && item.category) {
          dbMatch = existingDbItems.find(
            (x: any) =>
              String(x.name || "").trim().toLowerCase() === String(item.name).trim().toLowerCase() &&
              String(x.category || "").trim().toLowerCase() === String(item.category).trim().toLowerCase()
          );
        }

        const operation = dbMatch ? "UPDATE" : "CREATE";

        // Requirement 1 & 2: Log every item before saving with detailed fields
        console.log(`\n=== [Supabase API Sync Item Pre-Save Log] ===`);
        console.log(`- Local ID: ${item.id}`);
        console.log(`- Database Matched ID: ${dbMatch ? dbMatch.id : "None"}`);
        console.log(`- Name: "${item.name}"`);
        console.log(`- Category: "${item.category}"`);
        console.log(`- Chosen Operation: ${operation}`);

        // Requirement 3: If classified as CREATE, explain exactly why no existing database row was matched
        if (operation === "CREATE") {
          console.log(`- Explanation for CREATE classification:`);
          console.log(`  1. No existing database row has an ID matching "${item.id}" (searched case-insensitively and numerically).`);
          
          const duplicateByNameAndCat = existingDbItems.find(
            (x: any) =>
              String(x.name || "").trim().toLowerCase() === String(item.name).trim().toLowerCase() &&
              String(x.category || "").trim().toLowerCase() === String(item.category).trim().toLowerCase()
          );

          if (duplicateByNameAndCat) {
            console.log(`  2. WARNING: A row with name "${item.name}" and category "${item.category}" ALREADY exists in the database with ID "${duplicateByNameAndCat.id}"!`);
            console.log(`     However, it was NOT matched because the local item ID is "${item.id}" which is not in a default seeded pattern (e.g., s1, s2 or numeric), so ID bridging was not applied.`);
          } else {
            console.log(`  2. No database row matches both the name "${item.name}" and category "${item.category}" case-insensitively.`);
            const partialNameMatch = existingDbItems.find(
              (x: any) => String(x.name || "").trim().toLowerCase() === String(item.name).trim().toLowerCase()
            );
            if (partialNameMatch) {
              console.log(`     (Note: A database row with the name "${partialNameMatch.name}" exists but in category "${partialNameMatch.category}" instead of "${item.category}").`);
            }
          }
        }

        // Prepare the mapped payload object
        const mappedPayload = this.mapMenuItemForInsert(item, supported);
        // ALWAYS delete id from updates (it's specified in .eq("id", id))
        delete mappedPayload.id;

        if (dbMatch) {
          // This is an EDIT operation!
          // Check if another item in the database already has the same name and category
          const duplicate = existingDbItems.find(
            (x: any) =>
              String(x.id) !== String(dbMatch.id) &&
              String(x.name || "").trim().toLowerCase() === String(item.name).trim().toLowerCase() &&
              String(x.category || "").trim().toLowerCase() === String(item.category).trim().toLowerCase()
          );

          if (duplicate) {
            console.error(`[Supabase Validation Error] Cannot edit item. A menu item with name "${item.name}" already exists in category "${item.category}".`);
            throw new Error("A menu item with this name already exists in this category.");
          }

          updates.push({
            id: dbMatch.id,
            payload: mappedPayload,
            item
          });
          matchedDbIds.add(dbMatch.id);
        } else {
          // This is a CREATE operation!
          // Check whether a row already exists with the same unique fields
          const duplicate = existingDbItems.find(
            (x: any) =>
              String(x.name || "").trim().toLowerCase() === String(item.name).trim().toLowerCase() &&
              String(x.category || "").trim().toLowerCase() === String(item.category).trim().toLowerCase()
          );

          if (duplicate) {
            console.error(`[Supabase Validation Error] Cannot create item. A menu item with name "${item.name}" already exists in category "${item.category}".`);
            throw new Error("A menu item with this name already exists in this category.");
          }

          // Generate a valid UUID for the new item if the current id is not a UUID
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id));
          const newId = isUuid ? item.id : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

          mappedPayload.id = newId;

          inserts.push({
            payload: mappedPayload,
            item
          });
        }
      }

      // 3. Delete items that are in the database but no longer in the frontend list
      const deleteIds = existingDbItems
        .map((x: any) => x.id)
        .filter((id: any) => !matchedDbIds.has(id));

      if (deleteIds.length > 0) {
        console.log(`[Supabase API Sync] Deleting ${deleteIds.length} removed items from database...`);
        for (const id of deleteIds) {
          console.log("Operation: DELETE");
          console.log("Item ID:", id);
          console.log("Data: { id: " + JSON.stringify(id) + " }");
          console.log(`Executing Supabase query: supabase.from("menu_items").delete().eq("id", "${id}")`);

          const { error: delErr } = await supabase
            .from("menu_items")
            .delete()
            .eq("id", id);

          if (delErr) {
            console.warn(`[Supabase Sync Warning] Failed to delete removed menu item ID ${id}:`, delErr);
          }
        }
      }

      // 4. Perform Updates
      if (updates.length > 0) {
        console.log(`[Supabase API Sync] Updating ${updates.length} items...`);
        for (const update of updates) {
          const sqlEquivalent = `UPDATE public.menu_items SET ${Object.entries(update.payload).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(", ")} WHERE id = '${update.id}';`;
          const stackTrace = new Error("Stack trace collector").stack || "";

          console.log("\n=== [Supabase Diagnostic Log] Before UPDATE ===");
          // Requirement 4: Before executing database query, print whether calling insert() or update()
          console.log("Calling: update() on table 'menu_items'");
          console.log("Responsible File: /src/lib/db.ts");
          console.log("Responsible Function: LocalDB.apiSaveMenuItems");
          console.log("Operation: UPDATE");
          console.log("Payload:", JSON.stringify(update.payload, null, 2));
          console.log("SQL Equivalent:", sqlEquivalent);
          console.log("ID Target:", update.id);
          console.log("Stack Trace:\n", stackTrace);

          try {
            const { error: updateErr } = await supabase
              .from("menu_items")
              .update(update.payload)
              .eq("id", update.id);

            console.log("\n=== [Supabase Diagnostic Log] After UPDATE ===");
            console.log("Returned ID:", update.id);
            console.log("Returned Error:", updateErr ? JSON.stringify(updateErr, null, 2) : "None (Success)");

            if (updateErr) {
              // Requirement 5 & 6: Capture the full payload and details of the item triggering the constraint
              console.error("\n=== [CRITICAL FAILED PAYLOAD TRACER] ===");
              console.error("Operation: UPDATE");
              console.error("Payload:", JSON.stringify(update.payload, null, 2));
              console.error("Local Item Object:", JSON.stringify(update.item, null, 2));
              console.error("Responsible File: /src/lib/db.ts");
              console.error("Responsible Function: LocalDB.apiSaveMenuItems");
              console.error("=========================================\n");

              console.error(`[Supabase API Sync Error] Failed to update item ID ${update.id}:`, updateErr);
              throw new Error(`Supabase Update fails: ${updateErr.message}`);
            }
          } catch (err: any) {
            console.error("\n=== [CRITICAL FAILED PAYLOAD TRACER - Exception caught] ===");
            console.error("Operation: UPDATE");
            console.error("Payload:", JSON.stringify(update.payload, null, 2));
            console.error("Local Item Object:", JSON.stringify(update.item, null, 2));
            console.error("Responsible File: /src/lib/db.ts");
            console.error("Responsible Function: LocalDB.apiSaveMenuItems");
            console.error("Exception Message:", err.message);
            console.error("=========================================\n");
            throw err;
          }
        }
      }

      // 5. Perform Inserts
      if (inserts.length > 0) {
        console.log(`[Supabase API Sync] Inserting ${inserts.length} new items...`);
        for (const insert of inserts) {
          const sqlEquivalent = `INSERT INTO public.menu_items (${Object.keys(insert.payload).join(", ")}) VALUES (${Object.values(insert.payload).map(v => JSON.stringify(v)).join(", ")});`;
          const stackTrace = new Error("Stack trace collector").stack || "";

          console.log("\n=== [Supabase Diagnostic Log] Before CREATE ===");
          // Requirement 4: Before executing database query, print whether calling insert() or update()
          console.log("Calling: insert() on table 'menu_items'");
          console.log("Responsible File: /src/lib/db.ts");
          console.log("Responsible Function: LocalDB.apiSaveMenuItems");
          console.log("Operation: CREATE");
          console.log("Payload:", JSON.stringify(insert.payload, null, 2));
          console.log("SQL Equivalent:", sqlEquivalent);
          console.log("ID Target:", insert.payload.id);
          console.log("Stack Trace:\n", stackTrace);

          try {
            const { error: insertErr } = await supabase
              .from("menu_items")
              .insert([insert.payload]);

            console.log("\n=== [Supabase Diagnostic Log] After CREATE ===");
            console.log("Returned ID:", insert.payload.id);
            console.log("Returned Error:", insertErr ? JSON.stringify(insertErr, null, 2) : "None (Success)");

            if (insertErr) {
              // Requirement 5 & 6: Capture the full payload and details of the item triggering the constraint
              console.error("\n=== [CRITICAL FAILED PAYLOAD TRACER] ===");
              console.error("Operation: CREATE (INSERT)");
              console.error("Payload:", JSON.stringify(insert.payload, null, 2));
              console.error("Local Item Object:", JSON.stringify(insert.item, null, 2));
              console.error("Responsible File: /src/lib/db.ts");
              console.error("Responsible Function: LocalDB.apiSaveMenuItems");
              console.error("=========================================\n");

              console.error("[Supabase API Sync Error] Failed to insert new item:", insertErr);
              throw new Error(`Supabase Insert fails: ${insertErr.message}`);
            }
          } catch (err: any) {
            console.error("\n=== [CRITICAL FAILED PAYLOAD TRACER - Exception caught] ===");
            console.error("Operation: CREATE (INSERT)");
            console.error("Payload:", JSON.stringify(insert.payload, null, 2));
            console.error("Local Item Object:", JSON.stringify(insert.item, null, 2));
            console.error("Responsible File: /src/lib/db.ts");
            console.error("Responsible Function: LocalDB.apiSaveMenuItems");
            console.error("Exception Message:", err.message);
            console.error("=========================================\n");
            throw err;
          }
        }
      }

      console.log("[Supabase API Sync Success] Database catalog successfully fully updated and synced.");
      this.saveMenuItems(items);
      this.addAuditLog("Menu Catalog Saved", `Catalog containing ${items.length} dishes updated inside Supabase and local disk.`, "Admin (owner)");
    } catch (err: any) {
      console.error("[Menu Sync Exception]", err);
      // Still save locally so user can continue seamlessly
      this.saveMenuItems(items);
      throw err;
    }
  }

  static async fetchInventory(): Promise<InventoryItem[]> {
    this.incrementApiCallCount("fetchInventory");
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.warn("[Supabase] inventory missing. Falling back to local storage.", error);
        return this.getInventory();
      }

      const mapped: InventoryItem[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        stock: Number(item.stock || 0),
        unit: item.unit || "kg",
        minAlertLevel: Number(item.min_alert_level || 10),
        category: item.category || "Other",
        lastRestocked: item.last_restocked || new Date().toISOString().split("T")[0]
      }));

      this.saveInventory(mapped);
      return mapped;
    } catch {
      return this.getInventory();
    }
  }

  static async apiSaveInventory(inventory: InventoryItem[]): Promise<void> {
    const payload = inventory.map(item => ({
      id: item.id,
      name: item.name,
      stock: Number(item.stock || 0),
      unit: item.unit,
      min_alert_level: Number(item.minAlertLevel || 10),
      category: item.category,
      last_restocked: item.lastRestocked
    }));

    try {
      const { error } = await supabase.from("inventory").upsert(payload);
      if (error) throw error;
      this.saveInventory(inventory);
    } catch (err) {
      console.error("[Supabase Inventory Sync Failed]", err);
      this.saveInventory(inventory);
    }
  }

  static async fetchCoupons(): Promise<Coupon[]> {
    this.incrementApiCallCount("fetchCoupons");
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("code", { ascending: true });

      if (error) {
        console.warn("[Supabase] 'coupons' table missing. Using client defaults.", error);
        return this.getCoupons();
      }

      const mapped: Coupon[] = (data || []).map((item: any) => ({
        code: item.code,
        type: item.type || "percentage",
        value: Number(item.value || 0),
        expiryDate: item.expiry_date || "2200-12-31",
        usageLimit: Number(item.usage_limit || 100),
        usageCount: Number(item.usage_count || 0),
        minOrderAmount: item.min_order_amount ? Number(item.min_order_amount) : undefined
      }));

      this.saveCoupons(mapped);
      return mapped;
    } catch {
      return this.getCoupons();
    }
  }

  static async apiSaveCoupons(coupons: Coupon[]): Promise<void> {
    const payload = coupons.map(item => ({
      code: item.code,
      type: item.type,
      value: Number(item.value || 0),
      expiry_date: item.expiryDate,
      usage_limit: Number(item.usageLimit || 100),
      usage_count: Number(item.usageCount || 0),
      min_order_amount: item.minOrderAmount || null
    }));

    try {
      const { error } = await supabase.from("coupons").upsert(payload);
      if (error) throw error;
      this.saveCoupons(coupons);
    } catch (err) {
      console.error("[Supabase Coupons Sync Failed]", err);
      this.saveCoupons(coupons);
    }
  }

  static async fetchReviews(): Promise<Review[]> {
    this.incrementApiCallCount("fetchReviews");
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.warn("[Supabase] 'reviews' query fallback to localStorage.", error);
        return this.getReviews();
      }

      const mapped: Review[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        rating: Number(item.rating || 5),
        date: item.date || new Date().toISOString(),
        comment: item.comment || "",
        avatar: item.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
      }));

      this.saveReviews(mapped);
      return mapped;
    } catch {
      return this.getReviews();
    }
  }

  static async apiPostReview(review: Review): Promise<void> {
    const payload = {
      id: review.id,
      name: review.name,
      rating: Number(review.rating || 5),
      date: review.date,
      comment: review.comment,
      avatar: review.avatar
    };

    try {
      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;
      await this.fetchReviews();
    } catch (err) {
      console.error("[Supabase Review POST Failed]", err);
      const current = this.getReviews();
      current.unshift(review);
      this.saveReviews(current);
    }
  }

  static async apiSaveReviews(reviews: Review[]): Promise<void> {
    const payload = reviews.map(item => ({
      id: item.id,
      name: item.name,
      rating: Number(item.rating || 5),
      date: item.date,
      comment: item.comment,
      avatar: item.avatar
    }));

    try {
      const { error } = await supabase.from("reviews").upsert(payload);
      if (error) throw error;
      this.saveReviews(reviews);
    } catch (err) {
      console.error("[Supabase Reviews Batch Saving Failed]", err);
      this.saveReviews(reviews);
    }
  }

  static async fetchSettings(): Promise<RestaurantSettings> {
    this.incrementApiCallCount("fetchSettings");
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1);

      if (error || !data || data.length === 0) {
        console.warn("[Supabase] Settings fetch fallback.", error);
        return this.getSettings();
      }

      const item = data[0];
      const mapped: RestaurantSettings = {
        name: item.name || "Idli Junction",
        contactNumber: item.contact_number || "+91-96300-13483",
        address: item.address || "",
        businessHours: item.business_hours || "11:00 AM - 11:30 PM DAILY",
        deliveryCharges: Number(item.delivery_charges || 25),
        gstPercentage: Number(item.gst_percentage || 5),
        facebookUrl: item.facebook_url || "https://facebook.com",
        instagramUrl: item.instagram_url || "https://instagram.com",
        twitterUrl: item.twitter_url || "https://twitter.com",
        googleMapsUrl: item.google_maps_url || ""
      };

      this.saveSettings(mapped);
      return mapped;
    } catch {
      return this.getSettings();
    }
  }

  static async apiSaveSettings(settings: RestaurantSettings): Promise<void> {
    const payload = {
      id: "singleton-config", // Keep simple single row config
      name: settings.name,
      contact_number: settings.contactNumber,
      address: settings.address,
      business_hours: settings.businessHours,
      delivery_charges: Number(settings.deliveryCharges || 0),
      gst_percentage: Number(settings.gstPercentage || 0),
      facebook_url: settings.facebookUrl,
      instagram_url: settings.instagramUrl,
      twitter_url: settings.twitterUrl,
      google_maps_url: settings.googleMapsUrl
    };

    try {
      const { error } = await supabase.from("settings").upsert(payload);
      if (error) throw error;
      this.saveSettings(settings);
    } catch (err) {
      console.error("[Supabase Settings save failed]", err);
      this.saveSettings(settings);
    }
  }

  static async fetchAuditLogs(): Promise<AuditLog[]> {
    this.incrementApiCallCount("fetchAuditLogs");
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        console.warn("[Supabase] 'audit_logs' query fallback to localStorage.", error);
        return this.getAuditLogs();
      }

      const mapped: AuditLog[] = (data || []).map((item: any) => ({
        id: item.id,
        timestamp: item.timestamp || new Date().toISOString(),
        user: item.user || "Admin",
        action: item.action || "Log Captured",
        details: item.details || "",
        ipAddress: item.ip_address || "127.0.0.1"
      }));

      localStorage.setItem("ij_audit_logs", JSON.stringify(mapped));
      return mapped;
    } catch {
      return this.getAuditLogs();
    }
  }

  static async apiAddAuditLog(action: string, details: string, user: string = "Admin"): Promise<void> {
    const logId = `log-${Date.now()}`;
    const payload = {
      id: logId,
      timestamp: new Date().toISOString(),
      user: user,
      action: action,
      details: details,
      ip_address: "127.0.0.1"
    };

    try {
      const { error } = await supabase.from("audit_logs").insert(payload);
      if (error) throw error;
      await this.fetchAuditLogs();
    } catch (err) {
      console.error("[Supabase Audit Log POST Failed]", err);
      const logs = this.getAuditLogs();
      logs.unshift({
        id: logId,
        timestamp: payload.timestamp,
        user: payload.user,
        action: payload.action,
        details: payload.details,
        ipAddress: payload.ip_address
      });
      localStorage.setItem("ij_audit_logs", JSON.stringify(logs));
    }
  }

  // --- KOT DATABASE SYSTEM OPERATIONS ---
  static getKOTs(): KOT[] {
    const stored = localStorage.getItem("ij_kots");
    if (!stored) {
      // Seed with fallback mock KOTs matching existing active mock orders for initial realism
      const fallbackKOTs: KOT[] = [];
      localStorage.setItem("ij_kots", JSON.stringify(fallbackKOTs));
      return fallbackKOTs;
    }
    return JSON.parse(stored);
  }

  static saveKOTs(kots: KOT[]): void {
    localStorage.setItem("ij_kots", JSON.stringify(kots));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("kots_updated"));
  }

  static async fetchKOTs(): Promise<KOT[]> {
    console.log("[Supabase API Request] Loading KOT list...");
    try {
      const { data, error, status } = await supabase
        .from("kots")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] 'kots' query fallback to localStorage.", error);
        return this.getKOTs();
      }

      const mapped: KOT[] = (data || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        tableNumber: item.table_number || "Takeaway",
        customerName: item.customer_name || "Guest User",
        orderType: item.order_type || "takeaway",
        status: item.status || "New Order",
        specialInstructions: item.special_instructions || "None",
        createdAt: item.created_at || new Date().toISOString(),
        preparationTime: Number(item.preparation_time || 15),
        printed: item.printed !== undefined ? !!item.printed : false,
        items: Array.isArray(item.items) ? item.items : (typeof item.items === 'string' ? JSON.parse(item.items) : [])
      }));

      this.saveKOTs(mapped);
      return mapped;
    } catch (err) {
      console.error("[KOT Transport Sync Error]", err);
      return this.getKOTs();
    }
  }

  static async apiAddKOT(kot: KOT): Promise<KOT> {
    const payload = {
      id: kot.id,
      order_id: kot.orderId,
      table_number: kot.tableNumber,
      customer_name: kot.customerName,
      order_type: kot.orderType,
      status: kot.status,
      special_instructions: kot.specialInstructions,
      created_at: kot.createdAt,
      preparation_time: Number(kot.preparationTime),
      printed: kot.printed || false,
      items: kot.items
    };

    try {
      const { error } = await supabase.from("kots").insert(payload);
      if (error) {
        console.error("[Supabase KOT insertion failed]", error);
      }
    } catch (err) {
      console.error("[Supabase KOT connection failed]", err);
    }

    const kots = this.getKOTs();
    // check unique
    if (!kots.some(k => k.id === kot.id)) {
      kots.unshift({ ...kot, printed: kot.printed || false });
      this.saveKOTs(kots);
    }

    return kot;
  }

  static async apiUpdateKOTPrinted(kotId: string, printed: boolean): Promise<void> {
    console.log(`[Supabase API Request] Updating KOT ${kotId} printed status to ${printed}`);
    try {
      const { error } = await supabase
        .from("kots")
        .update({ printed })
        .eq("id", kotId);
      
      if (error) {
        console.error("[Supabase KOT Printed update failed]", error);
      }

      // Update in local cache
      const kots = this.getKOTs();
      const kotIdx = kots.findIndex(k => k.id === kotId);
      if (kotIdx !== -1) {
        kots[kotIdx].printed = printed;
        this.saveKOTs(kots);
      }
    } catch (err) {
      console.error("[KOT printed update exception]", err);
      // Fallback update in local cache
      const kots = this.getKOTs();
      const kotIdx = kots.findIndex(k => k.id === kotId);
      if (kotIdx !== -1) {
        kots[kotIdx].printed = printed;
        this.saveKOTs(kots);
      }
    }
  }

  static async apiUpdateKOTStatus(kotId: string, status: KOTStatus): Promise<void> {
    console.log(`[Supabase API Request] Updating KOT status ${kotId} to ${status}`);
    try {
      const { error } = await supabase
        .from("kots")
        .update({ status })
        .eq("id", kotId);
      
      if (error) {
        console.error("[Supabase KOT Status update failed]", error);
      }

      // Update in local cache
      const kots = this.getKOTs();
      const kotIdx = kots.findIndex(k => k.id === kotId);
      if (kotIdx !== -1) {
        kots[kotIdx].status = status;
        this.saveKOTs(kots);

        // Map KOTStatus to OrderStatus and update linked order status
        const orderId = kots[kotIdx].orderId;
        
        let mappedOrderStatus = status as any;
        if (status === "New Order") mappedOrderStatus = "New Order";
        else if (status === "Accepted") mappedOrderStatus = "Accepted";
        else if (status === "Preparing") mappedOrderStatus = "Preparing";
        else if (status === "Ready") mappedOrderStatus = "Ready";
        else if (status === "Served") mappedOrderStatus = "Delivered";
        else if (status === "Cancelled") mappedOrderStatus = "Cancelled";
        
        await this.apiUpdateOrderStatus(orderId, mappedOrderStatus);
      }
    } catch (err) {
      console.error("[KOT status update exception]", err);
      // Fallback update in local cache
      const kots = this.getKOTs();
      const kotIdx = kots.findIndex(k => k.id === kotId);
      if (kotIdx !== -1) {
        kots[kotIdx].status = status;
        this.saveKOTs(kots);
      }
    }
  }

  static async apiAddOrderItems(orderId: string, items: { menuItemId: string; name: string; price: number; quantity: number; customization?: string }[]): Promise<void> {
    const payloads = items.map((item, index) => ({
      id: `${orderId}-item-${index}-${Date.now()}`,
      order_id: orderId,
      menu_item_id: item.menuItemId,
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      customization: item.customization || ""
    }));

    try {
      const { error } = await supabase.from("order_items").insert(payloads);
      if (error) {
        console.error("[Supabase OrderItems insertion failed]", error);
      }
    } catch (err) {
      console.error("[Supabase OrderItems connection failed]", err);
    }
  }

  static getPrinterLogs(): PrinterEmulatorLog[] {
    const stored = localStorage.getItem("ij_printer_logs");
    if (!stored) {
      localStorage.setItem("ij_printer_logs", JSON.stringify([]));
      return [];
    }
    return JSON.parse(stored);
  }

  static savePrinterLogs(logs: PrinterEmulatorLog[]): void {
    localStorage.setItem("ij_printer_logs", JSON.stringify(logs));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("printer_logs_updated"));
  }

  static async fetchPrinterLogs(): Promise<PrinterEmulatorLog[]> {
    try {
      const { data, error } = await supabase
        .from("printer_emulator_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] 'printer_emulator_logs' table select error:", error);
        return this.getPrinterLogs();
      }

      const mapped: PrinterEmulatorLog[] = (data || []).map((item: any) => ({
        id: item.id,
        kotId: item.kot_id,
        kotNumber: item.kot_number,
        restaurantId: item.restaurant_id,
        receiptText: item.receipt_text,
        printStatus: item.print_status,
        createdAt: item.created_at
      }));

      this.savePrinterLogs(mapped);
      return mapped;
    } catch (err) {
      console.error("[Supabase fetchPrinterLogs failure]:", err);
      return this.getPrinterLogs();
    }
  }

  static async apiAddPrinterLog(log: Omit<PrinterEmulatorLog, "id" | "createdAt">): Promise<PrinterEmulatorLog> {
    const logs = this.getPrinterLogs();
    const newId = `PRT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullLog: PrinterEmulatorLog = {
      ...log,
      id: newId,
      createdAt: new Date().toISOString()
    };

    const payload = {
      id: fullLog.id,
      kot_id: fullLog.kotId,
      kot_number: fullLog.kotNumber,
      restaurant_id: fullLog.restaurantId,
      receipt_text: fullLog.receiptText,
      print_status: fullLog.printStatus,
      created_at: fullLog.createdAt
    };

    try {
      const { error } = await supabase.from("printer_emulator_logs").insert(payload);
      if (error) {
        console.error("[Supabase insertion printer_emulator_logs failed]", error);
      }
    } catch (err) {
      console.error("[Supabase connection printer_emulator_logs failed]", err);
    }

    logs.unshift(fullLog);
    this.savePrinterLogs(logs);
    return fullLog;
  }

  static async apiUpdateOrderPrintStatus(
    orderId: string, 
    type: "kot" | "bill", 
    status: "Pending" | "Printing" | "Printed" | "Failed"
  ): Promise<void> {
    console.log(`[LocalDB] Updating ${type} print status for order ${orderId} to ${status}`);
    try {
      const orders = this.getOrders();
      const orderIdx = orders.findIndex(o => o.id === orderId);
      if (orderIdx !== -1) {
        const order = orders[orderIdx];
        if (type === "kot") {
          order.kotPrintStatus = status;
          order.kotPrintTimestamp = new Date().toISOString();
        } else {
          order.billPrintStatus = status;
          order.billPrintTimestamp = new Date().toISOString();
        }
        this.saveOrders(orders);
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("[LocalDB Exception updating print status]", err);
    }
  }

  static parsePaymentDetails(paymentMode: string | undefined): { [key: string]: number } | null {
    if (!paymentMode || !paymentMode.startsWith("Split:")) return null;
    const parts = paymentMode.replace("Split:", "").split(",");
    const details: { [key: string]: number } = {};
    parts.forEach(p => {
      const [mode, amt] = p.split("=");
      if (mode && amt) {
        details[mode.trim()] = parseFloat(amt.trim()) || 0;
      }
    });
    return details;
  }

  static formatPaymentDetails(details: { [key: string]: number }): string {
    const parts = Object.entries(details)
      .filter(([_, amt]) => amt > 0)
      .map(([mode, amt]) => `${mode}=${amt}`);
    return `Split: ${parts.join(", ")}`;
  }
}

