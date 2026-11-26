import { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, XCircle, KeyRound, AlertCircle } from 'lucide-react';
import { LostFoundItem } from '../types';

interface ClaimModalProps {
  mode: 'CLAIM' | 'REVIEW';
  item: LostFoundItem;
  defaultMatric?: string;
  onClose: () => void;
  onSubmitClaim: (itemId: string, matric: string, answer: string, note: string) => void;
  onReviewClaim: (itemId: string, claimId: string, decision: 'Approved' | 'Rejected') => void;
  onConfirmHandover: (itemId: string, code: string) => boolean;
}

export function ClaimModal({
  mode,
  item,
  defaultMatric,
  onClose,
  onSubmitClaim,
  onReviewClaim,
  onConfirmHandover,
}: ClaimModalProps) {
  const [matric, setMatric] = useState(defaultMatric ?? '');
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');
  const [handoverInput, setHandoverInput] = useState('');
  const [error, setError] = useState('');

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matric.trim().length < 3 || answer.trim().length < 3) {
      setError('Please enter your matric number and answer the verification question.');
      return;
    }
    onSubmitClaim(item.id, matric, answer, note);
    onClose();
  };

  const handleHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onConfirmHandover(item.id, handoverInput);
    if (!ok) {
      setError('Handover code does not match any approved claim.');
      return;
    }
    onClose();
  };

  const hasApprovedClaim = item.claims.some((c) => c.status === 'Approved');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {mode === 'CLAIM' ? `Claim ${item.id}: ${item.title}` : `Review Claims · ${item.id}`}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {mode === 'CLAIM' ? (
            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Ownership Verification Question
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {item.verificationQuestion || 'Describe a unique detail about this item that proves it is yours.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Your Matric Number</label>
                <input
                  required
                  value={matric}
                  onChange={(e) => setMatric(e.target.value)}
                  placeholder="e.g. 2024012345"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Your Answer</label>
                <textarea
                  required
                  rows={3}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Provide specific details only the owner would know..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Preferred Pickup Time / Note (Optional)</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Free after 2 PM near the Library"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Submit Claim for Verification
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {item.verificationQuestion && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <b className="text-slate-800 dark:text-slate-200">Question asked:</b> {item.verificationQuestion}
                </div>
              )}

              <div className="space-y-3">
                {item.claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2 bg-slate-50/70 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {claim.claimantName}{' '}
                        <span className="font-mono font-normal text-slate-500">({claim.claimantMatric})</span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          claim.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : claim.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      <b>Answer:</b> {claim.answer}
                    </p>
                    {claim.note && <p className="text-xs text-slate-500">Note: {claim.note}</p>}

                    {claim.status === 'Approved' && claim.handoverCode && (
                      <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        Expected Handover Code: <code className="font-mono font-extrabold">{claim.handoverCode}</code>
                      </div>
                    )}

                    {claim.status === 'Pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => onReviewClaim(item.id, claim.id, 'Approved')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Generate Code
                        </button>
                        <button
                          onClick={() => onReviewClaim(item.id, claim.id, 'Rejected')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {hasApprovedClaim && (
                <form
                  onSubmit={handleHandoverSubmit}
                  className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3.5 space-y-2"
                >
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Complete Physical Handover
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                    Ask the student for their 6-character handover code at pickup and enter it below to mark the item Returned.
                  </p>
                  <div className="flex gap-2">
                    <input
                      required
                      value={handoverInput}
                      onChange={(e) => {
                        setHandoverInput(e.target.value);
                        setError('');
                      }}
                      placeholder="e.g. UF-8K4M"
                      className="flex-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-1.5 text-xs font-mono uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Confirm Return
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
