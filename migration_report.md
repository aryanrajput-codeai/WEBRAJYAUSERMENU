# WebRajya POS SaaS Migration Audit Report

Generated at: 2026-07-19T14:25:44.806Z

This report outlines all occurrences of `LocalDB`, `localStorage`, mock/demo data, and fallback arrays across the source files. These must be replaced with direct Supabase calls.

## Summary of Audit Matches

| File Path | Match Count |
| :--- | :--- |
| [audit_project.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/audit_project.ts) | 13 |
| [server.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/server.ts) | 6 |
| [App.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/App.tsx) | 9 |
| [AdminDashboard.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/AdminDashboard.tsx) | 96 |
| [AdminLogin.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/AdminLogin.tsx) | 12 |
| [BulkMenuImporter.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/BulkMenuImporter.tsx) | 10 |
| [CartOverlay.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/CartOverlay.tsx) | 9 |
| [KitchenDashboard.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/KitchenDashboard.tsx) | 8 |
| [LiveKotMonitor.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/LiveKotMonitor.tsx) | 8 |
| [MobileView.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/MobileView.tsx) | 13 |
| [PosBillingPortal.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/PosBillingPortal.tsx) | 20 |
| [PrintersConfigTab.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/PrintersConfigTab.tsx) | 1 |
| [VirtualPrinterCenter.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/VirtualPrinterCenter.tsx) | 9 |
| [db.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/lib/db.ts) | 68 |
| [printQueueManager.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/lib/printQueueManager.ts) | 20 |
| [printerService.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/lib/printerService.ts) | 3 |
| [restaurantSession.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/lib/restaurantSession.ts) | 6 |
| [App.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/App.tsx) | 28 |
| [DashboardView.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/components/DashboardView.tsx) | 1 |
| [supabase.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/supabase.ts) | 2 |
| [supabaseDb.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/supabaseDb.ts) | 19 |
| [mockData.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/utils/mockData.ts) | 26 |

---

## Detailed Occurrences by File

