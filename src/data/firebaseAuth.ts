import { UserRole } from '../types';

const API_KEY = (import.meta.env?.VITE_FIREBASE_API_KEY as string | undefined)?.trim() || '';
const DB_URL = (import.meta.env?.VITE_FIREBASE_DB_URL as string | undefined)?.replace(/\/+$/, '') || '';

export const isFirebaseAuthEnabled = API_KEY.length > 0 && DB_URL.length > 0;

export interface FirebaseAuthResult {
  uid: string;
  email: string;
  idToken: string;
  role: UserRole;
}

/**
 * Authenticates via Firebase Identity Toolkit REST API and reads
 * the backend-assigned role from /unifind/roles/<uid>.
 */
export async function firebaseEmailAuth(
  mode: 'signin' | 'signup',
  email: string,
  password: string
): Promise<FirebaseAuthResult> {
  const endpoint =
    mode === 'signup'
      ? `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`
      : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) {
    const code = data?.error?.message || 'Authentication failed';
    throw new Error(code.replace(/_/g, ' '));
  }

  const uid = String(data.localId);
  const idToken = String(data.idToken);

  let role: UserRole = 'STUDENT';
  try {
    const roleRes = await fetch(`${DB_URL}/unifind/roles/${uid}.json?auth=${encodeURIComponent(idToken)}`);
    if (roleRes.ok) {
      const r = await roleRes.json();
      if (r === 'SECURITY' || r === 'STUDENT') {
        role = r;
      }
    }
  } catch {
    role = 'STUDENT';
  }

  return { uid, email: String(data.email || email), idToken, role };
}
