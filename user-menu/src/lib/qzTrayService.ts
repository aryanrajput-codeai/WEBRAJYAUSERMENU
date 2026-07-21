import qz from "qz-tray";

export interface QZTrayConnectionStatus {
  connected: boolean;
  statusText: string;
  isConnecting: boolean;
}

export class QZTrayService {
  private static activeConnection: Promise<any> | null = null;
  private static isConnectingState = false;
  private static listeners: Set<(status: QZTrayConnectionStatus) => void> = new Set();
  private static detectedPrinters: string[] = [];

  public static subscribe(callback: (status: QZTrayConnectionStatus) => void): () => void {
    this.listeners.add(callback);
    // Emit current status immediately
    callback(this.getStatus());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((cb) => cb(status));
    window.dispatchEvent(new CustomEvent("qz_connection_changed", { detail: status }));
  }

  public static getStatus(): QZTrayConnectionStatus {
    const isConnected = qz.websocket.isActive();
    let statusText = "QZ Tray Not Connected";
    if (this.isConnectingState) {
      statusText = "Connecting to QZ Tray...";
    } else if (isConnected) {
      statusText = "QZ Tray Connected";
    }
    return {
      connected: isConnected,
      statusText,
      isConnecting: this.isConnectingState,
    };
  }

  public static async connect(): Promise<boolean> {
    if (qz.websocket.isActive()) {
      this.isConnectingState = false;
      this.notifyListeners();
      return true;
    }

    if (this.isConnectingState) {
      return false;
    }

    this.isConnectingState = true;
    this.notifyListeners();

    try {
      // QZ Tray websocket connection
      await qz.websocket.connect({
        host: "localhost",
        port: [8182, 8181, 8282, 8283, 8383, 8484],
        keepAlive: 60,
      });

      console.log("[QZTrayService] Successfully connected to QZ Tray WebSocket");
      this.isConnectingState = false;
      this.notifyListeners();
      
      // Auto refresh printers list once connected
      await this.refreshPrinters();
      
      // Setup disconnect listener
      qz.websocket.getConnection().onclose = () => {
        console.warn("[QZTrayService] WebSocket closed. Reconnecting in 5 seconds...");
        this.notifyListeners();
        setTimeout(() => this.connect(), 5000);
      };

      return true;
    } catch (err: any) {
      console.error("[QZTrayService] Failed to connect to QZ Tray:", err);
      this.isConnectingState = false;
      this.notifyListeners();
      return false;
    }
  }

  public static async disconnect(): Promise<void> {
    if (qz.websocket.isActive()) {
      try {
        await qz.websocket.disconnect();
      } catch (err) {
        console.error("[QZTrayService] Error during disconnect:", err);
      }
    }
    this.notifyListeners();
  }

  public static async refreshPrinters(): Promise<string[]> {
    if (!qz.websocket.isActive()) {
      return [];
    }
    try {
      const list = await qz.printers.find();
      this.detectedPrinters = Array.isArray(list) ? list : [];
      console.log("[QZTrayService] System printers detected:", this.detectedPrinters);
      return this.detectedPrinters;
    } catch (err) {
      console.error("[QZTrayService] Error finding printers:", err);
      return [];
    }
  }

  public static getDetectedPrinters(): string[] {
    return this.detectedPrinters;
  }

  /**
   * Prints ESC/POS raw hex commands silently using QZ Tray
   */
  public static async printRawHex(printerName: string, hexString: string, copies: number = 1): Promise<void> {
    if (!qz.websocket.isActive()) {
      throw new Error("QZ Tray is not running. Please start QZ Tray application.");
    }

    try {
      const config = qz.configs.create(printerName, {
        copies: copies,
        unsaved: true, // Do not store this config in QZ Tray XML cache
      });

      // Send the hex ESC/POS data
      await qz.print(config, [
        {
          type: "raw",
          format: "command",
          data: hexString,
          options: { encoding: "hex" },
        },
      ]);
      console.log(`[QZTrayService] Successfully printed raw hex job to ${printerName}`);
    } catch (err: any) {
      console.error("[QZTrayService] Raw print failed:", err);
      throw new Error(err.message || "Silent print failed. Check printer connection.");
    }
  }
}