### [webrajya-only-pos (1)/audit_project.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/audit_project.ts)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 7 | `LocalDB` | `"LocalDB",` |
| 8 | `localStorage` | `"localStorage",` |
| 9 | `mock` | `"mock",` |
| 10 | `demo` | `"demo",` |
| 11 | `defaultCategories` | `"defaultCategories",` |
| 12 | `defaultMenuItems` | `"defaultMenuItems",` |
| 13 | `defaultAuditLogs` | `"defaultAuditLogs",` |
| 14 | `defaultOrders` | `"defaultOrders",` |
| 15 | `dbStore` | `"dbStore"` |
| 72 | `LocalDB` | `report += `This report outlines all occurrences of \`LocalDB\`, \`localStorage\`, mock/demo data, and fallback arrays across the source files. These must be replaced with direct Supabase calls.\n\n`;` |
| 72 | `localStorage` | `report += `This report outlines all occurrences of \`LocalDB\`, \`localStorage\`, mock/demo data, and fallback arrays across the source files. These must be replaced with direct Supabase calls.\n\n`;` |
| 72 | `mock` | `report += `This report outlines all occurrences of \`LocalDB\`, \`localStorage\`, mock/demo data, and fallback arrays across the source files. These must be replaced with direct Supabase calls.\n\n`;` |
| 72 | `demo` | `report += `This report outlines all occurrences of \`LocalDB\`, \`localStorage\`, mock/demo data, and fallback arrays across the source files. These must be replaced with direct Supabase calls.\n\n`;` |

### [webrajya-only-pos (1)/server.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/server.ts)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 6 | `defaultMenuItems` | `import { menuItems as defaultMenuItems, reviews as defaultReviews } from "./db-store.json";` |
| 94 | `defaultAuditLogs` | `const defaultAuditLogs = [` |
| 102 | `defaultMenuItems` | `menuItems: defaultMenuItems,` |
| 107 | `defaultAuditLogs` | `auditLogs: defaultAuditLogs` |
| 119 | `defaultMenuItems` | `menuItems: defaultMenuItems,` |
| 124 | `defaultAuditLogs` | `auditLogs: defaultAuditLogs` |

### [webrajya-only-pos (1)/src/App.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/App.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 4 | `LocalDB` | `import { LocalDB } from "./lib/db";` |
| 11 | `localStorage` | `const localToken = localStorage.getItem("ij_admin_jwt");` |
| 18 | `localStorage` | `localStorage.removeItem("ij_admin_jwt");` |
| 34 | `localStorage` | `// Persist restaurant_id to localStorage for legacy components` |
| 35 | `localStorage` | `localStorage.setItem("wr_restaurant_id", session.restaurantId);` |
| 37 | `LocalDB` | `await LocalDB.fetchMenuItems();` |
| 47 | `localStorage` | `localStorage.setItem("ij_admin_jwt", token);` |
| 56 | `localStorage` | `localStorage.removeItem("ij_admin_jwt");` |
| 59 | `localStorage` | `localStorage.removeItem("wr_restaurant_id");` |

### [webrajya-only-pos (1)/src/components/AdminDashboard.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/AdminDashboard.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 11 | `LocalDB` | `import { LocalDB, Order, Coupon, InventoryItem, AuditLog, RestaurantSettings } from "../lib/db";` |
| 36 | `LocalDB` | `const [settings, setSettings] = useState&lt;RestaurantSettings&gt;(() =&gt; LocalDB.getSettings());` |
| 39 | `LocalDB` | `const [categoriesList, setCategoriesList] = useState&lt;Category[]&gt;(() =&gt; LocalDB.getCategories());` |
| 90 | `localStorage` | `const [autoPrintEnabled, setAutoPrintEnabled] = useState&lt;boolean&gt;(() =&gt; localStorage.getItem("ij_auto_print_enabled") !== "false");` |
| 124 | `LocalDB` | `const currentOrders = await LocalDB.fetchOrders();` |
| 194 | `LocalDB` | `await LocalDB.saveOrders(updatedOrders);` |
| 211 | `LocalDB` | `const currentKots = await LocalDB.fetchKOTs();` |
| 212 | `LocalDB` | `await LocalDB.saveKOTs([k, ...currentKots]);` |
| 547 | `LocalDB` | `LocalDB.apiAddAuditLog("Manual Downloaded", "WebRajya POS Staff User Manual downloaded as PDF");` |
| 553 | `localStorage` | `// Load state from server/localStorage on boot and poll periodically` |
| 581 | `LocalDB` | `const freshOrders = await LocalDB.fetchOrders();` |
| 619 | `LocalDB` | `const ords = await LocalDB.fetchOrders();` |
| 622 | `LocalDB` | `setOrders(LocalDB.getOrders());` |
| 625 | `LocalDB` | `const items = await LocalDB.fetchMenuItems();` |
| 628 | `LocalDB` | `setMenuItems(LocalDB.getMenuItems());` |
| 631 | `LocalDB` | `const inv = await LocalDB.fetchInventory();` |
| 634 | `LocalDB` | `setInventory(LocalDB.getInventory());` |
| 637 | `LocalDB` | `const cps = await LocalDB.fetchCoupons();` |
| 640 | `LocalDB` | `setCoupons(LocalDB.getCoupons());` |
| 643 | `LocalDB` | `const revs = await LocalDB.fetchReviews();` |
| 646 | `LocalDB` | `setReviews(LocalDB.getReviews());` |
| 649 | `LocalDB` | `const sts = await LocalDB.fetchSettings();` |
| 652 | `LocalDB` | `setSettings(LocalDB.getSettings());` |
| 655 | `LocalDB` | `const logs = await LocalDB.fetchAuditLogs();` |
| 658 | `LocalDB` | `setAuditLogs(LocalDB.getAuditLogs());` |
| 661 | `LocalDB` | `setTables(LocalDB.getTables());` |
| 666 | `LocalDB` | `setCategoriesList(LocalDB.getCategories());` |
| 678 | `LocalDB` | `LocalDB.addAuditLog("Auto Logout", "Session terminated due to 10 minutes of inactivity", "Secure Gate");` |
| 811 | `LocalDB` | `LocalDB.addAuditLog("Data Backup Export", `Exported document file: ${filename}.csv`, "Admin");` |
| 857 | `LocalDB` | `const dbKots = await LocalDB.fetchKOTs();` |
| 877 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "kot", "Printing");` |
| 880 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "kot", "Printed");` |
| 881 | `LocalDB` | `await LocalDB.apiAddAuditLog("KOT Reprinted", `KOT printed manually for Order: ${showBillPrint.id}`);` |
| 883 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "kot", "Failed");` |
| 887 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "bill", "Printing");` |
| 890 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "bill", "Printed");` |
| 891 | `LocalDB` | `await LocalDB.apiAddAuditLog("Receipt Printed", `Bill printed manually for Order: ${showBillPrint.id}`);` |
| 893 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "bill", "Failed");` |
| 898 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "kot", "Printing");` |
| 899 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "bill", "Pending");` |
| 905 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "kot", "Failed");` |
| 906 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "bill", "Failed");` |
| 910 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "kot", "Printed");` |
| 911 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "bill", "Printing");` |
| 920 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "bill", "Failed");` |
| 924 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, "bill", "Printed");` |
| 925 | `LocalDB` | `await LocalDB.apiAddAuditLog("Sequential Print", `KOT & Bill printed sequentially for Order: ${showBillPrint.id}`);` |
| 929 | `LocalDB` | `const updatedOrders = await LocalDB.fetchOrders();` |
| 947 | `LocalDB` | `await LocalDB.apiUpdateOrderStatus(orderId, status);` |
| 979 | `LocalDB` | `await LocalDB.apiAddAuditLog("Menu Item Edited", `Pricing/Details modified for dish: ${editingMenuItem.name}`);` |
| 998 | `LocalDB` | `await LocalDB.apiAddAuditLog("Menu Item Created", `New dish added: ${newItem.name} (₹${newItem.price})`);` |
| 1002 | `LocalDB` | `await LocalDB.apiSaveMenuItems(updatedList);` |
| 1015 | `LocalDB` | `await LocalDB.apiSaveMenuItems(updated);` |
| 1016 | `LocalDB` | `await LocalDB.apiAddAuditLog("Menu Item Deleted", `Permanently wiped: ${itemName}`);` |
| 1044 | `LocalDB` | `LocalDB.saveCategories(updated);` |
| 1045 | `LocalDB` | `LocalDB.addAuditLog("Category Created", `New category deployed: ${newCat.name} (${newCat.id})`);` |
| 1061 | `LocalDB` | `LocalDB.saveCategories(updated);` |
| 1062 | `LocalDB` | `LocalDB.addAuditLog("Category Updated", `Category details modified: ${editingCategory.name} (${editingCategory.id})`);` |
| 1071 | `LocalDB` | `LocalDB.saveCategories(updated);` |
| 1072 | `LocalDB` | `LocalDB.addAuditLog("Category Deleted", `Permanently wiped category: ${catName} (${catId})`);` |
| 1087 | `LocalDB` | `await LocalDB.apiAddAuditLog("Coupon Updated", `Code: ${editingCoupon.code} modified parameters`);` |
| 1100 | `LocalDB` | `await LocalDB.apiAddAuditLog("Coupon Created", `New reward code launched: ${newC.code}`);` |
| 1104 | `LocalDB` | `await LocalDB.apiSaveCoupons(list);` |
| 1117 | `LocalDB` | `await LocalDB.apiSaveCoupons(updated);` |
| 1118 | `LocalDB` | `await LocalDB.apiAddAuditLog("Coupon Suspended", `Deactivated coupon: ${code}`);` |
| 1140 | `LocalDB` | `await LocalDB.apiSaveInventory(updated);` |
| 1141 | `LocalDB` | `await LocalDB.apiAddAuditLog("Inventory Restocked", `Brought in +${restockAmount} ${selectedInventoryItem.unit} of ${selectedInventoryItem.name}`);` |
| 1154 | `LocalDB` | `await LocalDB.apiSaveReviews(updated);` |
| 1155 | `LocalDB` | `await LocalDB.apiAddAuditLog("Review Moderated", `Approved status toggled for review #${reviewId}`);` |
| 1166 | `LocalDB` | `await LocalDB.apiSaveReviews(updated);` |
| 1167 | `LocalDB` | `await LocalDB.apiAddAuditLog("Review Moderated", `Featured tag toggled for review ${reviewId}`);` |
| 1179 | `LocalDB` | `await LocalDB.apiSaveReviews(updated);` |
| 1180 | `LocalDB` | `await LocalDB.apiAddAuditLog("Review Deleted", `Wiped review ledger id ${reviewId}`);` |
| 1192 | `LocalDB` | `await LocalDB.apiSaveSettings(settings);` |
| 1193 | `LocalDB` | `await LocalDB.apiAddAuditLog("Settings Adjusted", `Restaurant operating variables synchronized`);` |
| 1221 | `LocalDB` | `LocalDB.saveTables(updated);` |
| 1231 | `LocalDB` | `LocalDB.addAuditLog("Table Created", `Added restaurant Table #${newTbl.tableNumber} with capacity of ${newTbl.capacity}`, "Admin Panel");` |
| 1239 | `LocalDB` | `LocalDB.saveTables(updated);` |
| 1245 | `LocalDB` | `LocalDB.addAuditLog("Table Status Updated", `Updated Table ID ${tableId} status to ${status}`, "Admin Panel");` |
| 1257 | `LocalDB` | `LocalDB.saveTables(updated);` |
| 1264 | `LocalDB` | `LocalDB.addAuditLog("Table Deleted", `Removed Table #${tableToDelete.tableNumber} from table list`, "Admin Panel");` |
| 1394 | `LocalDB` | `LocalDB.addAuditLog("Admin Logout", "Authorized admin logout triggered manually", "Admin");` |
| 1544 | `LocalDB` | `setOrders(LocalDB.getOrders());` |
| 1607 | `localStorage` | `localStorage.setItem("ij_auto_print_enabled", String(nextVal));` |
| 1781 | `LocalDB` | `LocalDB.addAuditLog("Order History Refresh", "Manually pulled fresh order logs from database.", "Admin");` |
| 2888 | `mock` | `Select a table to review and download its dynamic self-ordering QR sheet or stand cardboard mockup.` |
| 3103 | `mock` | `// Generate the live HTML receipt mockup!` |
| 3194 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, dbFieldName, "Printing");` |
| 3218 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, dbFieldName, "Printed");` |
| 3219 | `LocalDB` | `await LocalDB.apiAddAuditLog("Receipt Printed", `Premium ${targetType.toUpperCase()} ticket dispatched via Print Dialog for Order: ${showBillPrint.id}`);` |
| 3228 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, dbFieldName, "Printed");` |
| 3229 | `LocalDB` | `await LocalDB.apiAddAuditLog("Receipt Printed", `Premium ${targetType.toUpperCase()} sent to direct physical hardware for Order: ${showBillPrint.id}`);` |
| 3231 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(showBillPrint.id, dbFieldName, "Failed");` |
| 3237 | `LocalDB` | `const updatedOrders = await LocalDB.fetchOrders();` |
| 4000 | `LocalDB` | `const items = await LocalDB.fetchMenuItems();` |
| 4003 | `LocalDB` | `setMenuItems(LocalDB.getMenuItems());` |

