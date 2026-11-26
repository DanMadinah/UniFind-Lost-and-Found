import { MapPin, Calendar, ShieldCheck, KeyRound, CheckCircle2, Tag, Sparkles } from 'lucide-react';
import { getZoneById } from '../data/matcher';
import { LostFoundItem, UserRole } from '../types';

interface ItemCardProps {
  item: LostFoundItem;
  currentEmail: string;
  role: UserRole;
  matchScore?: number;
  onOpenClaim: (item: LostFoundItem) => void;
  onOpenReview: (item: LostFoundItem) => void;
}

export function ItemCard({
  item,
  currentEmail,
  role,
  matchScore,
  onOpenClaim,
  onOpenReview,
}: ItemCardProps) {
  const zone = getZoneById(item.zoneId);
  const isOwner = item.reporterEmail.toLowerCase() === currentEmail.toLowerCase();
  const canReview = role === 'SECURITY' || isOwner;
  const pendingClaims = item.claims.filter((c) => c.status === 'Pending').length;
  const myApprovedClaim = item.claims.find(
    (c) => c.status === 'Approved' && c.claimantEmail.toLowerCase() === currentEmail.toLowerCase()
  );

  return (
    <article className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {item.photoDataUrl && (
        <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
          <img src={item.photoDataUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {item.id}
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                item.kind === 'LOST'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {item.kind === 'LOST' ? 'Lost Item' : 'Found Item'}
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                item.status === 'Returned'
                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  : item.status === 'Claim Pending'
                    ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
              }`}
            >
              {item.status}
            </span>
            {matchScore !== undefined && matchScore >= 45 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                <Sparkles className="w-3 h-3" /> {matchScore}% Match
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{item.title}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {zone.name} · {item.spotDetail}
            </span>
            <span className="inline-flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> {item.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {item.dateOccurred}
            </span>
          </div>
        </div>

        {/* Approved Handover Code Banner (visible ONLY to the approved claimant) */}
        {myApprovedClaim && item.status !== 'Returned' && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Claim Approved! Show code at pickup:
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Contact: {item.reporterName} ({item.reporterEmail})
              </div>
            </div>
            <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-lg bg-emerald-600 text-white tracking-wider">
              {myApprovedClaim.handoverCode}
            </span>
          </div>
        )}

        {/* Footer & Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            {isOwner || role === 'SECURITY'
              ? `Reported by ${item.reporterName}`
              : 'Reporter contact hidden until claim approved'}
          </span>

          <div className="flex items-center gap-2">
            {item.status === 'Returned' ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Returned to Owner
              </span>
            ) : (
              <>
                {item.kind === 'FOUND' && !isOwner && (
                  <button
                    onClick={() => onOpenClaim(item)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                  >
                    Claim This Item
                  </button>
                )}

                {canReview && item.kind === 'FOUND' && item.claims.length > 0 && (
                  <button
                    onClick={() => onOpenReview(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Review Claims ({pendingClaims > 0 ? `${pendingClaims} pending` : item.claims.length})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
