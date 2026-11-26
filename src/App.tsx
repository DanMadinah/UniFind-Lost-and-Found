import { useEffect, useMemo, useState } from 'react';
import {
  Radar,
  Plus,
  Search,
  Sun,
  Moon,
  Bell,
  LogOut,
  Sparkles,
  Download,
  RotateCcw,
  MapPin,
  LayoutGrid,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { CampusMap } from './components/CampusMap';
import { ItemCard } from './components/ItemCard';
import { LoginScreen, SessionUser } from './components/LoginScreen';
import { ReportModal } from './components/ReportModal';
import { ClaimModal } from './components/ClaimModal';
import { findSmartMatches, getZoneById } from './data/matcher';
import {
  CATEGORIES,
  confirmHandover,
  createInitialItems,
  createItem,
  fetchCloudItems,
  isCloudSyncEnabled,
  itemsToCsv,
  loadItems,
  reviewClaim,
  saveItemsLocal,
  saveSingleItemCloud,
  submitClaim,
  subscribeCloudItems,
} from './data/store';
import { CampusZoneId, ItemCategory, ItemKind, LostFoundItem } from './types';

interface AlertItem {
  id: string;
  message: string;
  at: string;
  read: boolean;
}

export default function App() {
  const [session, setSession] = useState<SessionUser | null>(() => {
    try {
      const raw = sessionStorage.getItem('unifind_session');
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  });
  const [items, setItems] = useState<LostFoundItem[]>(() => loadItems());
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOST' | 'FOUND' | 'MATCHES'>('ALL');
  const [selectedZone, setSelectedZone] = useState<CampusZoneId | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [reportModalKind, setReportModalKind] = useState<ItemKind | null>(null);
  const [claimModal, setClaimModal] = useState<{ mode: 'CLAIM' | 'REVIEW'; itemId: string } | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'a-1',
      message: 'Smart Match (90%): Found AirPods Pro (UF-205) matches Lost report UF-204 at Main Library.',
      at: '2026-11-25T12:12:00Z',
      read: false,
    },
  ]);
  const [toast, setToast] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('unifind_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!session || !isCloudSyncEnabled) return;
    let active = true;
    fetchCloudItems(session.idToken).then((cloud) => {
      if (active && cloud) setItems(cloud);
    });
    const unsubscribe = subscribeCloudItems((cloud) => {
      if (active) setItems(cloud);
    }, session.idToken);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [session]);

  useEffect(() => {
    saveItemsLocal(items);
  }, [items]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem('unifind_theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3000);
  };

  const pushAlert = (message: string) => {
    setAlerts((prev) => [{ id: `a-${Date.now()}`, message, at: new Date().toISOString(), read: false }, ...prev.slice(0, 14)]);
  };

  const syncItem = (list: LostFoundItem[], id: string) => {
    const target = list.find((i) => i.id === id);
    if (target) saveSingleItemCloud(target, session?.idToken);
  };

  const smartMatches = useMemo(() => findSmartMatches(items, 45), [items]);

  const bestMatchScoreByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of smartMatches) {
      map.set(m.lostItem.id, Math.max(map.get(m.lostItem.id) ?? 0, m.score));
      map.set(m.foundItem.id, Math.max(map.get(m.foundItem.id) ?? 0, m.score));
    }
    return map;
  }, [smartMatches]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (activeTab === 'LOST' && item.kind !== 'LOST') return false;
      if (activeTab === 'FOUND' && item.kind !== 'FOUND') return false;
      if (selectedZone !== 'ALL' && item.zoneId !== selectedZone) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (q) {
        const hay = `${item.id} ${item.title} ${item.description} ${item.spotDetail} ${getZoneById(item.zoneId).name} ${item.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, activeTab, selectedZone, categoryFilter, search]);

  const stats = useMemo(() => {
    const openLost = items.filter((i) => i.kind === 'LOST' && i.status !== 'Returned').length;
    const openFound = items.filter((i) => i.kind === 'FOUND' && i.status !== 'Returned').length;
    const returned = items.filter((i) => i.status === 'Returned').length;
    return { openLost, openFound, returned, matches: smartMatches.length };
  }, [items, smartMatches]);

  const handleLogin = (user: SessionUser) => {
    setSession(user);
    try {
      sessionStorage.setItem('unifind_session', JSON.stringify(user));
    } catch {
      // ignore
    }
    notify(`Welcome, ${user.name}`);
  };

  const handleLogout = () => {
    setSession(null);
    setShowAlerts(false);
    try {
      sessionStorage.removeItem('unifind_session');
    } catch {
      // ignore
    }
  };

  const handleCreateItem = (data: {
    kind: ItemKind;
    title: string;
    description: string;
    category: ItemCategory;
    zoneId: CampusZoneId;
    spotDetail: string;
    dateOccurred: string;
    verificationQuestion?: string;
    photoDataUrl?: string;
  }) => {
    if (!session) return;
    const next = createItem(items, {
      ...data,
      reporterName: session.name,
      reporterEmail: session.email,
      reporterMatric: session.matricNumber,
    });
    const created = next[0];
    setItems(next);
    syncItem(next, created.id);

    const newMatches = findSmartMatches(next, 45).filter(
      (m) => m.lostItem.id === created.id || m.foundItem.id === created.id
    );
    if (newMatches.length > 0) {
      const top = newMatches[0];
      pushAlert(
        `Smart Match (${top.score}%): ${top.foundItem.title} (${top.foundItem.id}) matches ${top.lostItem.title} (${top.lostItem.id}).`
      );
      notify(`Posted ${created.id} — found ${newMatches.length} potential match(es)!`);
    } else {
      notify(`Published ${created.kind === 'LOST' ? 'Lost' : 'Found'} report ${created.id}`);
    }
  };

  const handleSubmitClaim = (itemId: string, matric: string, answer: string, note: string) => {
    if (!session) return;
    setItems((prev) => {
      const next = submitClaim(prev, itemId, {
        claimantName: session.name,
        claimantEmail: session.email,
        claimantMatric: matric,
        answer,
        note,
      });
      syncItem(next, itemId);
      return next;
    });
    pushAlert(`New ownership claim submitted for ${itemId}. Waiting for verification.`);
    notify(`Claim submitted for ${itemId}!`);
  };

  const handleReviewClaim = (itemId: string, claimId: string, decision: 'Approved' | 'Rejected') => {
    if (!session) return;
    setItems((prev) => {
      const next = reviewClaim(prev, itemId, claimId, decision, session.name);
      syncItem(next, itemId);
      return next;
    });
    pushAlert(`Claim on ${itemId} was ${decision.toLowerCase()} by ${session.name}.`);
    notify(
      decision === 'Approved'
        ? 'Claim approved! One-time handover code generated.'
        : 'Claim rejected.'
    );
  };

  const handleConfirmHandover = (itemId: string, code: string): boolean => {
    const res = confirmHandover(items, itemId, code);
    if (!res.ok) return false;
    setItems(res.items);
    syncItem(res.items, itemId);
    pushAlert(`${itemId} verified with handover code and marked Returned!`);
    notify(`Handover verified! ${itemId} marked Returned.`);
    return true;
  };

  const handleExportCsv = () => {
    const csv = itemsToCsv(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unifind-lost-and-found-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setItems(createInitialItems());
    notify('Sample campus records restored');
  };

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const unreadCount = alerts.filter((a) => !a.read).length;
  const activeClaimItem = claimModal ? items.find((i) => i.id === claimModal.itemId) ?? null : null;

  const navItems = [
    { id: 'ALL' as const, label: 'Explore All', count: items.length, icon: LayoutGrid },
    { id: 'LOST' as const, label: 'Lost Board', count: stats.openLost, icon: HelpCircle },
    { id: 'FOUND' as const, label: 'Found Board', count: stats.openFound, icon: CheckCircle2 },
    { id: 'MATCHES' as const, label: 'Smart Matches', count: stats.matches, icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFAF9] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 bg-dot-grid transition-colors">
      {/* Left Sidebar Rail (Desktop) / Compact Top Bar (Mobile) */}
      <aside className="lg:w-72 lg:min-h-screen lg:sticky lg:top-0 lg:h-screen bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-zinc-200/80 dark:border-zinc-800 p-4 lg:p-5 flex flex-col justify-between gap-5 z-30">
        <div className="space-y-6">
          {/* Brand + Mobile Quick Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <Radar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold tracking-tight leading-none">UniFind</h1>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Campus Lost &amp; Found</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDarkMode((d) => !d)}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600"
                title="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-rose-600"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setReportModalKind('LOST')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Report Lost
            </button>
            <button
              onClick={() => setReportModalKind('FOUND')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Report Found
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((nav) => {
              const Icon = nav.icon;
              const active = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveTab(nav.id)}
                  className={`shrink-0 flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {nav.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {nav.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Compact Returned Counter Pill */}
          <div className="hidden lg:block rounded-2xl bg-gradient-to-br from-indigo-50 to-teal-50 dark:from-indigo-950/40 dark:to-teal-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Campus Recovery Rate
            </div>
            <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
              {stats.returned} Returned
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isCloudSyncEnabled ? 'Live Firebase Cloud Sync' : 'Demo Browser Storage'}
            </div>
          </div>
        </div>

        {/* Bottom User Profile & Security Tools */}
        <div className="hidden lg:block space-y-2.5 pt-4 border-t border-zinc-200/80 dark:border-zinc-800">
          {session.role === 'SECURITY' && (
            <div className="flex gap-2">
              <button
                onClick={handleExportCsv}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button
                onClick={handleReset}
                title="Reset sample records"
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-600"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/70">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
              {session.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold truncate">{session.name}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                {session.role} {session.matricNumber ? `· ${session.matricNumber}` : ''}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Discovery Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Floating Search & Notifications Strip */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search AirPods, matric card, Library, UF-205..."
              className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-full pl-11 pr-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlerts((v) => !v)}
              className="relative p-3 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:border-indigo-400"
              title="Match Notifications"
            >
              <Bell className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showAlerts && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold">Smart Match Alerts</span>
                  <button
                    onClick={() => setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                  {alerts.map((a) => (
                    <div key={a.id} className={`px-4 py-3 text-xs ${a.read ? 'opacity-65' : 'bg-indigo-50/50 dark:bg-indigo-950/30'}`}>
                      <div className="font-medium leading-snug">{a.message}</div>
                      <div className="text-[10px] text-zinc-400 mt-1">{new Date(a.at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Blueprint Campus Radar Map */}
        <CampusMap items={items} selectedZone={selectedZone} onSelectZone={setSelectedZone} />

        {/* Horizontal Category Filter Pills */}
        {activeTab !== 'MATCHES' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
                categoryFilter === 'ALL'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                  categoryFilter === c
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Smart Matches or Pinboard Feed */}
        {activeTab === 'MATCHES' ? (
          <div className="space-y-4">
            {smartMatches.length === 0 ? (
              <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center text-sm text-zinc-500">
                No automatic matches above 45% right now. New reports are matched automatically.
              </div>
            ) : (
              smartMatches.map((m) => (
                <div
                  key={`${m.lostItem.id}-${m.foundItem.id}`}
                  className="rounded-3xl bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900 p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-extrabold">
                        <Sparkles className="w-3.5 h-3.5" /> {m.score}% Match
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{m.reasons.join(' · ')}</span>
                    </div>
                    <button
                      onClick={() => setClaimModal({ mode: 'CLAIM', itemId: m.foundItem.id })}
                      className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      Claim {m.foundItem.id}
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900 p-4">
                      <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                        Lost · {m.lostItem.id}
                      </div>
                      <div className="font-display text-sm font-bold mt-1">{m.lostItem.title}</div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{m.lostItem.description}</p>
                      <div className="text-[11px] text-zinc-500 mt-2 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {getZoneById(m.lostItem.zoneId).name} · {m.lostItem.dateOccurred}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900 p-4">
                      <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase">
                        Found · {m.foundItem.id}
                      </div>
                      <div className="font-display text-sm font-bold mt-1">{m.foundItem.title}</div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{m.foundItem.description}</p>
                      <div className="text-[11px] text-zinc-500 mt-2 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {getZoneById(m.foundItem.zoneId).name} · {m.foundItem.dateOccurred}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currentEmail={session.email}
                role={session.role}
                matchScore={bestMatchScoreByItem.get(item.id)}
                onOpenClaim={(target) => setClaimModal({ mode: 'CLAIM', itemId: target.id })}
                onOpenReview={(target) => setClaimModal({ mode: 'REVIEW', itemId: target.id })}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="md:col-span-2 rounded-3xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center text-sm text-zinc-500">
                No lost or found reports match your current filters.
              </div>
            )}
          </div>
        )}
      </main>

      {reportModalKind && (
        <ReportModal
          defaultKind={reportModalKind}
          onClose={() => setReportModalKind(null)}
          onSubmit={handleCreateItem}
        />
      )}

      {claimModal && activeClaimItem && (
        <ClaimModal
          mode={claimModal.mode}
          item={activeClaimItem}
          defaultMatric={session.matricNumber}
          onClose={() => setClaimModal(null)}
          onSubmitClaim={handleSubmitClaim}
          onReviewClaim={handleReviewClaim}
          onConfirmHandover={handleConfirmHandover}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-xl border border-indigo-500/40">
          {toast}
        </div>
      )}
    </div>
  );
}
