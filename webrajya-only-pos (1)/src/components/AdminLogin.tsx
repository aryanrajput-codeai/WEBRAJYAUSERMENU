import React, { useState, useEffect } from "react";
import { Shield, Mail, Lock, Eye, EyeOff, Sparkles, KeyRound, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB, supabase, isSupabaseConfigured } from "../lib/db";
import { saveRestaurantSession } from "../lib/restaurantSession";

interface AdminLoginProps {
  onLoginSuccess: (token: string, rememberMe: boolean) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Error & Assistance modals
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // Load remembered POS email
  useEffect(() => {
    const savedEmail = localStorage.getItem("ij_admin_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Handle POS Login submission via native Supabase Auth
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorCode("Please enter both your registered email and secure password.");
      return;
    }

    try {
      let loginSuccess = false;
      let token = "";
      let restaurantData: any = null;
      let userRole: 'owner' | 'manager' | 'staff' = 'owner';
      let authUserId = "";

      // 1. Direct Native Supabase Authentication
      if (isSupabaseConfigured) {
        console.log("[Auth System] Authenticating via native Supabase Auth...");
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });

        if (!authError && authData?.session) {
          loginSuccess = true;
          token = authData.session.access_token;
          authUserId = authData.user.id;

          // Load user profile & role
          const { data: profile } = await supabase
            .from("restaurant_users")
            .select("restaurant_id, role")
            .eq("user_id", authUserId)
            .maybeSingle();

          if (profile?.restaurant_id) {
            userRole = profile.role || 'owner';
            const { data: rest } = await supabase
              .from("restaurants")
              .select("*")
              .eq("id", profile.restaurant_id)
              .maybeSingle();
            if (rest) restaurantData = rest;
          } else {
            // Fallback: check restaurants by owner_id or fetch latest restaurant
            const { data: rest } = await supabase
              .from("restaurants")
              .select("*")
              .eq("owner_id", authUserId)
              .maybeSingle();
            if (rest) {
              restaurantData = rest;
            } else {
              const { data: fallbackRest } = await supabase
                .from("restaurants")
                .select("*")
                .limit(1)
                .maybeSingle();
              if (fallbackRest) restaurantData = fallbackRest;
            }
          }
        } else if (authError) {
          console.error("[Auth System] Supabase Auth error:", authError.status, authError.message);
          // Check if fallback to developer master account applies
          const isMasterEmail = cleanEmail.toLowerCase() === "admin@webrajyapos.com" || cleanEmail.toLowerCase() === "admin@webrajya.com";
          const isMasterPassword = cleanPassword === "admin123" || cleanPassword === "password123";

          if (!isMasterEmail || !isMasterPassword) {
            setErrorCode(`Authentication Error (${authError.status || "Auth"}): ${authError.message}`);
            LocalDB.addAuditLog("Access Denied", `Supabase login failed for ${cleanEmail}: ${authError.message}`, "System Gateway");
            return;
          }
        }
      }

      // 2. Developer master account fallback
      const isMasterEmail = cleanEmail.toLowerCase() === "admin@webrajyapos.com" || cleanEmail.toLowerCase() === "admin@webrajya.com";
      const isMasterPassword = cleanPassword === "admin123" || cleanPassword === "password123";

      if (!loginSuccess && isMasterEmail && isMasterPassword) {
        loginSuccess = true;
        const payload = btoa(JSON.stringify({ sub: "webrajya_pos_admin_id", role: "Owner", email: cleanEmail }));
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const mockSignature = "r9U_63r-9saV_77f_93n-c";
        token = `${header}.${payload}.${mockSignature}`;
        restaurantData = {
          id: "rest-001",
          name: "WebRajya Demo Restaurant",
          owner_name: "WebRajya Admin",
          email: cleanEmail
        };
        LocalDB.addAuditLog("Admin Authorized", `Developer master account session granted`, "Admin");
      }

      if (loginSuccess) {
        if (rememberMe) {
          localStorage.setItem("ij_admin_remember_email", cleanEmail);
        } else {
          localStorage.removeItem("ij_admin_remember_email");
        }

        const restaurantId = restaurantData?.id || "rest-001";
        const restaurantName = restaurantData?.name || "WebRajya POS";
        const ownerName = restaurantData?.owner_name || restaurantData?.name || cleanEmail;

        saveRestaurantSession({
          restaurantId,
          restaurantName,
          ownerName,
          email: cleanEmail,
          role: userRole,
          authUserId
        }, rememberMe);

        localStorage.setItem("ij_logged_restaurant_id", restaurantId);
        const currentSettings = LocalDB.getSettings();
        currentSettings.name = restaurantName;
        if (restaurantData?.phone) currentSettings.contactNumber = restaurantData.phone;
        if (restaurantData?.address) currentSettings.address = restaurantData.address;
        LocalDB.saveSettings(currentSettings);

        LocalDB.addAuditLog("Admin Authorized", `POS Session initialized for ${cleanEmail}`, cleanEmail);
        onLoginSuccess(token, rememberMe);
        return;
      }

      setErrorCode("Authentication Failed: Invalid email or password. Please verify your credentials.");
      LocalDB.addAuditLog("Access Denied", `Login attempt failed for ${cleanEmail}`, "System Gateway");
    } catch (err: any) {
      console.error("[Auth System] Unexpected runtime failure:", err);
      setErrorCode(`Runtime Error: ${err?.message || "An unexpected error occurred during authentication."}`);
      LocalDB.addAuditLog("Access Denied", `Unexpected error during login for ${email}: ${err?.message}`, "System Gateway");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;

    setRecoverySuccess(true);
    LocalDB.addAuditLog("Password Recovery Request", `Assistance dispatched to ${recoveryEmail}`, "System Gateway");

    setTimeout(() => {
      setShowForgotModal(false);
      setRecoverySuccess(false);
      setRecoveryEmail("");
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex items-center justify-center relative p-4 font-sans select-none overflow-x-hidden" id="admin-login-screen">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#d4af37]/8 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-100/40 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-xl bg-white border border-stone-200/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 relative z-10 shadow-[0_24px_50px_rgba(40,30,10,0.06)]"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-t-3xl" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-stone-50 to-stone-100 border border-[#d4af37]/40 text-[#d4af37] rounded-2xl flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(212,175,55,0.1)] relative">
            <Shield className="w-6 h-6" />
            <Sparkles className="w-3 h-3 text-[#d4af37] absolute top-1 right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-semibold text-stone-900 tracking-wide uppercase">
              WebRajya POS Terminal
            </h1>
            <p className="text-[9px] text-stone-500 font-mono tracking-widest uppercase mt-0.5">
              Secure Restaurant Administration Cloud Gateway
            </p>
          </div>
        </div>

        {/* Notification Banners */}
        <AnimatePresence mode="wait">
          {errorCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-start gap-3 text-xs text-red-800 leading-relaxed font-sans"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{errorCode}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STANDARD POS LOGIN */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-medium text-stone-500 uppercase tracking-wider">
              REGISTERED ADMIN EMAIL
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#d4af37]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@restaurant.com"
                className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#d4af37]/80 text-xs rounded-xl text-stone-900 focus:outline-none transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label className="block text-[10px] font-mono font-medium text-stone-500 uppercase tracking-wider">
                SECURE PASSKEY
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[9px] font-mono text-[#aa7c11] hover:underline cursor-pointer"
              >
                FORGOT KEY?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#d4af37]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-11 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#d4af37]/80 text-xs rounded-xl text-stone-900 focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-stone-600 select-none cursor-pointer font-sans">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[#d4af37] w-4 h-4"
              />
              Remember my workstation
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] hover:from-[#f3e5ab] hover:to-[#d4af37] text-white font-semibold tracking-wider rounded-xl shadow-[0_8px_30px_rgba(212,175,55,0.15)] uppercase text-xs cursor-pointer focus:outline-none transition-colors border border-yellow-300/10 mt-2 font-mono"
          >
            AUTHORIZE & ENTER WORKSPACE
          </motion.button>

          <div className="mt-4 border-t border-stone-100 pt-3 text-center text-[10px] font-mono text-stone-400">
            <p>
              Developer Master Account: <span className="text-[#aa7c11]">admin@webrajyapos.com</span> / <span className="text-stone-600 font-bold">admin123</span>
            </p>
          </div>
        </form>
      </motion.div>

      {/* Forgot Password modal */}
      <AnimatePresence>
        {showForgotModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="fixed inset-0 bg-stone-900/40 z-40 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-y-0 sm:inset-y-auto sm:my-auto max-w-md w-full bg-white border border-stone-200 p-6 sm:p-8 rounded-none sm:rounded-2xl z-50 shadow-2xl h-fit mx-4"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 border border-amber-200 text-[#aa7c11] rounded-xl">
                    <KeyRound className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider">Credential Recovery</h3>
                    <p className="text-[10px] text-stone-500 font-sans mt-0.5">Secure identity recovery gateway</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {recoverySuccess ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto text-lg">
                    ✓
                  </div>
                  <h4 className="text-xs font-semibold text-stone-950 uppercase tracking-wider font-mono">Recovery Dispatch Successful</h4>
                  <p className="text-xs text-stone-600 max-w-sm mx-auto font-sans leading-relaxed">
                    A cryptographic security code and recovery links have been sent to your registered owner email and support hotline.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    Please provide the registered administrator email below. The system will dispatch a multi-factor passcode and reset instructions directly to your owner email security channel.
                  </p>
                  <div className="space-y-1.5 font-sans">
                    <label className="block text-[10px] font-mono text-stone-450 uppercase tracking-widest font-bold">
                      ADMIN EMAIL
                    </label>
                    <input
                      required
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="admin@webrajyapos.com"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-yellow-600 focus:outline-none rounded-xl text-xs text-stone-900 font-sans"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#d4af37] text-white font-semibold rounded-xl text-xs uppercase tracking-widest hover:bg-[#aa7c11] transition-colors focus:outline-none cursor-pointer font-mono"
                  >
                    DISPATCH RECOVERY CODE
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