### [webrajya-only-pos (1)/src/components/AdminLogin.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/AdminLogin.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 4 | `LocalDB` | `import { LocalDB, supabase, isSupabaseConfigured } from "../lib/db";` |
| 27 | `localStorage` | `const savedEmail = localStorage.getItem("ij_admin_remember_email");` |
| 86 | `localStorage` | `// Also save to localStorage for legacy components` |
| 87 | `localStorage` | `localStorage.setItem("wr_restaurant_id", restaurantRow.id);` |
| 105 | `demo` | `// Save a demo session` |
| 106 | `localStorage` | `const sessionRestId = localStorage.getItem("wr_restaurant_id") \|\| "restaurant-demo";` |
| 106 | `demo` | `const sessionRestId = localStorage.getItem("wr_restaurant_id") \|\| "restaurant-demo";` |
| 162 | `localStorage` | `localStorage.setItem("ij_admin_remember_email", email);` |
| 164 | `localStorage` | `localStorage.removeItem("ij_admin_remember_email");` |
| 167 | `LocalDB` | `LocalDB.addAuditLog("Admin Authorized", `Owner admin logged in via ${isSupabaseConfigured ? "Supabase Auth" : "local fallback"}`, "Admin");` |
| 173 | `LocalDB` | `LocalDB.addAuditLog("Access Denied", `Failed login attempt for account ${email}`, "System Gateway");` |
| 217 | `demo` | `{isSupabaseConfigured ? "Supabase Auth secured connection" : "Local demo mode active"}` |

