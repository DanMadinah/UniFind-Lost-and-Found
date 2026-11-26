import { useState } from 'react';
import { X, Upload, AlertCircle, ShieldQuestion } from 'lucide-react';
import { CAMPUS_ZONES } from '../data/matcher';
import { CATEGORIES } from '../data/store';
import { CampusZoneId, ItemCategory, ItemKind } from '../types';

interface ReportModalProps {
  defaultKind: ItemKind;
  onClose: () => void;
  onSubmit: (data: {
    kind: ItemKind;
    title: string;
    description: string;
    category: ItemCategory;
    zoneId: CampusZoneId;
    spotDetail: string;
    dateOccurred: string;
    verificationQuestion?: string;
    photoDataUrl?: string;
  }) => void;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ReportModal({ defaultKind, onClose, onSubmit }: ReportModalProps) {
  const [kind, setKind] = useState<ItemKind>(defaultKind);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [zoneId, setZoneId] = useState<CampusZoneId>('LIBRARY');
  const [spotDetail, setSpotDetail] = useState('');
  const [dateOccurred, setDateOccurred] = useState(() => new Date().toISOString().slice(0, 10));
  const [verificationQuestion, setVerificationQuestion] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  const [error, setError] = useState('');

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Image must be smaller than 2 MB.');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setPhotoDataUrl(compressed);
      setError('');
    } catch {
      setError('Could not process the selected image.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || description.trim().length < 8 || !spotDetail.trim()) {
      setError('Please fill in the item title, description, and exact spot.');
      return;
    }
    if (kind === 'FOUND' && verificationQuestion.trim().length < 6) {
      setError('Please add a short verification question so only the true owner can claim it.');
      return;
    }
    onSubmit({
      kind,
      title,
      description,
      category,
      zoneId,
      spotDetail,
      dateOccurred,
      verificationQuestion: kind === 'FOUND' ? verificationQuestion : undefined,
      photoDataUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Report {kind === 'LOST' ? 'a Lost Item' : 'a Found Item'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['LOST', 'FOUND'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  kind === k
                    ? k === 'LOST'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {k === 'LOST' ? 'I Lost Something' : 'I Found Something'}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1">Item Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === 'LOST' ? 'e.g. Black Casio Calculator fx-570EX' : 'e.g. White AirPods Pro Case'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Date {kind === 'LOST' ? 'Lost' : 'Found'}</label>
              <input
                type="date"
                required
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Campus Zone</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value as CampusZoneId)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
              >
                {CAMPUS_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Exact Spot</label>
              <input
                required
                value={spotDetail}
                onChange={(e) => setSpotDetail(e.target.value)}
                placeholder="e.g. Level 2 Study Desk 14"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Color, brand, or visible details (avoid revealing secret identifiers for Found items)."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {kind === 'FOUND' && (
            <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                <ShieldQuestion className="w-4 h-4" /> Ownership Verification Question
              </label>
              <input
                required
                value={verificationQuestion}
                onChange={(e) => setVerificationQuestion(e.target.value)}
                placeholder="e.g. What sticker is on the back? / What is the lock-screen wallpaper?"
                className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1">Photo (Optional, max 2 MB)</label>
            <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
              <Upload className="w-4 h-4 text-emerald-600" />
              {photoDataUrl ? 'Photo attached (click to replace)' : 'Upload photo of item'}
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
            {photoDataUrl && (
              <img src={photoDataUrl} alt="Preview" className="mt-2 h-28 w-full object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              Publish Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
