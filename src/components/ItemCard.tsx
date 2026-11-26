import { MapPin, Calendar, ShieldCheck, KeyRound, CheckCircle2, Link2, Tag } from 'lucide-react';
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
    <article className="group rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all overflow-hidden flex flex-col">
      {/* Visual Header Banner or Photo */}
      {item.photoDataUrl ? (
        <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <img
            src={item.photoDataUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm ${
                item.kind === 'LOST' ? 'bg-rose-600/90 text-white' : 'bg-teal-600/90 text-white'
              }`}
            >
              {item.kind === 'LOST' ? 'Lost' : 'Found'}
            </span>
            {matchScore !== undefined && matchScore >= 45 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-600/90 text-white backdrop-blur-md">
                <Link2 className="w-3 h-3" /> {matchScore}% Match
              </span>
            )}
          </div>
          <span className="absolute top-3 right-3 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-950/75 text-white backdrop-blur-md">
            {item.id}
          </span>
        </div>
      ) : (
        <div
          className={`px-5 py-3.5 flex items-center justify-between gap-2 ${
            item.kind === 'LOST'
              ? 'bg-gradient-to-r from-rose-500/10 via-fuchsia-500/5 to-transparent border-b border-rose-100 dark:border-rose-950'
              : 'bg-gradient-to-r from-teal-500/10 via-indigo-500/5 to-transparent border-b border-teal-100 dark:border-teal-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                item.kind === 'LOST'
                  ? 'bg-rose-600 text-white'
                  : 'bg-teal-600 text-white'
              }`}
            >
              {item.kind === 'LOST' ? 'Lost' : 'Found'}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1">
              <Tag className="w-3 h-3" /> {item.category}
            </span>
            {matchScore !== undefined && matchScore >= 45 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                <Link2 className="w-3 h-3" /> {matchScore}%
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">{item.id}</span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-bold text-zinc-900 dark:text-white leading-snug">
              {item.title}
            </h3>
            <span
              className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                item.status === 'Returned'
                  ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                  : item.status === 'Claim Pending'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
              }`}
            >
              {item.status}
            </span>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{item.description}</p>

          <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium">
              <MapPin className="w-3 h-3 text-indigo-500" />
              {zone.shortName} · {item.spotDetail}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              <Calendar className="w-3 h-3" /> {item.dateOccurred}
            </span>
          </div>
        </div>

        {/* Approved Handover Code Ticket */}
        {myApprovedClaim && item.status !== 'Returned' && (
          <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-600 text-white p-3.5 flex items-center justify-between gap-2 shadow-md">
            <div>
              <div className="text-[11px] font-bold flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Pickup Approved! Show code:
              </div>
              <div className="text-[11px] text-indigo-100 mt-0.5">
                {item.reporterName} · {item.reporterEmail}
              </div>
            </div>
            <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-xl bg-white text-indigo-700 tracking-wider">
              {myApprovedClaim.handoverCode}
            </span>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-400 truncate">
            {isOwner || role === 'SECURITY' ? `By ${item.reporterName}` : 'Contact protected'}
          </span>

          <div className="flex items-center gap-2">
            {item.status === 'Returned' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                <CheckCircle2 className="w-4 h-4" /> Returned
              </span>
            ) : (
              <>
                {item.kind === 'FOUND' && !isOwner && (
                  <button
                    onClick={() => onOpenClaim(item)}
                    className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
                  >
                    Claim Item
                  </button>
                )}

                {canReview && item.kind === 'FOUND' && item.claims.length > 0 && (
                  <button
                    onClick={() => onOpenReview(item)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Claims ({pendingClaims > 0 ? pendingClaims : item.claims.length})
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
