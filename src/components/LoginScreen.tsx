import { useState } from 'react';
import { Compass, Mail, User, Lock, GraduationCap, ShieldCheck, AlertCircle, Hash } from 'lucide-react';
import { UserRole } from '../types';
import { firebaseEmailAuth, isFirebaseAuthEnabled } from '../data/firebaseAuth';

export interface SessionUser {
  name: string;
  email: string;
  role: UserRole;
  matricNumber?: string;
  idToken?: string;
  isDemoAuth: boolean;
}

interface LoginScreenProps {
  onLogin: (user: SessionUser) => void;
}

const DEMO_SECURITY_CODE = 'sec123';

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMatric = matricNumber.trim().toUpperCase();

    if (cleanName.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid university email address.');
      return;
    }

    if (isFirebaseAuthEnabled) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await firebaseEmailAuth(authMode, cleanEmail, password);
        onLogin({
          name: cleanName,
          email: res.email,
          role: res.role,
          matricNumber: res.role === 'STUDENT' && cleanMatric ? cleanMatric : undefined,
          idToken: res.idToken,
          isDemoAuth: false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (role === 'STUDENT' && cleanMatric.length < 3) {
      setError('Please enter your matric number.');
      return;
    }
    if (role === 'SECURITY' && staffCode.trim() !== DEMO_SECURITY_CODE) {
      setError('Invalid Campus Security demo code.');
      return;
    }

    onLogin({
      name: cleanName,
      email: cleanEmail,
      role,
      matricNumber: role === 'STUDENT' ? cleanMatric : undefined,
      isDemoAuth: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-6 border-b-4 border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">UniFind</h1>
              <p className="text-xs text-slate-300">
                {isFirebaseAuthEnabled
                  ? 'University Lost & Found · Firebase Auth'
                  : 'University Lost & Found · Demo Access (Prototype)'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isFirebaseAuthEnabled ? (
            <div className="grid grid-cols-2 gap-2">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setAuthMode(m);
                    setError('');
                  }}
                  className={`py-2 rounded-xl border text-xs font-bold transition ${
                    authMode === m
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('STUDENT');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                  role === 'STUDENT'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" /> Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('SECURITY');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                  role === 'SECURITY'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Campus Security
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Muhammad Bukar"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">University Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.edu.my"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {isFirebaseAuthEnabled ? (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Matric Number (Students)</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    placeholder="e.g. 2024012345"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          ) : role === 'STUDENT' ? (
            <div>
              <label className="block text-xs font-semibold mb-1">Matric Number</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  required
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  placeholder="e.g. 2024012345"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold mb-1">Campus Security Demo Code</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  required
                  type="password"
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
                  placeholder="Enter demo code"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Prototype demo code: <code className="font-mono font-semibold">{DEMO_SECURITY_CODE}</code>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition"
          >
            {loading ? 'Signing in...' : 'Enter UniFind'}
          </button>

          <p className="text-[11px] text-center text-slate-400">
            {isFirebaseAuthEnabled
              ? 'Secured with Firebase Auth & backend role rules.'
              : 'Demo mode only (browser storage). Configure Firebase env vars for live auth & sync.'}
          </p>
        </form>
      </div>
    </div>
  );
}