### [webrajya-only-pos (1)/src/components/BulkMenuImporter.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/BulkMenuImporter.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 8 | `LocalDB` | `import { LocalDB, supabase } from "../lib/db";` |
| 115 | `LocalDB` | `const items = await LocalDB.fetchMenuItems();` |
| 120 | `LocalDB` | `setExistingItems(LocalDB.getMenuItems());` |
| 250 | `LocalDB` | `categoryId = LocalDB.findMatchingCategoryId(String(rawCategory));` |
| 692 | `LocalDB` | `const supported = await LocalDB.detectSupportedColumns();` |
| 700 | `LocalDB` | `latestDbItems = await LocalDB.fetchMenuItems();` |
| 750 | `LocalDB` | `const payload = LocalDB.mapMenuItemForInsert(mappedItem, supported);` |
| 900 | `LocalDB` | `LocalDB.addAuditLog(` |
| 917 | `LocalDB` | `await LocalDB.fetchMenuItems();` |
| 943 | `LocalDB` | `LocalDB.addAuditLog(` |

### [webrajya-only-pos (1)/src/components/CartOverlay.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/CartOverlay.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 17 | `LocalDB` | `import { LocalDB } from "../lib/db";` |
| 49 | `LocalDB` | `const [pastOrders, setPastOrders] = useState&lt;any[]&gt;(() =&gt; LocalDB.getOrders());` |
| 53 | `LocalDB` | `setPastOrders(LocalDB.getOrders());` |
| 64 | `LocalDB` | `const menuItems = LocalDB.getMenuItems();` |
| 82 | `localStorage` | `localStorage.setItem("ij_scanned_table", tableVal);` |
| 83 | `localStorage` | `localStorage.setItem("ij_is_qr_scanned", "true");` |
| 85 | `localStorage` | `tableVal = localStorage.getItem("ij_scanned_table");` |
| 150 | `localStorage` | `const storedTable = localStorage.getItem("ij_scanned_table");` |
| 213 | `LocalDB` | `const savedOrder = await LocalDB.apiAddOrder(orderData);` |

### [webrajya-only-pos (1)/src/components/KitchenDashboard.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/KitchenDashboard.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 3 | `LocalDB` | `import { LocalDB, supabase } from "../lib/db";` |
| 120 | `LocalDB` | `const dbKots = await LocalDB.fetchKOTs();` |
| 216 | `LocalDB` | `const allOrders = await LocalDB.fetchOrders();` |
| 229 | `LocalDB` | `const settings = LocalDB.getSettings();` |
| 266 | `LocalDB` | `await LocalDB.apiUpdateKOTPrinted(kot.id, true);` |
| 308 | `LocalDB` | `await LocalDB.apiUpdateKOTPrinted(kot.id, true);` |
| 324 | `LocalDB` | `await LocalDB.apiUpdateKOTPrinted(kot.id, true);` |
| 347 | `LocalDB` | `await LocalDB.apiUpdateKOTStatus(kotId, nextStatus);` |

### [webrajya-only-pos (1)/src/components/LiveKotMonitor.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/LiveKotMonitor.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 21 | `LocalDB` | `import { LocalDB, supabase } from "../lib/db";` |
| 36 | `LocalDB` | `const data = await LocalDB.fetchKOTs();` |
| 42 | `LocalDB` | `setKots(LocalDB.getKOTs());` |
| 51 | `localStorage` | `// Handle updates from localStorage or sync actions` |
| 140 | `LocalDB` | `await LocalDB.apiUpdateKOTPrinted(kot.id, true);` |
| 165 | `LocalDB` | `await LocalDB.apiAddPrinterLog({` |
| 168 | `localStorage` | `restaurantId: getSessionRestaurantId() \|\| localStorage.getItem('wr_restaurant_id') \|\| 'restaurant-demo',` |
| 168 | `demo` | `restaurantId: getSessionRestaurantId() \|\| localStorage.getItem('wr_restaurant_id') \|\| 'restaurant-demo',` |

### [webrajya-only-pos (1)/src/components/MobileView.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/MobileView.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 32 | `defaultCategories` | `import { categories as defaultCategories } from "../data";` |
| 33 | `LocalDB` | `import { LocalDB } from "../lib/db";` |
| 88 | `localStorage` | `localStorage.setItem("ij_scanned_table", tableVal);` |
| 89 | `localStorage` | `localStorage.setItem("ij_is_qr_scanned", "true");` |
| 91 | `localStorage` | `tableVal = localStorage.getItem("ij_scanned_table");` |
| 149 | `LocalDB` | `const [pastOrdersMobile, setPastOrdersMobile] = useState&lt;any[]&gt;(() =&gt; LocalDB.getOrders());` |
| 153 | `LocalDB` | `setPastOrdersMobile(LocalDB.getOrders());` |
| 201 | `mock` | `!["milkshakes", "mocktails", "tea-coffee", "refreshers"].includes(` |
| 232 | `LocalDB` | `const list = LocalDB.getCategories();` |
| 242 | `mock` | `const hasDrinks = list.some(c =&gt; ["milkshakes", "mocktails", "tea-coffee", "refreshers"].includes(c.id));` |
| 250 | `mock` | `if (!["idli", "uttapam", "dosa", "milkshakes", "mocktails", "tea-coffee", "refreshers"].includes(c.id)) {` |
| 264 | `localStorage` | `const storedTable = localStorage.getItem("ij_scanned_table");` |
| 325 | `LocalDB` | `const savedOrder = await LocalDB.apiAddOrder(orderData);` |

