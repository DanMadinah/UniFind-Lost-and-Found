import { useEffect, useMemo, useState } from 'react';
import {
  Compass,
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
} from 'lucide-react';
import { CampusMap } from './components/CampusMap';
import { ItemCard } from './components/ItemCard';
import { LoginScreen, SessionUser } from './components/LoginScreen';
import { ReportModal } from './components/ReportModal';
import { ClaimModal } from './components/ClaimModal';
import { CAMPUS_ZONES, findSmartMatches, getZoneById } from './data/matcher';
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
    notify(`Signed in as ${user.name}`);
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
        ? `Claim approved! One-time handover code generated.`
        : `Claim rejected.`
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b-4 border-emerald-500 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight leading-tight">UniFind</h1>
              <p className="text-[11px] text-slate-300">University Lost &amp; Found · Muhammad Abdullahi Bukar</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-1.5 border border-slate-700 text-xs">
              <span className="font-semibold">{session.name}</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600 font-bold">
                {session.role}
              </span>
            </div>

            <button
              onClick={() => setReportModalKind('LOST')}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white"
            >
              <Plus className="w-3.5 h-3.5" /> Report Lost
            </button>
            <button
              onClick={() => setReportModalKind('FOUND')}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
            >
              <Plus className="w-3.5 h-3.5" /> Report Found
            </button>

            {session.role === 'SECURITY' && (
              <>
                <button
                  onClick={handleExportCsv}
                  title="Export CSV Log"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button
                  onClick={handleReset}
                  title="Reset sample records (Security only)"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Match & Claim Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowAlerts((v) => !v)}
                className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700"
                title="Match & Claim Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showAlerts && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold">Notifications</span>
                    <button
                      onClick={() => setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {alerts.map((a) => (
                      <div key={a.id} className={`px-4 py-3 text-xs ${a.read ? 'opacity-65' : 'bg-emerald-50/50 dark:bg-emerald-950/30'}`}>
                        <div className="font-medium leading-snug">{a.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{new Date(a.at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setDarkMode((d) => !d)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-300" />}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 border-l-4 border-l-rose-500">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Open Lost Reports</div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{stats.openLost}</div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 border-l-4 border-l-emerald-500">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Open Found Items</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.openFound}</div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 border-l-4 border-l-violet-500">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Smart Matches Found</div>
            <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">{stats.matches}</div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 border-l-4 border-l-slate-700 dark:border-l-slate-400">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Successfully Returned</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.returned}</div>
          </div>
        </div>

        {/* Interactive Campus Map */}
        <CampusMap items={items} selectedZone={selectedZone} onSelectZone={setSelectedZone} />

        {/* View Tabs & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 gap-1">
            {([
              { id: 'ALL', label: 'All Items' },
              { id: 'LOST', label: 'Lost' },
              { id: 'FOUND', label: 'Found' },
              { id: 'MATCHES', label: `Smart Matches (${smartMatches.length})` },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            {isCloudSyncEnabled ? 'Live Cloud Sync Active' : 'Demo Mode (Browser Storage)'}
          </span>
        </div>

        {activeTab !== 'MATCHES' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item, brand, building, or ID (e.g. UF-205)..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value as CampusZoneId | 'ALL')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold"
            >
              <option value="ALL">All Campus Zones</option>
              {CAMPUS_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Smart Matches View */}
        {activeTab === 'MATCHES' ? (
          <div className="space-y-3.5">
            {smartMatches.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500">
                No automatic matches above 45% right now. New reports are matched automatically.
              </div>
            ) : (
              smartMatches.map((m) => (
                <div
                  key={`${m.lostItem.id}-${m.foundItem.id}`}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900 p-5 space-y-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-extrabold">
                        <Sparkles className="w-3.5 h-3.5" /> {m.score}% Match Score
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{m.reasons.join(' · ')}</span>
                    </div>
                    <button
                      onClick={() => setClaimModal({ mode: 'CLAIM', itemId: m.foundItem.id })}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Claim Found Item ({m.foundItem.id})
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3.5">
                      <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                        Lost Report · {m.lostItem.id}
                      </div>
                      <div className="text-sm font-bold mt-0.5">{m.lostItem.title}</div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{m.lostItem.description}</p>
                      <div className="text-[11px] text-slate-500 mt-2 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {getZoneById(m.lostItem.zoneId).name} · {m.lostItem.dateOccurred}
                      </div>
                    </div>

                    <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-3.5">
                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                        Found Report · {m.foundItem.id}
                      </div>
                      <div className="text-sm font-bold mt-0.5">{m.foundItem.title}</div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{m.foundItem.description}</p>
                      <div className="text-[11px] text-slate-500 mt-2 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {getZoneById(m.foundItem.zoneId).name} · {m.foundItem.dateOccurred}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Item Cards Grid */
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
              <div className="md:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500">
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
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-emerald-500/40">
          {toast}
        </div>
      )}
    </div>
  );
}
