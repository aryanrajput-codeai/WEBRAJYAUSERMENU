import { useState, useEffect } from "react";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import { LocalDB } from "./lib/db";
import { PrintQueueManager } from "./lib/printQueueManager";
import { hasActiveSession, clearRestaurantSession, loadRestaurantSession } from "./lib/restaurantSession";

export default function App() {
  // Session-aware auth: check both the JWT token AND a valid restaurant session
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    const localToken = localStorage.getItem("ij_admin_jwt");
    const sessionToken = sessionStorage.getItem("ij_admin_jwt");
    const token = localToken || sessionToken;
    // Validate the session is still intact
    if (token && hasActiveSession()) return token;
    if (token && !hasActiveSession()) {
      // Token exists but session is gone — clear orphaned token
      localStorage.removeItem("ij_admin_jwt");
      sessionStorage.removeItem("ij_admin_jwt");
    }
    return null;
  });

  useEffect(() => {
    // Initialize background auto-print listeners
    PrintQueueManager.initAutoPrintListeners();

    // Load restaurant context and sync menu items on mount
    const loadRealData = async () => {
      try {
        const session = loadRestaurantSession();
        if (session) {
          console.log(`[App] Restaurant context loaded: "${session.restaurantName}" (${session.restaurantId})`);
          // Persist restaurant_id to localStorage for legacy components
          localStorage.setItem("wr_restaurant_id", session.restaurantId);
        }
        await LocalDB.fetchMenuItems();
      } catch (err) {
        // Fallback silently
      }
    };
    loadRealData();
  }, []);

  const handleAdminLoginSuccess = (token: string, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem("ij_admin_jwt", token);
    } else {
      sessionStorage.setItem("ij_admin_jwt", token);
    }
    setAdminToken(token);
  };

  const handleAdminLogout = () => {
    // Clear all session data
    localStorage.removeItem("ij_admin_jwt");
    sessionStorage.removeItem("ij_admin_jwt");
    clearRestaurantSession();
    localStorage.removeItem("wr_restaurant_id");
    setAdminToken(null);
  };

  // Show dashboard if authenticated with valid session
  if (adminToken) {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
}