### [webrajya-only-pos (1)/src/components/PosBillingPortal.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/PosBillingPortal.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 8 | `LocalDB` | `import { LocalDB, Order, Coupon, InventoryItem, AuditLog, RestaurantSettings, supabase } from "../lib/db";` |
| 257 | `LocalDB` | `LocalDB.addAuditLog(` |
| 330 | `LocalDB` | `LocalDB.addAuditLog(` |
| 349 | `LocalDB` | `LocalDB.addAuditLog(` |
| 365 | `LocalDB` | `LocalDB.addAuditLog(` |
| 402 | `LocalDB` | `LocalDB.addAuditLog(` |
| 418 | `LocalDB` | `LocalDB.addAuditLog(` |
| 433 | `LocalDB` | `LocalDB.addAuditLog(` |
| 477 | `LocalDB` | `finalPaymentMode = LocalDB.formatPaymentDetails(splitAmounts);` |
| 488 | `LocalDB` | `const uniqueKotNo = `KOT-${String(LocalDB.getKOTs().length + 1).padStart(4, "0")}`;` |
| 491 | `LocalDB` | `// Formulate Order Object for LocalDB saving` |
| 508 | `LocalDB` | `const validRestId = await LocalDB.getValidRestaurantId();` |
| 572 | `LocalDB` | `const currentOrders = LocalDB.getOrders();` |
| 574 | `LocalDB` | `LocalDB.saveOrders(currentOrders);` |
| 589 | `LocalDB` | `const currentKots = LocalDB.getKOTs();` |
| 591 | `LocalDB` | `LocalDB.saveKOTs(currentKots);` |
| 594 | `LocalDB` | `LocalDB.addAuditLog(` |
| 602 | `LocalDB` | `const dbTables = LocalDB.getTables();` |
| 604 | `LocalDB` | `LocalDB.saveTables(dbTables.map(t =&gt; t.tableNumber === selectedTable ? { ...t, status: targetStatus } : t));` |
| 1174 | `LocalDB` | `LocalDB.addAuditLog("POS Coupon Cleared", "Cleared global promo coupon", `POS (${currentRole})`);` |

### [webrajya-only-pos (1)/src/components/PrintersConfigTab.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/PrintersConfigTab.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 20 | `LocalDB` | `import { LocalDB } from "../lib/db";` |

### [webrajya-only-pos (1)/src/components/VirtualPrinterCenter.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/components/VirtualPrinterCenter.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 25 | `LocalDB` | `import { LocalDB, supabase } from "../lib/db";` |
| 29 | `localStorage` | `getSessionRestaurantId() \|\| localStorage.getItem('wr_restaurant_id') \|\| 'restaurant-demo';` |
| 29 | `demo` | `getSessionRestaurantId() \|\| localStorage.getItem('wr_restaurant_id') \|\| 'restaurant-demo';` |
| 58 | `LocalDB` | `const dbLogs = await LocalDB.fetchPrinterLogs();` |
| 59 | `LocalDB` | `const dbKots = await LocalDB.fetchKOTs();` |
| 64 | `LocalDB` | `setLogs(LocalDB.getPrinterLogs());` |
| 65 | `LocalDB` | `setKots(LocalDB.getKOTs());` |
| 198 | `LocalDB` | `await LocalDB.apiAddPrinterLog({` |
| 206 | `LocalDB` | `await LocalDB.apiUpdateKOTPrinted(kot.id, true);` |

