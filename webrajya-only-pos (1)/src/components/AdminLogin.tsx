import React, { useState, useEffect } from "react";
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB, supabase, isSupabaseConfigured } from "../lib/db";
import {
  saveRestaurantSession,
  clearRestaurantSession,
} from "../lib/restaurantSession";

interface AdminLoginProps {
  onLoginSuccess: (token: string, rememberMe: boolean) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Pre-fill email if remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem("ij_admin_remember_email");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // ─── SUPABASE AUTH LOGIN ─────────────────────────────────
  const handleSupabaseLogin = async (emailVal: string, passVal: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailVal.toLowerCase(),
        password: passVal,
      });

      if (authError || !authData?.user) {
        console.warn("[POS Login] Supabase Auth failed:", authError?.message);
        return false;
      }

      const userId = authData.user.id;

      // Look up their restaurant_id from restaurant_users table
      const { data: userRow, error: userErr } = await supabase
        .from("restaurant_users")
        .select("restaurant_id, role")
        .eq("user_id", userId)
        .maybeSingle();

      if (userErr || !userRow) {
        console.warn("[POS Login] No restaurant_users row found for userId:", userId, userErr?.message);
        return false;
      }

      // Fetch the restaurant details
      const { data: restaurantRow, error: restErr } = await supabase
        .from("restaurants")
        .select("id, name, owner_name, email, plan")
        .eq("id", userRow.restaurant_id)
        .maybeSingle();

      if (restErr || !restaurantRow) {
        console.warn("[POS Login] Failed to load restaurant details:", restErr?.message);
        return false;
      }

      // Save session with full restaurant context
      saveRestaurantSession(
        {
          restaurantId: restaurantRow.id,
          restaurantName: restaurantRow.name,
          ownerName: restaurantRow.owner_name,
          email: restaurantRow.email,
          role: userRow.role as "owner" | "manager" | "staff",
          authUserId: userId,
          plan: restaurantRow.plan,
        },
        rememberMe
      );

      // Also save to localStorage for legacy components
      localStorage.setItem("wr_restaurant_id", restaurantRow.id);

      console.log(
        `[POS Login] ✅ Supabase Auth success. Restaurant: "${restaurantRow.name}" (${restaurantRow.id})`
      );
      return true;
    } catch (err: any) {
      console.error("[POS Login] Supabase Auth exception:", err.message);
      return false;
    }
  };

  // ─── LOCAL FALLBACK LOGIN ────────────────────────────────
  const handleLocalFallbackLogin = (emailVal: string, passVal: string): boolean => {
    const isMasterEmail = emailVal.toLowerCase() === "admin@webrajyapos.com";
    const isMasterPassword = passVal === "admin123" || passVal === "password123";

    if (isMasterEmail && isMasterPassword) {
      // Save a demo session
      const sessionRestId = localStorage.getItem("wr_restaurant_id") || "restaurant-demo";
      saveRestaurantSession(
        {
          restaurantId: sessionRestId,
          restaurantName: "WebRajya Demo Restaurant",
          ownerName: "Admin User",
          email: emailVal,
          role: "owner",
        },
        rememberMe
      );
      return true;
    }
    return false;
  };

  // ─── MAIN SUBMIT HANDLER ─────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);

    if (!email.trim() || !password.trim()) {
      setErrorCode("Please enter both your registered email and password.");
      return;
    }

    setIsLoading(true);

    try {
      let loginSuccess = false;

      // 1. Try Supabase Auth
      if (isSupabaseConfigured) {
        loginSuccess = await handleSupabaseLogin(email.trim(), password);
      }

      // 2. Fallback to local master credentials if Supabase fails
      if (!loginSuccess) {
        loginSuccess = handleLocalFallbackLogin(email.trim(), password);
      }

      if (loginSuccess) {
        // Build a session token for the existing app routing logic
        const payload = btoa(
          JSON.stringify({
            sub: email,
            role: "Owner",
            email: email,
            iat: Date.now(),
          })
        );
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const sig = "wr_pos_" + Math.random().toString(36).substr(2, 12);
        const token = `${header}.${payload}.${sig}`;

        if (rememberMe) {
          localStorage.setItem("ij_admin_remember_email", email);
        } else {
          localStorage.removeItem("ij_admin_remember_email");
        }

        LocalDB.addAuditLog("Admin Authorized", `Owner admin logged in via ${isSupabaseConfigured ? "Supabase Auth" : "local fallback"}`, "Admin");
        onLoginSuccess(token, rememberMe);
      } else {
        setErrorCode(
          "Invalid credentials. If you are a restaurant owner, please check your email and password. Demo: admin@webrajyapos.com / admin123"
        );
        LocalDB.addAuditLog("Access Denied", `Failed login attempt for account ${email}`, "System Gateway");
      }
    } catch (err: any) {
      setErrorCode("Authentication error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#FAF9F5] text-stone-800 flex items-center justify-center relative p-4 font-sans select-none overflow-hidden"
      id="admin-login-screen"
    >
      {/* Decorative Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#d4af37]/8 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-[#d4af37]/5 blur-[200px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)", backgroundSize: "28px 28px"}} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-stone-200/80 rounded-3xl shadow-2xl shadow-stone-900/10 p-8 space-y-6">
          
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/30 mb-1">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">WebRajya POS</h1>
              <p className="text-sm text-stone-500 mt-0.5">Restaurant Management Portal</p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-700 font-medium">
              {isSupabaseConfigured ? "Supabase Auth secured connection" : "Local demo mode active"}
            </span>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errorCode && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-xl p-3.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 font-medium leading-relaxed">{errorCode}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="pos-login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="owner@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="pos-login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                id="pos-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
              />
              <label htmlFor="pos-remember-me" className="text-xs text-stone-500 cursor-pointer">
                Keep me signed in
              </label>
            </div>

            {/* Submit */}
            <button
              id="pos-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to POS</span>
              )}
            </button>
          </form>

          {/* Footer hint */}
          <div className="text-center text-[11px] text-stone-400 border-t border-stone-100 pt-4">
            Use your restaurant owner credentials to access the POS portal.
            <br />
            Demo: <span className="font-mono text-stone-600">admin@webrajyapos.com / admin123</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
