import { MenuItem } from "../types";
import { ESCPOSBuilder } from "./escposBuilder";
import { QZTrayService } from "./qzTrayService";

export interface PrinterItem {
  name: string;
  quantity: number;
  price?: number;
}

export interface PrinterData {
  id: string;
  tableNumber?: string;
  orderType: string;
  createdAt: string;
  items: PrinterItem[];
  specialInstructions?: string;
  subtotal?: number;
  gst?: number;
  packagingCharge?: number;
  discountAmount?: number;
  appliedCoupon?: string;
  grandTotal?: number;
  paymentStatus?: string;
  phoneNumber?: string;
  customerName?: string;
}

export interface PrintableLine {
  text: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  doubleSize?: boolean;
  doubleHeight?: boolean;
}

/**
 * Modern Browser-based Physical thermal ESC/POS Printing Service
 * Generates all receipts dynamically from an array of printable lines.
 */
export class PhysicalThermalPrinter {
  private static usbDevice: any = null;
  private static serialPort: any = null;

  public static isUSBConnected(): boolean {
    return !!this.usbDevice;
  }

  public static isSerialConnected(): boolean {
    return !!this.serialPort;
  }

  /**
   * Helper to encode standard text to raw Uint8Array (Windows-1252 / ASCII compatible)
   */
  private static encodeASCII(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  /**
   * Automatically wrap long text into chunks of at most 'limit' characters, splitting at words where possible.
   */
  public static wrapText(text: string, limit: number): string[] {
    if (!text) return [""];
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if (!word) continue;

      if (word.length > limit) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
        let remaining = word;
        while (remaining.length > limit) {
          lines.push(remaining.substring(0, limit));
          remaining = remaining.substring(limit);
        }
        currentLine = remaining;
      } else {
        if (currentLine.length + word.length + (currentLine ? 1 : 0) <= limit) {
          currentLine += (currentLine ? " " : "") + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines.length > 0 ? lines : [""];
  }

  /**
   * Generate PrintableLine array for Kitchen Order Ticket (KOT)
   */
  public static generateKOTLines(data: PrinterData, width: "58mm" | "80mm" = "80mm", cashierName: string = "Cashier"): PrintableLine[] {
    const is80 = width === "80mm";
    const lineCharWidth = is80 ? 48 : 32;
    const divider = "-".repeat(lineCharWidth);
    const doubleDivider = "=".repeat(lineCharWidth);

    const lines: PrintableLine[] = [];

    // 1. Centered Title
    lines.push({ text: "WEBRAJYA POS", align: "center", bold: true, doubleSize: true });
    if ((data as any).isAddOn) {
      lines.push({ text: "ADD-ON KOT (ADD-ON KITCHEN ORDER TICKET)", align: "center", bold: true });
    } else {
      lines.push({ text: "KITCHEN ORDER TICKET (KOT)", align: "center", bold: true });
    }
    lines.push({ text: `KOT NO: ${data.id}`, align: "center", bold: true, doubleHeight: true });
    lines.push({ text: doubleDivider, align: "center" });

    // 2. Metadata (centered)
    lines.push({ text: `Date: ${new Date(data.createdAt).toLocaleDateString()}  Time: ${new Date(data.createdAt).toLocaleTimeString()}`, align: "center" });
    lines.push({ text: `Table Number: ${data.tableNumber || "Takeaway"}`, align: "center" });
    lines.push({ text: `Order Type: ${data.orderType.toUpperCase()}`, align: "center" });
    lines.push({ text: `Cashier: ${cashierName}`, align: "center" });
    lines.push({ text: doubleDivider, align: "center" });

    // 3. Header
    lines.push({ text: "ITEMS PREPARATION LIST", align: "center", bold: true });
    lines.push({ text: divider, align: "center" });

    // 4. Items List centered
    for (const item of data.items) {
      lines.push({ text: `${item.quantity} x ${item.name}`, align: "center", bold: true });
    }
    lines.push({ text: divider, align: "center" });

    // 5. Special Instructions
    if (data.specialInstructions && data.specialInstructions !== "None" && data.specialInstructions.trim() !== "") {
      lines.push({ text: "SPECIAL INSTRUCTIONS:", align: "center", bold: true });
      const wrappedNotes = this.wrapText(data.specialInstructions, lineCharWidth);
      for (const noteLine of wrappedNotes) {
        lines.push({ text: noteLine, align: "center" });
      }
      lines.push({ text: divider, align: "center" });
    }

    // 6. Footer (Requirement 13)
    lines.push({ text: "Kitchen Copy Only", align: "center" });
    lines.push({ text: divider, align: "center" });
    lines.push({ text: "Thank You! Visit Again.", align: "center", bold: true });
    lines.push({ text: divider, align: "center" });

    return lines;
  }

  /**
   * Generate PrintableLine array for Customer Bill
   */
  public static generateBillLines(data: any, settings: any, width: "58mm" | "80mm" = "80mm"): PrintableLine[] {
    const is80 = width === "80mm";
    const lineCharWidth = is80 ? 48 : 32;
    const divider = "-".repeat(lineCharWidth);
    const doubleDivider = "=".repeat(lineCharWidth);

    const lines: PrintableLine[] = [];

    // 1. Centered Title Logo
    lines.push({ text: "  [  WEBRAJYA POS  ]  ", align: "center", bold: true, doubleSize: true });
    lines.push({ text: "- PURE VEGETARIAN -", align: "center", bold: true });
    
    if (settings.address) {
      const wrappedAddr = this.wrapText(settings.address, lineCharWidth);
      for (const addrLine of wrappedAddr) {
        lines.push({ text: addrLine, align: "center" });
      }
    }
    lines.push({ text: `GSTIN: 07AAAAA1111A1Z1`, align: "center" });
    if (settings.contactNumber) {
      lines.push({ text: `Ph: ${settings.contactNumber}`, align: "center" });
    }
    lines.push({ text: doubleDivider, align: "center" });

    // 2. Metadata
    lines.push({ text: `BILL NO: ${data.id}`, align: "center", bold: true });
    const createdAtDate = new Date(data.createdAt);
    lines.push({ text: `DATE: ${createdAtDate.toLocaleDateString()}  TIME: ${createdAtDate.toLocaleTimeString()}`, align: "center" });
    lines.push({ text: `CASHIER: Admin (Owner)`, align: "center" });
    lines.push({ text: `CUSTOMER: ${data.customerName || "Walk-in Guest"}`, align: "center" });
    if (data.phoneNumber) {
      lines.push({ text: `CONTACT: ${data.phoneNumber}`, align: "center" });
    }
    lines.push({ text: `TYPE: ${data.orderType.toUpperCase()} ${data.tableNumber ? `(TABLE #${data.tableNumber})` : ""}`, align: "center" });
    lines.push({ text: doubleDivider, align: "center" });

    // 3. Items Header
    lines.push({ text: "ITEMS SECURED", align: "center", bold: true });
    lines.push({ text: divider, align: "center" });

    // 4. Items List centered
    for (const item of data.items) {
      const priceStr = (item.price * item.quantity).toFixed(2);
      lines.push({ text: `${item.quantity} x ${item.name}`, align: "center", bold: true });
      lines.push({ text: `${item.quantity} @ INR ${item.price.toFixed(2)} = INR ${priceStr}`, align: "center" });
    }
    lines.push({ text: divider, align: "center" });

    // 5. Financial Summary centered
    lines.push({ text: `Subtotal Amount: INR ${data.subtotal.toFixed(2)}`, align: "center" });
    if (data.discountAmount > 0) {
      lines.push({ text: `Promo Discount (${data.appliedCoupon || "COUPON"}): -INR ${data.discountAmount.toFixed(2)}`, align: "center" });
    }
    if (data.packagingCharge > 0) {
      lines.push({ text: `Packaging Charge: INR ${data.packagingCharge.toFixed(2)}`, align: "center" });
    }
    
    // Split GST into CGST (2.5%) and SGST (2.5%)
    const halfGst = data.gst / 2;
    lines.push({ text: `CGST (2.5%): INR ${halfGst.toFixed(2)}`, align: "center" });
    lines.push({ text: `SGST (2.5%): INR ${halfGst.toFixed(2)}`, align: "center" });
    lines.push({ text: divider, align: "center" });
    
    lines.push({ text: `GRAND TOTAL: INR ${data.grandTotal.toFixed(2)}`, align: "center", bold: true, doubleSize: true });
    lines.push({ text: doubleDivider, align: "center" });

    // 6. Footer Notes
    lines.push({ text: `Payment Method: ${data.paymentMethod || (data.paymentStatus === "Paid" ? "Online Complete" : "Cash On Delivery (COD)")}`, align: "center" });
    lines.push({ text: '"Taste That Brings You Back."', align: "center" });
    lines.push({ text: divider, align: "center" });
    lines.push({ text: "Thank You! Visit Again.", align: "center", bold: true });
    lines.push({ text: divider, align: "center" });

    return lines;
  }

  /**
   * Build ESC/POS physical printer bytes sequence from a flat array of PrintableLine objects
   */
  public static linesToEscPosBytes(lines: PrintableLine[]): Uint8Array {
    const esc = 0x1b;
    const gs = 0x1d;

    const commands = {
      init: [esc, 0x40],
      alignLeft: [esc, 0x61, 0x00],
      alignCenter: [esc, 0x61, 0x01],
      alignRight: [esc, 0x61, 0x02],
      boldOn: [esc, 0x45, 0x01],
      boldOff: [esc, 0x45, 0x00],
      doubleSizeOn: [esc, 0x21, 0x30],
      doubleHeightOn: [esc, 0x21, 0x10],
      fontNormal: [esc, 0x21, 0x00],
      lineFeed: [0x0a],
      paperCut: [gs, 0x56, 0x42, 0x00], // Immediate partial paper cut
    };

    const byteArrays: Uint8Array[] = [];
    const pushBytes = (arr: number[]) => { byteArrays.push(new Uint8Array(arr)); };
    const pushText = (text: string) => { byteArrays.push(this.encodeASCII(text)); };

    // Initialize printer once
    pushBytes(commands.init);

    // Write all lines with appropriate styling
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Alignment style
      if (line.align === "center") {
        pushBytes(commands.alignCenter);
      } else if (line.align === "right") {
        pushBytes(commands.alignRight);
      } else {
        pushBytes(commands.alignLeft);
      }

      // Bold style
      if (line.bold) {
        pushBytes(commands.boldOn);
      } else {
        pushBytes(commands.boldOff);
      }

      // Sizing style
      if (line.doubleSize) {
        pushBytes(commands.doubleSizeOn);
      } else if (line.doubleHeight) {
        pushBytes(commands.doubleHeightOn);
      } else {
        pushBytes(commands.fontNormal);
      }

      // Print line content
      pushText(line.text + "\n");
    }

    // Feed exactly 3 lines immediately after the footer text
    pushBytes(commands.lineFeed);
    pushBytes(commands.lineFeed);
    pushBytes(commands.lineFeed);

    // Then trigger the ESC/POS paper cut command
    pushBytes(commands.paperCut);

    // Flatten to a single byte buffer
    const totalLength = byteArrays.reduce((acc, val) => acc + val.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of byteArrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  /**
   * Generates a deterministic barcode using pure CSS/HTML representation
   */
  public static generateBarcodeHTML(text: string, color: string = "#000"): string {
    const normalized = text.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    let html = `<div style="display: flex; align-items: center; justify-content: center; height: 28px; overflow: hidden; margin: 4px auto; background: #ffffff; padding: 2px; width: 80%; border-radius: 2px; border: 1px solid #ddd;">`;
    
    // Start guards
    html += `<div style="width: 2px; height: 100%; background: #000; margin-right: 1px;"></div>`;
    html += `<div style="width: 1px; height: 100%; background: #000; margin-right: 2px;"></div>`;
    
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      for (let bit = 0; bit < 6; bit++) {
        const isBar = (charCode >> bit) & 1;
        const thickness = isBar ? (bit % 2 === 0 ? 2.5 : 2) : 1;
        const barColor = bit % 2 === 0 ? "#000000" : "transparent";
        html += `<div style="width: ${thickness}px; height: 100%; background: ${barColor};"></div>`;
      }
    }
    
    // End guards
    html += `<div style="width: 1px; height: 100%; background: #000; margin-left: 2px;"></div>`;
    html += `<div style="width: 2px; height: 100%; background: #000; margin-left: 1px;"></div>`;
    html += `</div>`;
    html += `<div style="text-align: center; font-size: 7px; letter-spacing: 2px; font-family: monospace; margin-top: 1px; color: ${color}; font-weight: bold;">*${normalized}*</div>`;
    return html;
  }

  /**
   * Generates a premium restaurant POS thermal receipt in HTML/CSS
   */
  public static generatePremiumReceiptHTML(
    type: "bill" | "kot" | "customer-copy" | "kitchen-copy" | "duplicate-copy",
    data: any,
    settings: any,
    options: any = {}
  ): string {
    const opts = {
      paperWidth: options.paperWidth || "80mm",
      autoScale: options.autoScale ?? true,
      autoWidthDetection: options.autoWidthDetection ?? true,
      autoCut: options.autoCut ?? true,
      darkPrintMode: options.darkPrintMode ?? false,
      marginControl: options.marginControl ?? 8,
      characterDensity: options.characterDensity || "normal",
      fontScaling: options.fontScaling || 100,
      multipleCopies: options.multipleCopies || 1,
      logoUrl: options.logoUrl || "",
      customFooter: options.customFooter || "Taste That Brings You Back.",
      showWatermark: options.showWatermark || "none",
      showQrCode: options.showQrCode ?? true,
      showBarcode: options.showBarcode ?? true,
      printCount: options.printCount ?? 1,
      showSignature: options.showSignature ?? true,
    };

    const is80 = opts.paperWidth === "80mm";
    const paperWidthPixels = is80 ? "290px" : "210px";
    
    const isVeg = (name: string): boolean => {
      const lower = name.toLowerCase();
      if (lower.includes("chicken") || lower.includes("egg") || lower.includes("mutton") || lower.includes("fish") || lower.includes("non-veg") || lower.includes("nonveg") || lower.includes("meat") || lower.includes("kabab")) {
        return false;
      }
      return true;
    };

    const items = data.items || [];
    
    let watermarkText = "";
    if (opts.showWatermark !== "none" && opts.showWatermark) {
      watermarkText = opts.showWatermark.toUpperCase() + " COPY";
    } else if (type === "customer-copy") {
      watermarkText = "CUSTOMER COPY";
    } else if (type === "kitchen-copy") {
      watermarkText = "KITCHEN COPY";
    } else if (type === "duplicate-copy") {
      watermarkText = "DUPLICATE COPY";
    }

    const fontSizeBase = is80 ? 11 : 9.5;
    const finalFontSize = fontSizeBase * (opts.fontScaling / 100);
    const lineSpacing = opts.characterDensity === "compact" ? "1.1" : opts.characterDensity === "spacious" ? "1.4" : "1.25";
    const paddingVal = `${opts.marginControl}px`;

    const isDark = opts.darkPrintMode;
    const bg = isDark ? "#121212" : "#ffffff";
    const textCol = isDark ? "#f3f4f6" : "#000000";
    const borderCol = isDark ? "#2d2d2d" : "#000000";
    
    let logoHtml = "";
    if (type === "bill" || type === "customer-copy" || type === "duplicate-copy") {
      if (opts.logoUrl) {
        logoHtml = `<div style="text-align: center; margin-bottom: 6px;"><img src="${opts.logoUrl}" style="max-height: 48px; max-width: 120px; object-fit: contain;" /></div>`;
      } else {
        logoHtml = `
          <div style="text-align: center; margin-bottom: 6px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${textCol}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
          </div>
        `;
      }
    }

    let fullOutputHtml = "";

    for (let copy = 0; copy < opts.multipleCopies; copy++) {
      const isCopyLabelNeeded = copy > 0 || opts.multipleCopies > 1;
      const currentCopyLabel = isCopyLabelNeeded ? ` (COPY ${copy + 1} OF ${opts.multipleCopies})` : "";
      
      let bodyHtml = "";

      if (type === "kot" || type === "kitchen-copy") {
        const kotNo = data.id || "KOT-NEW";
        const orderNo = data.orderId || "SR-NEW";
        const orderNumOnly = orderNo.replace("SR-", "#");

        bodyHtml = `
          <div style="position: relative; width: ${paperWidthPixels}; background: ${bg}; color: ${textCol}; padding: ${paddingVal}; box-sizing: border-box; font-family: 'Courier New', Courier, monospace; font-size: ${finalFontSize}px; font-weight: bold; line-height: ${lineSpacing}; text-align: left; overflow: hidden; margin: 0 auto; border: 1px solid ${isDark ? "#292524" : "#000000"};">
            
            ${watermarkText ? `
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-family: sans-serif; font-size: 24px; font-weight: 900; color: ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}; text-transform: uppercase; white-space: nowrap; pointer-events: none; z-index: 10; letter-spacing: 2px;">
                ${watermarkText}
              </div>
            ` : ""}

            <div style="text-align: center; text-transform: uppercase;">
              <div style="font-size: ${finalFontSize * 1.15}px; font-weight: bold; letter-spacing: 1px;">${settings.name || "WEBRAJYA POS"}</div>
              <div style="font-size: ${finalFontSize * 1.4}px; font-weight: 900; margin: 4px 0; border: 1.5px solid ${textCol}; padding: 3px; display: inline-block; letter-spacing: 1px;">${(data as any).isAddOn ? "ADD-ON KOT" : "KITCHEN ORDER TICKET"}</div>
              <div style="font-size: ${finalFontSize * 1.1}px; font-weight: bold; margin-top: 2px;">KOT: ${kotNo}${currentCopyLabel}</div>
            </div>

            <div style="border-bottom: 1px dashed ${textCol}; margin: 6px 0;"></div>

            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 4px; font-size: ${finalFontSize * 0.95}px;">
              <div><b>Table:</b> <span style="font-size: ${finalFontSize * 1.3}px; font-weight: 900; background: ${isDark ? "#292524" : "#e5e5e5"}; padding: 1px 4px; border-radius: 2px;">${data.tableNumber || "Takeaway"}</span></div>
              <div style="text-align: right;"><b>Order:</b> ${orderNo}</div>
              <div><b>Type:</b> ${(data.orderType || "dine-in").toUpperCase()}</div>
              <div style="text-align: right;"><b>Captain:</b> Admin</div>
              <div><b>Date:</b> ${new Date(data.createdAt || Date.now()).toLocaleDateString()}</div>
              <div style="text-align: right;"><b>Time:</b> ${new Date(data.createdAt || Date.now()).toLocaleTimeString()}</div>
            </div>

            <div style="border-bottom: 1px dashed ${textCol}; margin: 6px 0;"></div>

            <div style="text-align: center; margin: 8px 0; padding: 4px; background: ${isDark ? "#1c1917" : "#fafaf9"}; border: 1px dashed ${textCol};">
              <span style="font-size: ${finalFontSize * 0.85}px; font-weight: bold; display: block; letter-spacing: 1px; color: ${isDark ? "#a8a29e" : "#000000"};">QUEUE TOKEN</span>
              <span style="font-size: ${finalFontSize * 1.8}px; font-weight: 950; letter-spacing: 2px;">${orderNumOnly}</span>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; margin-bottom: 6px;">
              ${isVeg(items[0]?.name || "") ? `<span style="border: 1px solid #22c55e; color: #22c55e; padding: 1px 4px; font-size: ${finalFontSize * 0.8}px; font-weight: bold; border-radius: 2px;">PURE VEG</span>` : `<span style="border: 1px solid #ef4444; color: #ef4444; padding: 1px 4px; font-size: ${finalFontSize * 0.8}px; font-weight: bold; border-radius: 2px;">NON-VEG</span>`}
              ${data.specialInstructions ? `<span style="border: 1px solid #ea580c; color: #ea580c; padding: 1px 4px; font-size: ${finalFontSize * 0.8}px; font-weight: bold; border-radius: 2px;">RUSH ORDER</span>` : ""}
              ${items.some((it: any) => it.isChefSpecial) ? `<span style="border: 1px solid #c026d3; color: #c026d3; padding: 1px 4px; font-size: ${finalFontSize * 0.8}px; font-weight: bold; border-radius: 2px;">CHEF SPECIAL</span>` : ""}
            </div>

            <div style="border-bottom: 1px dashed ${textCol}; margin: 6px 0;"></div>

            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid ${textCol}; font-weight: bold; font-size: ${finalFontSize * 0.95}px;">
                  <th style="padding: 3px 0; width: 15%; text-align: center;">QTY</th>
                  <th style="padding: 3px 0; width: 85%;">KITCHEN PREP ITEM</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => {
                  const itemVeg = isVeg(item.name);
                  const icon = itemVeg 
                    ? `<span style="border: 1.5px solid #22c55e; display: inline-flex; justify-content: center; align-items: center; width: 10px; height: 10px; font-size: 7px; color: #22c55e; font-weight: bold; margin-right: 4px; vertical-align: middle; line-height: 1;">□</span>`
                    : `<span style="border: 1.5px solid #ef4444; display: inline-flex; justify-content: center; align-items: center; width: 10px; height: 10px; font-size: 7px; color: #ef4444; font-weight: bold; margin-right: 4px; vertical-align: middle; line-height: 1;">▲</span>`;

                  const isManual = item.isManual || item.menuItemId === 'manual' || item.name.toUpperCase() === item.name || item.name.toLowerCase().includes("manual");

                  return `
                    <tr style="border-bottom: 1px dotted ${isDark ? "#444" : "#000000"}; font-size: ${finalFontSize}px;">
                      <td style="padding: 6px 0; text-align: center; font-size: ${finalFontSize * 1.3}px; font-weight: 900; vertical-align: top;">${item.quantity}</td>
                      <td style="padding: 6px 0; vertical-align: top; font-weight: bold;">
                        ${icon}${item.name}
                        ${isManual ? `<span style="border: 1px solid ${textCol}; padding: 0 2px; font-size: 7px; border-radius: 1px; font-weight: bold; margin-left: 3px; display: inline-block;">(Manual)</span>` : ""}
                        ${item.customization ? `<div style="font-size: ${finalFontSize * 0.85}px; font-weight: bold; font-style: italic; color: ${isDark ? "#a8a29e" : "#000000"}; margin-top: 2px; padding-left: 14px;">+ ${item.customization}</div>` : ""}
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>

            <div style="border-bottom: 1px dashed ${textCol}; margin: 6px 0;"></div>

            ${data.specialInstructions && data.specialInstructions !== "None" && data.specialInstructions.trim() !== "" ? `
              <div style="border: 1px solid ${textCol}; padding: 5px; margin: 6px 0; background: ${isDark ? "#1c1917" : "#fafaf9"}; border-radius: 3px;">
                <b style="font-size: ${finalFontSize * 0.85}px; display: block; margin-bottom: 2px;">KITCHEN INSTRUCTIONS:</b>
                <span style="font-size: ${finalFontSize * 0.95}px; font-style: italic; color: #e11d48; font-weight: bold;">"${data.specialInstructions}"</span>
              </div>
            ` : ""}

            <div style="text-align: center; font-size: ${finalFontSize * 0.85}px; margin-top: 8px; color: ${isDark ? "#a8a29e" : "#000000"}; font-weight: bold;">
              <div>KOT Printed At: ${new Date().toLocaleTimeString()}</div>
              <div>KOT Print Count: ${opts.printCount}</div>
              <div style="font-weight: bold; margin-top: 4px; letter-spacing: 1px;">*** KITCHEN COPY ONLY ***</div>
            </div>

          </div>
        `;
      } else {
        const invoiceNo = data.id || "SR-NEW";
        const billNo = data.id || "SR-NEW";
        const orderNumOnly = invoiceNo.replace("SR-", "#");
        
        const subtotal = data.subtotal || 0;
        const discountAmount = data.discountAmount || 0;
        const coupon = data.appliedCoupon || "";
        const packagingCharge = data.packagingCharge || 0;
        const gst = data.gst || 0;
        const deliveryCharge = data.orderType === "delivery" ? (settings.deliveryCharges || 0) : 0;
        const serviceCharge = 0; 
        const grandTotal = data.grandTotal || (subtotal - discountAmount + packagingCharge + gst + deliveryCharge);
        const roundOff = (Math.round(grandTotal) - grandTotal).toFixed(2);
        const finalGrandTotal = Math.round(grandTotal);

        const totalSaved = discountAmount;

        const payUpiLink = `upi://pay?pa=webrajyapos@upi&pn=WebRajya%20POS&am=${finalGrandTotal}&cu=INR`;
        const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(payUpiLink)}&qzone=1`;
        const feedbackQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://feedback.webrajyapos.com/order/${invoiceNo}`)}&qzone=1`;

        bodyHtml = `
          <div style="position: relative; width: ${paperWidthPixels}; background: ${bg}; color: ${textCol}; padding: ${paddingVal}; box-sizing: border-box; font-family: 'Courier New', Courier, monospace; font-size: ${finalFontSize}px; font-weight: bold; line-height: ${lineSpacing}; text-align: left; overflow: hidden; margin: 0 auto; border: 1px solid ${isDark ? "#292524" : "#000000"};">
            
            ${watermarkText ? `
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-family: sans-serif; font-size: 24px; font-weight: 900; color: ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}; text-transform: uppercase; white-space: nowrap; pointer-events: none; z-index: 10; letter-spacing: 2px;">
                ${watermarkText}
              </div>
            ` : ""}

            ${logoHtml}

            <div style="text-align: center;">
              <span style="font-size: ${finalFontSize * 1.3}px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${settings.name || "WEBRAJYA POS"}</span><br/>
              <span style="font-size: ${finalFontSize * 0.85}px; color: ${isDark ? "#a8a29e" : "#000000"}; font-weight: bold;">
                ${settings.address || "Shop No. G-3, Shivpuja Apartment, Beside Trimurti Nagar Bus Stop, Nagpur"}<br/>
                <b>GSTIN:</b> 07AAAAA1111A1Z1 | <b>FSSAI:</b> 12345678901234<br/>
                <b>Ph:</b> ${settings.contactNumber || "+91 98765 43210"}<br/>
                <b>Email:</b> contact@webrajyapos.com | <b>Web:</b> webrajyapos.com
              </span>
            </div>

            <div style="border-bottom: 1px dashed ${textCol}; margin: 6px 0;"></div>

            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 4px; font-size: ${finalFontSize * 0.95}px;">
              <div><b>Bill No:</b> ${billNo}${currentCopyLabel}</div>
              <div style="text-align: right;"><b>Table:</b> ${data.tableNumber || "Takeaway"}</div>
              <div><b>Date:</b> ${new Date(data.createdAt || Date.now()).toLocaleDateString()}</div>
              <div style="text-align: right;"><b>Time:</b> ${new Date(data.createdAt || Date.now()).toLocaleTimeString()}</div>
              <div><b>Order Type:</b> ${(data.orderType || "dine-in").toUpperCase()}</div>
              <div style="text-align: right;"><b>Token No:</b> ${orderNumOnly}</div>
              <div><b>Cashier:</b> Admin (Owner)</div>
              <div style="text-align: right; font-weight: bold; color: ${data.paymentStatus === "Paid" ? "#22c55e" : "#e11d48"};">
                ${data.paymentStatus === "Paid" ? "● PAID" : "● UNPAID"}
              </div>
              
              ${data.customerName ? `
                <div style="grid-column: span 2; border-top: 1px dotted ${isDark ? "#444" : "#000000"}; padding-top: 4px; margin-top: 2px;">
                  <b>Customer:</b> ${data.customerName} ${data.phoneNumber ? `(${data.phoneNumber})` : ""}
                </div>
              ` : ""}
            </div>

            <div style="border-bottom: 1px dashed ${textCol}; margin: 6px 0;"></div>

            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid ${textCol}; font-weight: bold; font-size: ${finalFontSize * 0.95}px;">
                  <th style="padding: 3px 0; width: 10%; text-align: center;">QTY</th>
                  <th style="padding: 3px 0; width: 50%;">ITEM</th>
                  <th style="padding: 3px 0; width: 20%; text-align: right;">RATE</th>
                  <th style="padding: 3px 0; width: 20%; text-align: right;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => {
                  const itemVeg = isVeg(item.name);
                  const icon = itemVeg 
                    ? `<span style="border: 1.5px solid #22c55e; display: inline-flex; justify-content: center; align-items: center; width: 8px; height: 8px; font-size: 5px; color: #22c55e; font-weight: bold; margin-right: 3px; vertical-align: middle; line-height: 1;">□</span>`
                    : `<span style="border: 1.5px solid #ef4444; display: inline-flex; justify-content: center; align-items: center; width: 8px; height: 8px; font-size: 5px; color: #ef4444; font-weight: bold; margin-right: 3px; vertical-align: middle; line-height: 1;">▲</span>`;

                  const isManual = item.isManual || item.menuItemId === 'manual' || item.name.toUpperCase() === item.name || item.name.toLowerCase().includes("manual");
                  const originalPrice = item.price;
                  const itemTotal = item.price * item.quantity;
                  const isFree = item.price === 0;

                  return `
                    <tr style="border-bottom: 1px dotted ${isDark ? "#444" : "#000000"}; font-size: ${finalFontSize}px;">
                      <td style="padding: 5px 0; text-align: center; vertical-align: top;">${item.quantity}</td>
                      <td style="padding: 5px 0; vertical-align: top;">
                        ${icon}${item.name}
                        ${isManual ? `<span style="border: 1px solid ${textCol}; padding: 0 2px; font-size: 7.5px; border-radius: 1.5px; font-weight: bold; margin-left: 3.5px; display: inline-block; color: ${textCol};">(Manual)</span>` : ""}
                        ${item.hsnCode ? `<div style="font-size: ${finalFontSize * 0.8}px; color: ${isDark ? "#888" : "#000000"}; font-family: monospace; margin-top: 1.5px;">HSN: ${item.hsnCode}</div>` : ""}
                        ${item.discount > 0 ? `<div style="font-size: ${finalFontSize * 0.8}px; color: #22c55e; font-weight: bold;">Item Discount: -${item.discount}%</div>` : ""}
                        ${item.customization ? `<div style="font-size: ${finalFontSize * 0.85}px; color: ${isDark ? "#a8a29e" : "#000000"}; font-style: italic; font-weight: bold;">+ ${item.customization}</div>` : ""}
                      </td>
                      <td style="padding: 5px 0; text-align: right; vertical-align: top; font-family: monospace;">${isFree ? "0.00" : originalPrice.toFixed(2)}</td>
                      <td style="padding: 5px 0; text-align: right; vertical-align: top; font-family: monospace; font-weight: bold;">
                        ${isFree ? "FREE" : itemTotal.toFixed(2)}
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>

            <div style="border-bottom: 1px dashed ${textCol}; margin: 6px 0;"></div>

            <div style="font-family: monospace; font-size: ${finalFontSize * 0.95}px; font-weight: bold;">
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              
              ${discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; color: ${isDark ? "#34d399" : "#059669"}; font-weight: bold;">
                  <span>Discount ${coupon ? `(${coupon})` : ""}:</span>
                  <span>-₹${discountAmount.toFixed(2)}</span>
                </div>
              ` : ""}

              ${packagingCharge > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                  <span>Packing Charge:</span>
                  <span>₹${packagingCharge.toFixed(2)}</span>
                </div>
              ` : ""}

              ${deliveryCharge > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                  <span>Delivery Charge:</span>
                  <span>₹${deliveryCharge.toFixed(2)}</span>
                </div>
              ` : ""}

              <div style="display: flex; justify-content: space-between;">
                <span>SGST (2.5%):</span>
                <span>₹${(gst / 2).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>CGST (2.5%):</span>
                <span>₹${(gst / 2).toFixed(2)}</span>
              </div>

              ${Number(roundOff) !== 0 ? `
                <div style="display: flex; justify-content: space-between;">
                  <span>Round Off:</span>
                  <span>₹${roundOff}</span>
                </div>
              ` : ""}

              <div style="border-bottom: 1px solid ${textCol}; margin: 4px 0;"></div>

              <div style="display: flex; justify-content: space-between; font-size: ${finalFontSize * 1.4}px; font-weight: 950; border-top: 1px solid ${textCol}; border-bottom: 2px solid ${textCol}; padding: 4px 0;">
                <span>GRAND TOTAL:</span>
                <span>₹${finalGrandTotal.toLocaleString()}.00</span>
              </div>
            </div>

            <div style="margin: 6px 0;"></div>

            ${(() => {
              const paymentModeRaw = data.paymentMode || data.paymentMethod || "Cash";
              
              // Inline split payment parser
              const parseSplit = (val: string | undefined): { [key: string]: number } | null => {
                if (!val || !val.startsWith("Split:")) return null;
                const parts = val.replace("Split:", "").split(",");
                const details: { [key: string]: number } = {};
                parts.forEach(p => {
                  const [mode, amt] = p.split("=");
                  if (mode && amt) {
                    details[mode.trim()] = parseFloat(amt.trim()) || 0;
                  }
                });
                return details;
              };

              const isSplit = paymentModeRaw.startsWith("Split:");
              const splitDict = parseSplit(paymentModeRaw);

              if (isSplit && splitDict) {
                const lines = Object.entries(splitDict)
                  .filter(([_, amt]) => amt > 0)
                  .map(([mode, amt]) => `<div style="display: flex; justify-content: space-between;"><span>${mode} :</span> <span>₹${amt.toFixed(2)}</span></div>`)
                  .join("");
                
                return `
                  <div style="background: ${isDark ? "#1c1917" : "#ffffff"}; border: 1px solid ${isDark ? "#292524" : "#000000"}; padding: 5px; font-size: ${finalFontSize * 0.95}px; border-radius: 2px; font-weight: bold; line-height: 1.4;">
                    <b style="border-bottom: 1px dotted ${textCol}; display: block; margin-bottom: 3px; padding-bottom: 2px;">Payment Details</b>
                    ${lines}
                    <div style="border-top: 1px dotted ${textCol}; margin-top: 4px; padding-top: 4px;">
                      <div style="display: flex; justify-content: space-between;"><span>Payment Mode :</span> <span>Split Payment</span></div>
                      <div style="display: flex; justify-content: space-between; color: #22c55e;"><span>Payment Status :</span> <span>Paid</span></div>
                    </div>
                  </div>
                `;
              } else {
                // Determine payment status based on credit or standard logic
                const statusStr = data.paymentStatus === "Paid" ? "Paid" : (paymentModeRaw === "Credit" ? "Pending" : "Paid");
                const colorStr = statusStr === "Paid" ? "#22c55e" : "#ef4444";
                
                return `
                  <div style="background: ${isDark ? "#1c1917" : "#ffffff"}; border: 1px solid ${isDark ? "#292524" : "#000000"}; padding: 5px; font-size: ${finalFontSize * 0.95}px; border-radius: 2px; font-weight: bold; line-height: 1.4;">
                    <div style="display: flex; justify-content: space-between;"><span>Payment Mode :</span> <span>${paymentModeRaw}</span></div>
                    <div style="display: flex; justify-content: space-between; color: ${colorStr};"><span>Payment Status :</span> <span>${statusStr}</span></div>
                  </div>
                `;
              }
            })()}

            ${totalSaved > 0 ? `
              <div style="text-align: center; font-weight: bold; color: ${isDark ? "#34d399" : "#059669"}; border: 1px dashed ${isDark ? "#34d399" : "#059669"}; padding: 4px; margin: 8px 0; font-size: ${finalFontSize * 1.05}px; border-radius: 2px; text-transform: uppercase;">
                🎉 YES! YOU SAVED ₹${totalSaved.toFixed(2)} ON THIS MEAL! 🎉
              </div>
            ` : ""}

            <div style="text-align: center; font-size: ${finalFontSize * 0.85}px; margin-top: 10px; color: ${isDark ? "#a8a29e" : "#000000"}; line-height: 1.4; font-weight: bold;">
              <b>${opts.customFooter}</b><br/>
              Thank You! Visit Again.<br/>
              <span style="font-size: 7px; color: ${isDark ? "#57534e" : "#000000"}; font-weight: bold;">GST Inclusive. No returns on food items.<br/>Powered by WebRajya • Print Count: ${opts.printCount}</span>
            </div>

          </div>
        `;
      }

      fullOutputHtml += bodyHtml;

      if (copy < opts.multipleCopies - 1) {
        fullOutputHtml += `<div style="page-break-after: always; height: 1px;"></div>`;
      }
    }

    return fullOutputHtml;
  }

  /**
   * Triggers the beautiful, stylized POS thermal receipt print using system dialog.
   */
  public static printPremiumHTML(
    type: "bill" | "kot" | "customer-copy" | "kitchen-copy" | "duplicate-copy",
    data: any,
    settings: any,
    options: any = {}
  ): void {
    const is80 = options.paperWidth === "80mm";
    
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    // Force light print mode (black on white) for physical receipt paper outputs!
    const receiptHtml = this.generatePremiumReceiptHTML(type, data, settings, {
      ...options,
      darkPrintMode: false
    });

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            @page {
              size: ${is80 ? "80mm" : "58mm"} auto;
              margin: 0 !important;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              text-align: center;
              box-sizing: border-box;
              font-weight: bold !important;
            }
            @media print {
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-weight: bold !important;
              }
              div {
                border-color: #000000 !important;
              }
            }
          </style>
        </head>
        <body>
          ${receiptHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }

  /**
   * Fallback print lines function kept for full backward-compatibility with custom text drivers
   */
  public static printLinesSystemFallback(lines: PrintableLine[], width: "58mm" | "80mm" = "80mm"): void {
    const is80 = width === "80mm";
    const paperWidthPixels = is80 ? "280px" : "180px";

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const linesHtml = lines.map((line) => {
      const alignment = line.align || "center";
      const fontWeight = line.bold ? "bold" : "normal";
      
      let fontSize = "11px";
      if (line.doubleSize) {
        fontSize = "16px";
      } else if (line.doubleHeight) {
        fontSize = "14px";
      }

      return `
        <div style="
          white-space: pre-wrap;
          word-break: break-all;
          font-family: 'Courier New', Courier, monospace;
          text-align: ${alignment};
          font-weight: ${fontWeight};
          font-size: ${fontSize};
          line-height: 1.3;
          margin: 0;
          padding: 0;
        ">${line.text}</div>
      `;
    }).join("");

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            @page {
              size: ${is80 ? "80mm" : "58mm"} auto;
              margin: 0 !important;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: ${paperWidthPixels};
              margin: 0 auto !important;
              padding: 10px 10px 10px 10px !important;
              color: #000;
              background: #fff;
              box-sizing: border-box;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${linesHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }

  /**
   * Public interface wrapper to construct ESC/POS bytes for KOT
   */
  public static buildEscPosBytes(data: PrinterData, width: "58mm" | "80mm" = "80mm", cashierName: string = "Cashier"): Uint8Array {
    const lines = this.generateKOTLines(data, width, cashierName);
    return this.linesToEscPosBytes(lines);
  }

  /**
   * Public interface wrapper to construct ESC/POS bytes for Customer Bill
   */
  public static buildBillEscPosBytes(data: any, settings: any, width: "58mm" | "80mm" = "80mm"): Uint8Array {
    const lines = this.generateBillLines(data, settings, width);
    return this.linesToEscPosBytes(lines);
  }

  /**
   * Public KOT fallback rendering entrypoint
   */
  public static printSystemFallback(data: PrinterData, width: "58mm" | "80mm" = "80mm", cashierName: string = "Cashier"): void {
    this.printPremiumHTML("kot", data, { name: "WEBRAJYA POS" }, { paperWidth: width });
  }

  /**
   * Public Bill fallback rendering entrypoint
   */
  public static printBillSystemFallback(data: any, settings: any, width: "58mm" | "80mm" = "80mm"): void {
    this.printPremiumHTML("bill", data, settings, { paperWidth: width });
  }

  /**
   * WebUSB & WebSerial Direct Connection Managers
   */
  public static async connectUSB(): Promise<boolean> {
    if (!("usb" in navigator)) {
      throw new Error("WebUSB API is not supported in this browser environment.");
    }
    try {
      const device = await (navigator as any).usb.requestDevice({
        filters: [{ classCode: 0x07 }]
      });
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);
      this.usbDevice = device;
      return true;
    } catch (err: any) {
      console.error("WebUSB connection failed:", err);
      return false;
    }
  }

  public static async connectSerial(): Promise<boolean> {
    if (!("serial" in navigator)) {
      throw new Error("WebSerial API is not supported in this browser environment.");
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      this.serialPort = port;
      return true;
    } catch (err) {
      console.error("WebSerial connection failed:", err);
      return false;
    }
  }

  /**
   * Print KOT
   */
  public static async printKOT(
    kot: PrinterData,
    width: "58mm" | "80mm" = "80mm",
    mode: "usb" | "serial" | "fallback" | "qz" = "fallback",
    cashierName: string = "Cashier"
  ): Promise<boolean> {
    const pSettings = getWRPrinterSettings();
    if (mode === "qz" || pSettings.useQZTray) {
      try {
        const hex = buildKOTESCPOS(kot, pSettings);
        await QZTrayService.printRawHex(pSettings.printerName, hex, pSettings.copies);
        return true;
      } catch (err) {
        console.warn("QZ Tray print KOT failed, falling back to OS spooler:", err);
        // Fallback to system print dialog
        this.printSystemFallback(kot, width, cashierName);
        return true;
      }
    }

    if (mode === "usb") {
      const bytes = this.buildEscPosBytes(kot, width, cashierName);
      if (!this.usbDevice) {
        const connected = await this.connectUSB();
        if (!connected) return false;
      }
      try {
        await this.usbDevice!.transferOut(1, bytes);
        return true;
      } catch (err) {
        console.error("WebUSB raw print transfer failed:", err);
        return false;
      }
    } else if (mode === "serial") {
      const bytes = this.buildEscPosBytes(kot, width, cashierName);
      if (!this.serialPort) {
        const connected = await this.connectSerial();
        if (!connected) return false;
      }
      try {
        const writer = this.serialPort.writable.getWriter();
        await writer.write(bytes);
        writer.releaseLock();
        return true;
      } catch (err) {
        console.error("WebSerial raw print write failed:", err);
        return false;
      }
    } else {
      this.printSystemFallback(kot, width, cashierName);
      return true;
    }
  }

  /**
   * Print Bill
   */
  public static async printBill(
    order: any,
    settings: any,
    width: "58mm" | "80mm" = "80mm",
    mode: "usb" | "serial" | "fallback" | "qz" = "fallback"
  ): Promise<boolean> {
    const pSettings = getWRPrinterSettings();
    if (mode === "qz" || pSettings.useQZTray) {
      try {
        const hex = buildBillESCPOS(order, settings, pSettings);
        await QZTrayService.printRawHex(pSettings.printerName, hex, pSettings.copies);
        return true;
      } catch (err) {
        console.warn("QZ Tray print Bill failed, falling back to OS spooler:", err);
        this.printBillSystemFallback(order, settings, width);
        return true;
      }
    }

    if (mode === "usb") {
      const bytes = this.buildBillEscPosBytes(order, settings, width);
      if (!this.usbDevice) {
        const connected = await this.connectUSB();
        if (!connected) return false;
      }
      try {
        await this.usbDevice!.transferOut(1, bytes);
        return true;
      } catch (err) {
        console.error("WebUSB raw print transfer failed:", err);
        return false;
      }
    } else if (mode === "serial") {
      const bytes = this.buildBillEscPosBytes(order, settings, width);
      if (!this.serialPort) {
        const connected = await this.connectSerial();
        if (!connected) return false;
      }
      try {
        const writer = this.serialPort.writable.getWriter();
        await writer.write(bytes);
        writer.releaseLock();
        return true;
      } catch (err) {
        console.error("WebSerial raw print write failed:", err);
        return false;
      }
    } else {
      this.printBillSystemFallback(order, settings, width);
      return true;
    }
  }

  /**
   * Print KOT and Bill sequentially with separate cuts and 1000ms delay
   */
  public static async printKOTAndBillSequentially(
    kot: any,
    order: any,
    settings: any,
    width: "58mm" | "80mm" = "80mm",
    mode: "usb" | "serial" | "fallback" | "qz" = "fallback",
    cashierName: string = "Cashier"
  ): Promise<{ kotSuccess: boolean; billSuccess: boolean }> {
    console.log("=== START SEQUENTIAL THERMAL PRINT WORKFLOW ===");
    
    console.log("Step 1: Printing Customer Bill automatically...");
    const billSuccess = await this.printBill(order, settings, width, mode);
    if (!billSuccess) {
      console.error("Customer Bill printing failed.");
      return { kotSuccess: false, billSuccess: false };
    }
    console.log("Customer Bill printed successfully, separate paper cut command sent.");

    console.log("Step 2: Waiting 1200ms...");
    await new Promise((resolve) => setTimeout(resolve, 1200));

    console.log("Step 3: Printing KOT...");
    const kotSuccess = await this.printKOT(kot, width, mode, cashierName);
    if (!kotSuccess) {
      console.error("KOT printing failed! Aborting sequence as per POS rules.");
      return { kotSuccess: false, billSuccess: true };
    }
    
    console.log("KOT printed successfully, separate paper cut command sent.");
    return { kotSuccess: true, billSuccess: true };
  }
}

// --- MASTER PRINTER CONFIGURATION STORAGE AND ESC/POS BUILDERS ---

export interface WRPrinterSettings {
  printerName: string;
  paperWidth: "58mm" | "80mm";
  autoPrintBill: boolean;
  autoPrintKOT: boolean;
  autoCut: boolean;
  cutType: "full" | "partial";
  feedBeforeCutBill: number;
  feedBeforeCutKOT: number;
  copies: number;
  useQZTray: boolean;
}

export function getWRPrinterSettings(): WRPrinterSettings {
  const stored = localStorage.getItem("wr_printer_settings");
  if (!stored) {
    const defaults: WRPrinterSettings = {
      printerName: "XP-80",
      paperWidth: "80mm",
      autoPrintBill: true,
      autoPrintKOT: true,
      autoCut: true,
      cutType: "full",
      feedBeforeCutBill: 5,
      feedBeforeCutKOT: 3,
      copies: 1,
      useQZTray: true,
    };
    localStorage.setItem("wr_printer_settings", JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    const defaults: WRPrinterSettings = {
      printerName: "XP-80",
      paperWidth: "80mm",
      autoPrintBill: true,
      autoPrintKOT: true,
      autoCut: true,
      cutType: "full",
      feedBeforeCutBill: 5,
      feedBeforeCutKOT: 3,
      copies: 1,
      useQZTray: true,
    };
    return defaults;
  }
}

export function saveWRPrinterSettings(settings: WRPrinterSettings) {
  localStorage.setItem("wr_printer_settings", JSON.stringify(settings));
}

export function buildBillESCPOS(data: any, settings: any, printerSettings: WRPrinterSettings): string {
  const builder = new ESCPOSBuilder();
  const width = printerSettings.paperWidth || "80mm";
  
  builder.alignCenter().bold(true).doubleSize(true);
  builder.writeText((settings.name || "WEBRAJYA POS").toUpperCase() + "\n");
  builder.bold(true).doubleSize(false).doubleHeight(true);
  builder.writeText("- PURE VEGETARIAN -\n");
  builder.bold(false).doubleHeight(false);
  
  if (settings.address) {
    builder.writeText(settings.address + "\n");
  }
  builder.writeText("GSTIN: 07AAAAA1111A1Z1 | FSSAI: 12345678901234\n");
  if (settings.contactNumber) {
    builder.writeText(`Ph: ${settings.contactNumber}\n`);
  }
  
  builder.divider(width, true);
  
  builder.alignLeft();
  builder.bold(true);
  builder.writeText(`BILL NO: ${data.id}\n`);
  builder.bold(false);
  builder.writeText(`DATE: ${new Date(data.createdAt || Date.now()).toLocaleDateString()}  TIME: ${new Date(data.createdAt || Date.now()).toLocaleTimeString()}\n`);
  builder.writeText(`CASHIER: Admin (Owner)\n`);
  builder.writeText(`CUSTOMER: ${data.customerName || "Walk-in Guest"}\n`);
  if (data.phoneNumber) {
    builder.writeText(`CONTACT: ${data.phoneNumber}\n`);
  }
  builder.writeText(`TYPE: ${(data.orderType || "dine-in").toUpperCase()} ${data.tableNumber ? `(TABLE #${data.tableNumber})` : ""}\n`);
  
  builder.divider(width, true);
  
  // Header
  builder.alignCenter().bold(true);
  builder.writeText("ITEMS SECURED\n");
  builder.divider(width, false);
  
  // Columns header if 80mm
  builder.alignLeft();
  if (width === "80mm") {
    builder.writeText("QTY ITEM                     RATE      AMOUNT\n");
    builder.divider(width, false);
  }
  
  const items = data.items || [];
  for (const item of items) {
    const originalPrice = item.price || 0;
    const itemTotal = originalPrice * item.quantity;
    const isFree = originalPrice === 0;
    
    builder.itemRow(
      item.name,
      item.quantity.toString(),
      isFree ? "0.00" : originalPrice.toFixed(2),
      isFree ? "FREE" : itemTotal.toFixed(2),
      width
    );
    if (item.customization) {
      builder.alignLeft().writeText(`  + ${item.customization}\n`);
    }
  }
  
  builder.divider(width, false);
  
  // Financial totals
  builder.alignLeft();
  const subtotal = data.subtotal || 0;
  const discountAmount = data.discountAmount || 0;
  const packagingCharge = data.packagingCharge || 0;
  const gst = data.gst || 0;
  const deliveryCharge = data.orderType === "delivery" ? (settings.deliveryCharges || 0) : 0;
  const grandTotal = data.grandTotal || (subtotal - discountAmount + packagingCharge + gst + deliveryCharge);
  const finalGrandTotal = Math.round(grandTotal);
  const roundOff = (finalGrandTotal - grandTotal).toFixed(2);
  
  builder.totalRow("Subtotal:", `Rs. ${subtotal.toFixed(2)}`, width);
  if (discountAmount > 0) {
    builder.totalRow(`Discount (${data.appliedCoupon || "PROMO"}):`, `-Rs. ${discountAmount.toFixed(2)}`, width);
  }
  if (packagingCharge > 0) {
    builder.totalRow("Packing Charge:", `Rs. ${packagingCharge.toFixed(2)}`, width);
  }
  if (deliveryCharge > 0) {
    builder.totalRow("Delivery Charge:", `Rs. ${deliveryCharge.toFixed(2)}`, width);
  }
  builder.totalRow("CGST (2.5%):", `Rs. ${(gst / 2).toFixed(2)}`, width);
  builder.totalRow("SGST (2.5%):", `Rs. ${(gst / 2).toFixed(2)}`, width);
  if (Number(roundOff) !== 0) {
    builder.totalRow("Round Off:", `Rs. ${roundOff}`, width);
  }
  
  builder.divider(width, false);
  builder.bold(true).doubleHeight(true);
  builder.totalRow("GRAND TOTAL:", `Rs. ${finalGrandTotal}.00`, width);
  builder.bold(false).doubleHeight(false);
  
  builder.divider(width, true);
  
  // UPI QR Code
  if (width === "80mm") {
    const payUpiLink = `upi://pay?pa=webrajyapos@upi&pn=WebRajya%20POS&am=${finalGrandTotal}&cu=INR`;
    builder.alignCenter().writeText("\nSCAN TO PAY (UPI)\n");
    builder.writeQRCode(payUpiLink).feed(1);
  }
  
  builder.alignCenter().bold(true);
  builder.writeText(`\nPayment Method: ${data.paymentMethod || "UPI / Cash"}\n`);
  builder.writeText("Taste That Brings You Back.\n");
  builder.bold(false);
  builder.writeText("Thank You! Visit Again.\n");
  builder.writeText("Powered by WebRajya POS\n");
  
  // Feed before cut
  const feedLines = printerSettings.feedBeforeCutBill ?? 5;
  builder.feed(feedLines);
  
  // Auto paper cut
  if (printerSettings.autoCut) {
    if (printerSettings.cutType === "partial") {
      builder.cutPartial();
    } else {
      builder.cutFull();
    }
  }
  
  return builder.compileHex();
}

export function buildKOTESCPOS(data: any, printerSettings: WRPrinterSettings): string {
  const builder = new ESCPOSBuilder();
  const width = printerSettings.paperWidth || "80mm";
  
  builder.alignCenter().bold(true).doubleSize(true);
  builder.writeText("WEBRAJYA POS\n");
  
  builder.doubleSize(false).doubleHeight(true);
  const isAddOn = data.isAddOn || data.type === "Add-On KOT";
  builder.writeText(isAddOn ? "ADD-ON KOT\n" : "KITCHEN ORDER TICKET\n");
  
  builder.bold(false).doubleHeight(false);
  builder.writeText(`KOT NO: ${data.id || "KOT-NEW"}\n`);
  builder.divider(width, true);
  
  builder.alignLeft();
  builder.writeText(`Table: ${data.tableNumber || "Takeaway"}\n`);
  builder.writeText(`Order: ${data.orderId || "SR-NEW"}\n`);
  builder.writeText(`Type: ${(data.orderType || "dine-in").toUpperCase()}\n`);
  builder.writeText(`Date: ${new Date(data.createdAt || Date.now()).toLocaleDateString()}  Time: ${new Date(data.createdAt || Date.now()).toLocaleTimeString()}\n`);
  builder.divider(width, true);
  
  // Large centered Token number!
  const orderNoNum = (data.orderId || "SR-NEW").replace("SR-", "#");
  builder.alignCenter().writeText("QUEUE TOKEN\n");
  builder.bold(true).doubleSize(true);
  builder.writeText(orderNoNum + "\n");
  builder.bold(false).doubleSize(false);
  
  builder.divider(width, false);
  
  // Items rows
  builder.alignLeft().bold(true);
  if (width === "80mm") {
    builder.writeText("QTY  KITCHEN PREP ITEM\n");
    builder.divider(width, false);
  }
  
  const items = data.items || [];
  for (const item of items) {
    builder.alignLeft();
    builder.writeText(`${item.quantity.toString().padEnd(4)} ${item.name}\n`);
    if (item.customization) {
      builder.writeText(`     + ${item.customization}\n`);
    }
  }
  builder.divider(width, false);
  
  if (data.specialInstructions && data.specialInstructions !== "None" && data.specialInstructions.trim() !== "") {
    builder.bold(true);
    builder.writeText("KITCHEN INSTRUCTIONS:\n");
    builder.writeText(`"${data.specialInstructions}"\n`);
    builder.bold(false);
    builder.divider(width, false);
  }
  
  builder.alignCenter().bold(true);
  builder.writeText("*** KITCHEN COPY ONLY ***\n");
  builder.bold(false);
  
  // Feed before cut
  const feedLines = printerSettings.feedBeforeCutKOT ?? 3;
  builder.feed(feedLines);
  
  // Auto paper cut
  if (printerSettings.autoCut) {
    if (printerSettings.cutType === "partial") {
      builder.cutPartial();
    } else {
      builder.cutFull();
    }
  }
  
  return builder.compileHex();
}
