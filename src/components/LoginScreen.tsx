import { useState } from 'react';
import {
  Radar,
  Mail,
  User,
  Lock,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  Hash,
  Link2,
  MapPin,
  KeyRound,
} from 'lucide-react';
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
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#FAFAF9] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Left Showcase Panel */}
      <div className="lg:col-span-7 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-teal-500 text-white p-8 sm:p-12 flex flex-col justify-between">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center">
            <Radar className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold tracking-tight">UniFind</div>
            <div className="text-xs text-indigo-100">University Lost &amp; Found Network</div>
          </div>
        </div>

        <div className="relative z-10 my-10 space-y-6 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold">
            <Link2 className="w-3.5 h-3.5" /> Auto-Match + Campus Radar
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight">
            Lost it on campus? Let the campus find it.
          </h1>
          <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
            Pin lost or found items on the live campus map, get automatic match alerts, and verify ownership with one-time pickup codes.
          </p>

          {/* Floating Preview Cards */}
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-teal-400/25 text-teal-50">90% Match</span>
                <span className="font-mono text-indigo-100">UF-205</span>
              </div>
              <div className="font-bold text-sm">White AirPods Pro Case</div>
              <div className="text-xs text-indigo-100 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Main Library · Level 2
              </div>
            </div>

            <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-50">Verified Pickup</span>
                <KeyRound className="w-3.5 h-3.5 text-amber-200" />
              </div>
              <div className="font-bold text-sm">One-Time Handover Code</div>
              <div className="font-mono text-sm font-bold tracking-widest text-teal-200">UF-8K4M</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-100/80">
          Built by Muhammad Abdullahi Bukar · {isFirebaseAuthEnabled ? 'Firebase Auth & Cloud Sync Active' : 'Demo Prototype Mode'}
        </div>
      </div>

      {/* Right Clean Auth Form */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-10 bg-dot-grid">
        <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-7 sm:p-8 shadow-xl space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {isFirebaseAuthEnabled
                ? authMode === 'signin'
                  ? 'Welcome back'
                  : 'Create student account'
                : 'Sign in to UniFind'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {isFirebaseAuthEnabled
                ? 'Authenticate with your university email to report or claim items.'
                : 'Demo Access (Prototype) — choose a role to explore.'}
            </p>
          </div>

          {isFirebaseAuthEnabled ? (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 gap-1">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setAuthMode(m);
                    setError('');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    authMode === m
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 gap-1">
              <button
                type="button"
                onClick={() => {
                  setRole('STUDENT');
                  setError('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                  role === 'STUDENT'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-zinc-500'
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
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                  role === 'SECURITY'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-zinc-500'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Security
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-3 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muhammad Bukar"
                  className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">University Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@campus.edu.my"
                  className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>

            {isFirebaseAuthEnabled ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                    Matric Number <span className="font-normal text-zinc-400">(optional for staff)</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value)}
                      placeholder="e.g. 2024012345"
                      className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            ) : role === 'STUDENT' ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Matric Number</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    required
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    placeholder="e.g. 2024012345"
                    className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Security Demo Code</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    required
                    type="password"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    placeholder="Enter demo code"
                    className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Demo code: <code className="font-mono font-bold">{DEMO_SECURITY_CODE}</code>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition"
            >
              {loading ? 'Authenticating...' : 'Continue to UniFind'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
