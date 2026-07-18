/**
 * restaurantSession.ts
 * ============================================================
 * Restaurant Session Management for POS
 *
 * Stores and retrieves the authenticated restaurant's context
 * (restaurant_id, restaurant_name, user role) across the session.
 *
 * All POS queries automatically use the restaurant_id stored here
 * to maintain strict multi-tenant data isolation.
 * ============================================================
 */

const SESSION_KEY = 'wr_pos_session';
const SUPABASE_SESSION_KEY = 'wr_supabase_session';

export interface RestaurantSession {
  restaurantId: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  authUserId?: string;
  plan?: string;
  branchId?: string;
  branchName?: string;
}

/**
 * Save the restaurant session after successful login.
 */
export function saveRestaurantSession(session: RestaurantSession, rememberMe = true): void {
  const serialized = JSON.stringify(session);
  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, serialized);
  } else {
    sessionStorage.setItem(SESSION_KEY, serialized);
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Load the current restaurant session.
 * Checks localStorage first, then sessionStorage.
 */
export function loadRestaurantSession(): RestaurantSession | null {
  try {
    const stored =
      localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as RestaurantSession;
  } catch {
    return null;
  }
}

/**
 * Get just the restaurant_id from the current session.
 * Returns null if no session exists.
 */
export function getSessionRestaurantId(): string | null {
  return loadRestaurantSession()?.restaurantId ?? null;
}

/**
 * Clear the restaurant session on logout.
 */
export function clearRestaurantSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SUPABASE_SESSION_KEY);
}

/**
 * Check if there is an active restaurant session.
 */
export function hasActiveSession(): boolean {
  return loadRestaurantSession() !== null;
}