### [webrajya-only-pos (1)/src/lib/db.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/lib/db.ts)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 134 | `defaultAuditLogs` | `const defaultAuditLogs: AuditLog[] = [];` |
| 135 | `defaultCategories` | `const defaultCategories: Category[] = [];` |
| 136 | `defaultMenuItems` | `const defaultMenuItems: MenuItem[] = [];` |
| 151 | `localStorage` | `// Database state managers with both offline localStorage caching and full-stack Express API integration` |
| 152 | `LocalDB` | `export class LocalDB {` |
| 172 | `localStorage` | `// Fallback: check localStorage for legacy stored restaurant_id` |
| 173 | `localStorage` | `const stored = localStorage.getItem('wr_restaurant_id');` |
| 181 | `localStorage` | `const stored = localStorage.getItem("ij_menu_items");` |
| 183 | `localStorage` | `localStorage.setItem("ij_menu_items", JSON.stringify(defaultMenuItems));` |
| 183 | `defaultMenuItems` | `localStorage.setItem("ij_menu_items", JSON.stringify(defaultMenuItems));` |
| 184 | `defaultMenuItems` | `return defaultMenuItems;` |
| 189 | `localStorage` | `localStorage.setItem("ij_menu_items", JSON.stringify(defaultMenuItems));` |
| 189 | `defaultMenuItems` | `localStorage.setItem("ij_menu_items", JSON.stringify(defaultMenuItems));` |
| 190 | `defaultMenuItems` | `return defaultMenuItems;` |
| 194 | `localStorage` | `localStorage.setItem("ij_menu_items", JSON.stringify(defaultMenuItems));` |
| 194 | `defaultMenuItems` | `localStorage.setItem("ij_menu_items", JSON.stringify(defaultMenuItems));` |
| 195 | `defaultMenuItems` | `return defaultMenuItems;` |
| 200 | `localStorage` | `localStorage.setItem("ij_menu_items", JSON.stringify(items));` |
| 205 | `localStorage` | `const stored = localStorage.getItem("ij_reviews");` |
| 207 | `localStorage` | `localStorage.setItem("ij_reviews", JSON.stringify([]));` |
| 214 | `localStorage` | `localStorage.setItem("ij_reviews", JSON.stringify(reviews));` |
| 218 | `localStorage` | `const stored = localStorage.getItem("ij_orders");` |
| 220 | `localStorage` | `localStorage.setItem("ij_orders", JSON.stringify([]));` |
| 242 | `localStorage` | `localStorage.setItem("ij_orders", JSON.stringify(cleanOrders));` |
| 251 | `localStorage` | `localStorage.setItem("ij_orders", JSON.stringify(orders));` |
| 256 | `localStorage` | `const stored = localStorage.getItem("ij_tables");` |
| 258 | `localStorage` | `localStorage.setItem("ij_tables", JSON.stringify([]));` |
| 265 | `localStorage` | `localStorage.setItem("ij_tables", JSON.stringify(tables));` |
| 470 | `localStorage` | `const stored = localStorage.getItem("ij_inventory");` |
| 472 | `localStorage` | `localStorage.setItem("ij_inventory", JSON.stringify(defaultInventory));` |
| 479 | `localStorage` | `localStorage.setItem("ij_inventory", JSON.stringify(inventory));` |
| 483 | `localStorage` | `const stored = localStorage.getItem("ij_coupons");` |
| 485 | `localStorage` | `localStorage.setItem("ij_coupons", JSON.stringify(defaultCoupons));` |
| 492 | `localStorage` | `localStorage.setItem("ij_coupons", JSON.stringify(coupons));` |
| 496 | `localStorage` | `const stored = localStorage.getItem("ij_settings");` |
| 498 | `localStorage` | `localStorage.setItem("ij_settings", JSON.stringify(defaultSettings));` |
| 506 | `localStorage` | `localStorage.setItem("ij_settings", JSON.stringify(settings));` |
| 511 | `localStorage` | `const stored = localStorage.getItem("ij_categories");` |
| 513 | `localStorage` | `localStorage.setItem("ij_categories", JSON.stringify(defaultCategories));` |
| 513 | `defaultCategories` | `localStorage.setItem("ij_categories", JSON.stringify(defaultCategories));` |
| 514 | `defaultCategories` | `return defaultCategories;` |
| 520 | `localStorage` | `localStorage.setItem("ij_categories", JSON.stringify(cats));` |
| 525 | `localStorage` | `const stored = localStorage.getItem("ij_audit_logs");` |
| 527 | `localStorage` | `localStorage.setItem("ij_audit_logs", JSON.stringify(defaultAuditLogs));` |
| 527 | `defaultAuditLogs` | `localStorage.setItem("ij_audit_logs", JSON.stringify(defaultAuditLogs));` |
| 528 | `defaultAuditLogs` | `return defaultAuditLogs;` |
| 544 | `localStorage` | `localStorage.setItem("ij_audit_logs", JSON.stringify(logs));` |
| 568 | `LocalDB` | `console.error("[LocalDB Exception adding timeline event]", err);` |
| 601 | `localStorage` | `const token = localStorage.getItem("ij_admin_jwt") \|\| sessionStorage.getItem("ij_admin_jwt");` |
| 624 | `LocalDB` | `console.log(`[LocalDB] Merging items into active order ${existingOrder.id} for Table ${existingOrder.tableNumber}`);` |
| 878 | `LocalDB` | `console.log(`[LocalDB] Updating Order ${orderId} payment details: Mode=${paymentMode}, Status=${paymentStatus}`);` |
| 901 | `LocalDB` | `console.log(`[LocalDB] Updating Order ${orderId} status to ${status}`);` |
| 1272 | `LocalDB` | `console.log("Responsible Function: LocalDB.apiSaveMenuItems");` |
| 1296 | `LocalDB` | `console.error("Responsible Function: LocalDB.apiSaveMenuItems");` |
| 1308 | `LocalDB` | `console.error("Responsible Function: LocalDB.apiSaveMenuItems");` |
| 1327 | `LocalDB` | `console.log("Responsible Function: LocalDB.apiSaveMenuItems");` |
| 1350 | `LocalDB` | `console.error("Responsible Function: LocalDB.apiSaveMenuItems");` |
| 1362 | `LocalDB` | `console.error("Responsible Function: LocalDB.apiSaveMenuItems");` |
| 1435 | `localStorage` | `localStorage.setItem("ij_audit_logs", JSON.stringify(logs));` |
| 1440 | `localStorage` | `const stored = localStorage.getItem("ij_kots");` |
| 1442 | `mock` | `// Seed with fallback mock KOTs matching existing active mock orders for initial realism` |
| 1444 | `localStorage` | `localStorage.setItem("ij_kots", JSON.stringify(fallbackKOTs));` |
| 1451 | `localStorage` | `localStorage.setItem("ij_kots", JSON.stringify(kots));` |
| 1503 | `localStorage` | `const stored = localStorage.getItem("ij_printer_logs");` |
| 1505 | `localStorage` | `localStorage.setItem("ij_printer_logs", JSON.stringify([]));` |
| 1512 | `localStorage` | `localStorage.setItem("ij_printer_logs", JSON.stringify(logs));` |
| 1539 | `LocalDB` | `console.log(`[LocalDB] Updating ${type} print status for order ${orderId} to ${status}`);` |
| 1556 | `LocalDB` | `console.error("[LocalDB Exception updating print status]", err);` |

