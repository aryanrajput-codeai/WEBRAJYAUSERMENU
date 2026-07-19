import { MenuItem, Review, KOT, KOTStatus, OrderItem, RestaurantTable, PrinterEmulatorLog, Category } from "../types";
import { createClient } from "@supabase/supabase-js";
import { getSessionRestaurantId } from "./restaurantSession";

const dummyChain: any = {
  from: () => dummyChain,
  select: () => dummyChain,
  insert: () => Promise.resolve({ data: [], error: null }),
  update: () => dummyChain,
  delete: () => dummyChain,
  eq: () => dummyChain,
  order: () => dummyChain,
  limit: () => dummyChain,
  upsert: () => Promise.resolve({ data: [], error: null }),
  channel: () => dummyChain,
  on: () => dummyChain,
  subscribe: () => dummyChain,
  removeChannel: () => dummyChain,
  then: (resolve: any) => resolve({ data: [], error: null }),
};

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: any = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : dummyChain;

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

const defaultInventory: InventoryItem[] = [];
const defaultCoupons: Coupon[] = [];
const defaultSettings: RestaurantSettings = {
  name: "WebRajya POS",
  contactNumber: "",
  address: "",
  businessHours: "",
  deliveryCharges: 0,
  gstPercentage: 0,
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  googleMapsUrl: ""
};
const defaultAuditLogs: AuditLog[] = [];
const defaultCategories: Category[] = [];
const defaultMenuItems: MenuItem[] = [];

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
  static cachedRestaurantId: string | null = null;

  static incrementApiCallCount(apiName: string) {
    this.apiCallCount++;
    console.log(`[Supabase API Call Count] Total calls: ${this.apiCallCount} (Triggered by: ${apiName})`);
  }

  static isValidUUID(str: string | undefined | null): boolean {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  static async getValidRestaurantId(): Promise<string | null> {
    // Read from active restaurant session
    const sessionId = getSessionRestaurantId();
    if (sessionId) return sessionId;

    // Fallback: check localStorage for legacy stored restaurant_id
    const stored = localStorage.getItem('wr_restaurant_id');
    if (stored) return stored;

    // Last resort: return null (caller must handle gracefully)
    return null;
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
    try {
      const orders = JSON.parse(stored) as Order[];
      const seenIds = new Set<string>();
      let hasDuplicates = false;
      const cleanOrders = orders.map((o, idx) => {
        if (!o.id || seenIds.has(o.id)) {
          hasDuplicates = true;
          let base = 1000 + idx;
          let newId = `SR-${base}`;
          while (seenIds.has(newId)) {
            base += Math.floor(Math.random() * 10) + 1;
            newId = `SR-${base}`;
          }
          o.id = newId;
        }
        seenIds.add(o.id);
        return o;
      });
      if (hasDuplicates) {
        localStorage.setItem("ij_orders", JSON.stringify(cleanOrders));
      }
      return cleanOrders;
    } catch (_) {
      return [];
    }
  }

  static saveOrders(orders: Order[]): void {
    localStorage.setItem("ij_orders", JSON.stringify(orders));
    window.dispatchEvent(new Event("storage"));
  }

  static getTables(): RestaurantTable[] {
    const stored = localStorage.getItem("ij_tables");
    if (!stored) {
      localStorage.setItem("ij_tables", JSON.stringify([]));
      return [];
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
    const existingIds = new Set(orders.map(o => o.id));
    let baseId = 1000 + orders.length;
    let newId = `SR-${baseId}`;
    while (existingIds.has(newId)) {
      baseId += Math.floor(Math.random() * 10) + 1;
      newId = `SR-${baseId}`;
    }
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
      const orders = this.getOrders();
      const updated = orders.map(o => {
        if (o.id === orderId) {
          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const gst = Math.round(subtotal * 0.05);
          const grandTotal = subtotal + gst;
          return {
            ...o,
            items,
            subtotal,
            gst,
            grandTotal,
            timeline: timeline || o.timeline,
            addOnCount: addOnCount !== undefined ? addOnCount : o.addOnCount
          };
        }
        return o;
      });
      this.saveOrders(updated);
    } catch (err) {
      console.error("[Local DB Sync Timeline and Items failed]", err);
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
    return this.getOrders();
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
      const registeredTables = this.getTables().map(t => t.tableNumber);
      if (!registeredTables.includes(order.tableNumber)) {
        throw new Error(`Invalid QR Code Source: Table number #${order.tableNumber} is not registered in our dining area.`);
      }

      // Check if table already has an active unpaid order
      const activeOrder = this.getActiveOrderForTable(order.tableNumber);
      if (activeOrder) {
        return this.apiMergeIntoExistingOrder(activeOrder, order.items, (order as any).billedBy || "Waiter");
      }
    }

    const orders = this.getOrders();
    const existingIds = new Set(orders.map(o => o.id));
    let baseId = 1000 + orders.length;
    let newId = `SR-${baseId}`;
    while (existingIds.has(newId)) {
      baseId += Math.floor(Math.random() * 10) + 1;
      newId = `SR-${baseId}`;
    }
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

    // Save order and KOT locally with zero Supabase dependencies
    
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
    console.log(`[LocalDB] Updating Order ${orderId} payment details: Mode=${paymentMode}, Status=${paymentStatus}`);
    
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

    return orderCopy || (current[idx] || { id: orderId, paymentMode, paymentStatus } as any);
  }

  static async apiUpdateOrderStatus(orderId: string, status: Order["orderStatus"], paymentStatus?: string): Promise<Order> {
    console.log(`[LocalDB] Updating Order ${orderId} status to ${status}`);
    
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
      window.dispatchEvent(new Event("storage"));
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
    this.supportedColumns = candidateColumns;
    return candidateColumns;
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
    return this.getMenuItems();
  }

  static async apiSaveMenuItems(items: MenuItem[]): Promise<void> {
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
    return this.getInventory();
  }

  static async apiSaveInventory(inventory: InventoryItem[]): Promise<void> {
    this.saveInventory(inventory);
  }

  static async fetchCoupons(): Promise<Coupon[]> {
    return this.getCoupons();
  }

  static async apiSaveCoupons(coupons: Coupon[]): Promise<void> {
    this.saveCoupons(coupons);
  }

  static async fetchReviews(): Promise<Review[]> {
    return this.getReviews();
  }

  static async apiPostReview(review: Review): Promise<void> {
    const current = this.getReviews();
    if (!current.some(r => r.id === review.id)) {
      current.unshift(review);
      this.saveReviews(current);
    }
  }

  static async apiSaveReviews(reviews: Review[]): Promise<void> {
    this.saveReviews(reviews);
  }

  static async fetchSettings(): Promise<RestaurantSettings> {
    return this.getSettings();
  }

  static async apiSaveSettings(settings: RestaurantSettings): Promise<void> {
    this.saveSettings(settings);
  }

  static async fetchAuditLogs(): Promise<AuditLog[]> {
    return this.getAuditLogs();
  }

  static async apiAddAuditLog(action: string, details: string, user: string = "Admin"): Promise<void> {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      details,
      ipAddress: "127.0.0.1"
    });
    localStorage.setItem("ij_audit_logs", JSON.stringify(logs));
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
    return this.getKOTs();
  }

  static async apiAddKOT(kot: KOT): Promise<KOT> {
    const kots = this.getKOTs();
    if (!kots.some(k => k.id === kot.id)) {
      kots.unshift({ ...kot, printed: kot.printed || false });
      this.saveKOTs(kots);
    }
    return kot;
  }

  static async apiUpdateKOTPrinted(kotId: string, printed: boolean): Promise<void> {
    const kots = this.getKOTs();
    const kotIdx = kots.findIndex(k => k.id === kotId);
    if (kotIdx !== -1) {
      kots[kotIdx].printed = printed;
      this.saveKOTs(kots);
    }
  }

  static async apiUpdateKOTStatus(kotId: string, status: KOTStatus): Promise<void> {
    const kots = this.getKOTs();
    const kotIdx = kots.findIndex(k => k.id === kotId);
    if (kotIdx !== -1) {
      kots[kotIdx].status = status;
      this.saveKOTs(kots);

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
  }

  static async apiAddOrderItems(orderId: string, items: { menuItemId: string; name: string; price: number; quantity: number; customization?: string }[]): Promise<void> {
    // Purely local-first
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
    return this.getPrinterLogs();
  }

  static async apiAddPrinterLog(log: Omit<PrinterEmulatorLog, "id" | "createdAt">): Promise<PrinterEmulatorLog> {
    const logs = this.getPrinterLogs();
    const newId = `PRT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullLog: PrinterEmulatorLog = {
      ...log,
      id: newId,
      createdAt: new Date().toISOString()
    };
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

