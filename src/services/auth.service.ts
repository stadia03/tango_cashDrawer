// Default fallback hashes if env is empty:
// 1234      -> 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
// admin123  -> 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
// waves2026 -> d6c2346a387f9acf67d80c91fd3cb8db307752d4da3ec1a3729843749f2c9d9c
// cashier   -> 6a79b51fec89db977e62d3b5aee3ea8b9de93cabf2446aae7d6f517db6d16178

const DEFAULT_HASHES = [
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'd6c2346a387f9acf67d80c91fd3cb8db307752d4da3ec1a3729843749f2c9d9c',
  '6a79b51fec89db977e62d3b5aee3ea8b9de93cabf2446aae7d6f517db6d16178',
];

const AUTH_STORAGE_KEY = 'waves_drawer_auth_session';

export interface AuthSession {
  isAuthenticated: boolean;
  loginTime: string;
  userLabel?: string;
}

/**
 * Computes SHA-256 hash using native Web Crypto API
 */
export async function computeSha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves allowed hashes from Vite environment variables or defaults
 */
export function getAllowedHashes(): string[] {
  const envHashes = import.meta.env.VITE_AUTH_HASHES;
  if (typeof envHashes === 'string' && envHashes.trim().length > 0) {
    const list = envHashes
      .split(',')
      .map(h => h.trim().toLowerCase())
      .filter(h => h.length === 64);
    if (list.length > 0) return list;
  }
  return DEFAULT_HASHES;
}

/**
 * Verifies a plain text password against allowed SHA-256 hashes
 */
export async function verifyPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const computedHash = await computeSha256(password);
  const allowed = getAllowedHashes();
  return allowed.includes(computedHash.toLowerCase());
}

/**
 * Gets current session from localStorage
 */
export function getStoredSession(): AuthSession | null {
  try {
    const item = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item) as AuthSession;
    if (parsed && parsed.isAuthenticated) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Saves authenticated session
 */
export function saveSession(userLabel: string = 'Staff'): void {
  const session: AuthSession = {
    isAuthenticated: true,
    loginTime: new Date().toISOString(),
    userLabel,
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Clears current session
 */
export function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
