// Default fallback hashes if env is empty:
// 1234      -> 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
// admin123  -> 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
// waves2026 -> d6c2346a387f9acf67d80c91fd3cb8db307752d4da3ec1a3729843749f2c9d9c
// cashier   -> 6a79b51fec89db977e62d3b5aee3ea8b9de93cabf2446aae7d6f517db6d16178

const DEFAULT_HASHES = [
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
  'd6c2346a387f9acf67d80c91fd3cb8db307752d4da3ec1a3729843749f2c9d9c', // waves2026
  '6a79b51fec89db977e62d3b5aee3ea8b9de93cabf2446aae7d6f517db6d16178', // cashier
  '178e85082878ce620385813880c99fef268cfef3892905db7b7bff8cf071d43e', // default .env hash
];

const AUTH_STORAGE_KEY = 'waves_drawer_auth_session';

export interface AuthSession {
  isAuthenticated: boolean;
  loginTime: string;
  userLabel?: string;
}

/**
 * Pure JavaScript SHA-256 implementation (works in non-HTTPS / HTTP contexts where window.crypto.subtle is undefined)
 */
function sha256PureJs(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash.unshift((temp1 + temp2) | 0);
      hash.pop();
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Computes SHA-256 hash using native Web Crypto API when available, with pure JS fallback
 */
export async function computeSha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const enc = new TextEncoder();
      const data = enc.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }
  return sha256PureJs(text);
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
 * First checks via server endpoint (supports runtime Coolify env vars), with client fallback
 */
export async function verifyPassword(password: string): Promise<boolean> {
  if (!password) return false;

  // 1. Try server verification first (reads runtime Coolify env vars)
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch {
    // Backend unreachable, fallback to client verification
  }

  // 2. Client-side fallback check
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