### [webrajya-only-pos (1)/src/lib/printQueueManager.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/lib/printQueueManager.ts)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 3 | `LocalDB` | `import { LocalDB, Order } from "./db";` |
| 127 | `localStorage` | `const stored = localStorage.getItem("sr_printer_configs");` |
| 129 | `localStorage` | `localStorage.setItem("sr_printer_configs", JSON.stringify(DEFAULT_PRINTER_CONFIGS));` |
| 136 | `localStorage` | `localStorage.setItem("sr_printer_configs", JSON.stringify(configs));` |
| 142 | `localStorage` | `const stored = localStorage.getItem("sr_print_queue");` |
| 144 | `localStorage` | `localStorage.setItem("sr_print_queue", JSON.stringify([]));` |
| 151 | `localStorage` | `localStorage.setItem("sr_print_queue", JSON.stringify(queue));` |
| 157 | `localStorage` | `const stored = localStorage.getItem("sr_print_logs_v2");` |
| 159 | `localStorage` | `localStorage.setItem("sr_print_logs_v2", JSON.stringify([]));` |
| 166 | `localStorage` | `localStorage.setItem("sr_print_logs_v2", JSON.stringify(logs));` |
| 173 | `mock` | `if (lower.includes("beverage") \|\| lower.includes("drink") \|\| lower.includes("mocktail") \|\| lower.includes("shake") \|\| lower.includes("soda") \|\| lower.includes("bar")) {` |
| 190 | `LocalDB` | `const menuItems = LocalDB.getMenuItems();` |
| 397 | `LocalDB` | `const allOrders = await LocalDB.fetchOrders();` |
| 399 | `LocalDB` | `const settings = LocalDB.getSettings();` |
| 528 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(order.id, job.type === "Bill" ? "bill" : "kot", "Printed");` |
| 544 | `LocalDB` | `await LocalDB.apiAddAuditLog(` |
| 555 | `LocalDB` | `await LocalDB.apiUpdateOrderPrintStatus(order.id, job.type === "Bill" ? "bill" : "kot", "Failed");` |
| 568 | `LocalDB` | `await LocalDB.apiAddAuditLog(` |
| 608 | `localStorage` | `const autoPrintEnabled = localStorage.getItem("sr_auto_print_enabled") !== "false";` |
| 632 | `localStorage` | `const autoPrintEnabled = localStorage.getItem("sr_auto_print_enabled") !== "false";` |

### [webrajya-only-pos (1)/src/lib/printerService.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/lib/printerService.ts)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 1151 | `localStorage` | `const stored = localStorage.getItem("wr_printer_settings");` |
| 1165 | `localStorage` | `localStorage.setItem("wr_printer_settings", JSON.stringify(defaults));` |
| 1188 | `localStorage` | `localStorage.setItem("wr_printer_settings", JSON.stringify(settings));` |

### [webrajya-only-pos (1)/src/lib/restaurantSession.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-only-pos (1)/src/lib/restaurantSession.ts)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 35 | `localStorage` | `localStorage.setItem(SESSION_KEY, serialized);` |
| 38 | `localStorage` | `localStorage.removeItem(SESSION_KEY);` |
| 44 | `localStorage` | `* Checks localStorage first, then sessionStorage.` |
| 49 | `localStorage` | `localStorage.getItem(SESSION_KEY) \|\| sessionStorage.getItem(SESSION_KEY);` |
| 69 | `localStorage` | `localStorage.removeItem(SESSION_KEY);` |
| 71 | `localStorage` | `localStorage.removeItem(SUPABASE_SESSION_KEY);` |

### [webrajya-pos---super-admin/src/App.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/App.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 41 | `mock` | `import { dbStore } from './utils/mockData';` |
| 41 | `dbStore` | `import { dbStore } from './utils/mockData';` |
| 47 | `localStorage` | `localStorage.getItem('wr_is_logged_in') === 'true'` |
| 54 | `localStorage` | `const saved = localStorage.getItem('wr_admin_user');` |
| 88 | `dbStore` | `setTickets([...dbStore.tickets]);` |
| 89 | `dbStore` | `setSettings({ ...dbStore.settings });` |
| 93 | `dbStore` | `setRestaurants([...dbStore.restaurants]);` |
| 94 | `dbStore` | `setPayments([...dbStore.payments as any]);` |
| 95 | `dbStore` | `setBranches([...dbStore.branches as any]);` |
| 96 | `dbStore` | `setLogs([...dbStore.logs as any]);` |
| 97 | `dbStore` | `setTickets([...dbStore.tickets as any]);` |
| 98 | `dbStore` | `setSettings({ ...dbStore.settings });` |
| 113 | `localStorage` | `localStorage.setItem('wr_is_logged_in', String(loggedIn));` |
| 114 | `localStorage` | `localStorage.setItem('wr_admin_user', JSON.stringify(user));` |
| 174 | `dbStore` | `// Also update local logs/payments via dbStore` |
| 175 | `dbStore` | `dbStore.renewSubscription(id, plan, months);` |
| 180 | `dbStore` | `return dbStore.resetPassword(id);` |
| 196 | `dbStore` | `dbStore.replyTicket(id, text);` |
| 197 | `dbStore` | `setTickets([...dbStore.tickets as any]);` |
| 201 | `dbStore` | `dbStore.updateTicketStatus(id, status, assignee);` |
| 202 | `dbStore` | `setTickets([...dbStore.tickets as any]);` |
| 207 | `dbStore` | `dbStore.updateGlobalSettings(newSettings);` |
| 208 | `dbStore` | `setSettings({ ...dbStore.settings });` |
| 212 | `dbStore` | `dbStore.clearAllData();` |
| 415 | `dbStore` | `dbStore.updateRestaurantStatus(id, 'suspended');` |
| 416 | `dbStore` | `setPayments([...dbStore.payments as any]);` |
| 417 | `dbStore` | `setRestaurants([...dbStore.restaurants]);` |
| 452 | `localStorage` | `localStorage.setItem('wr_admin_user', JSON.stringify(updated));` |

### [webrajya-pos---super-admin/src/components/DashboardView.tsx](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/components/DashboardView.tsx)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 62 | `mock` | `.filter(p =&gt; p.status === 'successful') // simplifying monthly calculation from the seeded mockpayments` |

### [webrajya-pos---super-admin/src/supabase.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/supabase.ts)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 26 | `demo` | `// Offline demo fallback` |
| 123 | `demo` | `// Step 3: Offline email-based fallback (demo mode)` |

### [webrajya-pos---super-admin/src/supabaseDb.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/supabaseDb.ts)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 21 | `mock` | `import { dbStore } from './utils/mockData';` |
| 21 | `dbStore` | `import { dbStore } from './utils/mockData';` |
| 68 | `dbStore` | `if (!isSupabaseConfigured) return [...dbStore.restaurants];` |
| 77 | `dbStore` | `return [...dbStore.restaurants];` |
| 80 | `dbStore` | `dbStore.restaurants = data as Restaurant[];` |
| 113 | `dbStore` | `dbStore.updateRestaurantStatus(id, status);` |
| 121 | `dbStore` | `dbStore.updateRestaurantStatus(id, status);` |
| 141 | `dbStore` | `dbStore.deleteRestaurant(id);` |
| 146 | `dbStore` | `dbStore.deleteRestaurant(id);` |
| 155 | `dbStore` | `dbStore.save();` |
| 171 | `dbStore` | `if (!isSupabaseConfigured) return [...dbStore.branches];` |
| 177 | `dbStore` | `return [...dbStore.branches];` |
| 304 | `dbStore` | `return [...dbStore.logs];` |
| 308 | `dbStore` | `return [...dbStore.payments];` |
| 387 | `demo` | `authUserId = `demo_${genId('uid')}`;` |
| 544 | `dbStore` | `dbStore.restaurants.unshift(restaurant);` |
| 545 | `dbStore` | `dbStore.branches.push({` |
| 555 | `dbStore` | `dbStore.logs.unshift({` |
| 565 | `dbStore` | `dbStore.save();` |

### [webrajya-pos---super-admin/src/utils/mockData.ts](file:///Users/aryanrajput/Desktop/POS/webrajya-pos---super-admin/src/utils/mockData.ts)

| Line | Pattern | Matching Line Content |
| :--- | :--- | :--- |
| 3 | `demo` | `// Let's seed initial data for demonstration.` |
| 48 | `mock` | `// Force reset old mock data on first load of clean version` |
| 49 | `localStorage` | `const hasPurgedOld = localStorage.getItem('wr_purged_old_v3');` |
| 51 | `localStorage` | `localStorage.removeItem('wr_restaurants');` |
| 52 | `localStorage` | `localStorage.removeItem('wr_payments');` |
| 53 | `localStorage` | `localStorage.removeItem('wr_tickets');` |
| 54 | `localStorage` | `localStorage.removeItem('wr_branches');` |
| 55 | `localStorage` | `localStorage.removeItem('wr_logs');` |
| 56 | `localStorage` | `localStorage.setItem('wr_purged_old_v3', 'true');` |
| 59 | `localStorage` | `// Attempt to load from localStorage to persist changes` |
| 60 | `localStorage` | `const savedRestaurants = localStorage.getItem('wr_restaurants');` |
| 61 | `localStorage` | `const savedPayments = localStorage.getItem('wr_payments');` |
| 62 | `localStorage` | `const savedTickets = localStorage.getItem('wr_tickets');` |
| 63 | `localStorage` | `const savedBranches = localStorage.getItem('wr_branches');` |
| 64 | `localStorage` | `const savedLogs = localStorage.getItem('wr_logs');` |
| 65 | `localStorage` | `const savedSettings = localStorage.getItem('wr_settings');` |
| 76 | `localStorage` | `localStorage.setItem('wr_restaurants', JSON.stringify(this.restaurants));` |
| 77 | `localStorage` | `localStorage.setItem('wr_payments', JSON.stringify(this.payments));` |
| 78 | `localStorage` | `localStorage.setItem('wr_tickets', JSON.stringify(this.tickets));` |
| 79 | `localStorage` | `localStorage.setItem('wr_branches', JSON.stringify(this.branches));` |
| 80 | `localStorage` | `localStorage.setItem('wr_logs', JSON.stringify(this.logs));` |
| 81 | `localStorage` | `localStorage.setItem('wr_settings', JSON.stringify(this.settings));` |
| 157 | `mock` | `const mockPayment: Payment = {` |
| 168 | `mock` | `this.payments.unshift(mockPayment);` |
| 188 | `localStorage` | `// and any exception thrown stops the code before it mutates arrays or saves to localStorage.` |
| 345 | `dbStore` | `export const dbStore = new DatabaseStore();` |

