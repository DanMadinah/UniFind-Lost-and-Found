import { CampusZoneId, ClaimRequest, ItemCategory, ItemKind, LostFoundItem } from '../types';
import { getZoneById } from './matcher';

const STORAGE_KEY = 'unifind_items_v1';
const CLOUD_URL = (import.meta.env?.VITE_FIREBASE_DB_URL as string | undefined)?.replace(/\/+$/, '') || '';

export const isCloudSyncEnabled = CLOUD_URL.length > 0;

export const CATEGORIES: ItemCategory[] = [
  'Electronics',
  'ID & Cards',
  'Keys',
  'Bags & Wallets',
  'Bottles & Umbrellas',
  'Books & Notes',
  'Accessories',
  'Other',
];

export function createInitialItems(): LostFoundItem[] {
  return [
    {
      id: 'UF-205',
      kind: 'FOUND',
      title: 'White Apple AirPods Pro Case',
      description: 'Found on a quiet study table on Level 2 near the power sockets. Has a small dark silicone protective sleeve.',
      category: 'Electronics',
      zoneId: 'LIBRARY',
      spotDetail: 'Level 2 Quiet Study Zone, Desk 14',
      dateOccurred: '2026-11-25',
      status: 'Open',
      reporterName: 'Aisyah Rahman',
      reporterEmail: 'aisyah@campus.edu.my',
      reporterMatric: '2024018211',
      verificationQuestion: 'What color is the silicone case and what initials are written inside the lid?',
      claims: [],
      createdAt: '2026-11-25T10:20:00Z',
      updatedAt: '2026-11-25T10:20:00Z',
    },
    {
      id: 'UF-204',
      kind: 'LOST',
      title: 'Apple AirPods Pro in white charging case',
      description: 'Left my white AirPods Pro with a charcoal silicone cover on a study desk while rushing to a lecture.',
      category: 'Electronics',
      zoneId: 'LIBRARY',
      spotDetail: 'Level 2 Study Area',
      dateOccurred: '2026-11-25',
      status: 'Open',
      reporterName: 'Muhammad Bukar',
      reporterEmail: 'muhammad@campus.edu.my',
      reporterMatric: '2024012345',
      claims: [],
      createdAt: '2026-11-25T12:10:00Z',
      updatedAt: '2026-11-25T12:10:00Z',
    },
    {
      id: 'UF-203',
      kind: 'FOUND',
      title: 'University Student Matric Card + Hostel Key',
      description: 'Picked up near the main entrance steps after the morning assembly. Handed to Campus Security desk.',
      category: 'ID & Cards',
      zoneId: 'LECTURE_HALL',
      spotDetail: 'Main Lecture Hall B Entrance',
      dateOccurred: '2026-11-24',
      status: 'Claim Pending',
      reporterName: 'Campus Security Desk',
      reporterEmail: 'security@campus.edu.my',
      verificationQuestion: 'What is the full matric number printed on the card and the lanyard color?',
      claims: [
        {
          id: 'CLM-101',
          claimantName: 'Daniel Lim',
          claimantEmail: 'daniel@campus.edu.my',
          claimantMatric: '2024099120',
          answer: 'Matric 2024099120 on a navy blue engineering faculty lanyard.',
          note: 'I can collect it at the security counter at 3 PM.',
          status: 'Pending',
          submittedAt: '2026-11-24T15:30:00Z',
        },
      ],
      createdAt: '2026-11-24T09:45:00Z',
      updatedAt: '2026-11-24T15:30:00Z',
    },
    {
      id: 'UF-202',
      kind: 'LOST',
      title: 'Matte Black Insulated Water Flask (750ml)',
      description: 'Left my black thermal bottle with a dent near the bottom on a bench after lunch.',
      category: 'Bottles & Umbrellas',
      zoneId: 'CAFETERIA',
      spotDetail: 'Outdoor seating near drinks stall',
      dateOccurred: '2026-11-24',
      status: 'Open',
      reporterName: 'Nurul Izzah',
      reporterEmail: 'nurul@campus.edu.my',
      reporterMatric: '2024033104',
      claims: [],
      createdAt: '2026-11-24T14:05:00Z',
      updatedAt: '2026-11-24T14:05:00Z',
    },
    {
      id: 'UF-201',
      kind: 'FOUND',
      title: 'Silver Casio Scientific Calculator (fx-570EX)',
      description: 'Found inside Lab 3 drawer after the Digital Electronics lab session.',
      category: 'Electronics',
      zoneId: 'ENGINEERING',
      spotDetail: 'Digital Systems Lab 3, Row 2',
      dateOccurred: '2026-11-23',
      status: 'Returned',
      reporterName: 'Farhan Aziz',
      reporterEmail: 'farhan@campus.edu.my',
      reporterMatric: '2023051109',
      verificationQuestion: 'What sticker is pasted on the inside of the slide cover?',
      claims: [
        {
          id: 'CLM-100',
          claimantName: 'Haziq Zainal',
          claimantEmail: 'haziq@campus.edu.my',
          claimantMatric: '2024041188',
          answer: 'A small yellow robotics club sticker with my name written in marker.',
          note: 'Thank you so much for keeping it safe!',
          status: 'Approved',
          handoverCode: 'UF-8K4M',
          submittedAt: '2026-11-23T16:10:00Z',
          reviewedAt: '2026-11-23T17:00:00Z',
          reviewedBy: 'Farhan Aziz',
        },
      ],
      createdAt: '2026-11-23T13:20:00Z',
      updatedAt: '2026-11-23T17:00:00Z',
    },
  ];
}

export function loadItems(): LostFoundItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as LostFoundItem[];
    }
  } catch {
    // ignore storage errors
  }
  return createInitialItems();
}

export function saveItemsLocal(items: LostFoundItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

function authQuery(idToken?: string): string {
  return idToken ? `?auth=${encodeURIComponent(idToken)}` : '';
}

function normalizeItemMap(raw: unknown): LostFoundItem[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : Object.values(raw as Record<string, LostFoundItem>);
  return arr
    .filter((i): i is LostFoundItem => Boolean(i && typeof i === 'object' && 'id' in i))
    .map((i) => ({ ...i, claims: Array.isArray(i.claims) ? i.claims : [] }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function saveSingleItemCloud(item: LostFoundItem, idToken?: string): Promise<void> {
  if (!isCloudSyncEnabled) return;
  try {
    await fetch(`${CLOUD_URL}/unifind/items/${encodeURIComponent(item.id)}.json${authQuery(idToken)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
  } catch {
    // offline fallback stays in localStorage
  }
}

export async function fetchCloudItems(idToken?: string): Promise<LostFoundItem[] | null> {
  if (!isCloudSyncEnabled) return null;
  try {
    const res = await fetch(`${CLOUD_URL}/unifind/items.json${authQuery(idToken)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const list = normalizeItemMap(data);
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

export function subscribeCloudItems(
  onUpdate: (items: LostFoundItem[]) => void,
  idToken?: string
): () => void {
  if (!isCloudSyncEnabled || typeof EventSource === 'undefined') {
    return () => {};
  }
  const url = `${CLOUD_URL}/unifind/items.json${authQuery(idToken)}`;
  const es = new EventSource(url);

  const handleEvent = () => {
    fetchCloudItems(idToken).then((list) => {
      if (list) onUpdate(list);
    });
  };

  es.addEventListener('put', handleEvent);
  es.addEventListener('patch', handleEvent);
  es.onerror = () => {
    // browser retries SSE automatically
  };

  return () => es.close();
}

export function nextItemId(items: LostFoundItem[]): string {
  const maxNum = items.reduce((acc, item) => {
    const n = Number(item.id.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 200);
  return `UF-${maxNum + 1}`;
}

export function generateHandoverCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'UF-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createItem(
  items: LostFoundItem[],
  input: {
    kind: ItemKind;
    title: string;
    description: string;
    category: ItemCategory;
    zoneId: CampusZoneId;
    spotDetail: string;
    dateOccurred: string;
    reporterName: string;
    reporterEmail: string;
    reporterMatric?: string;
    verificationQuestion?: string;
    photoDataUrl?: string;
  }
): LostFoundItem[] {
  const now = new Date().toISOString();
  const item: LostFoundItem = {
    id: nextItemId(items),
    kind: input.kind,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    zoneId: input.zoneId,
    spotDetail: input.spotDetail.trim(),
    dateOccurred: input.dateOccurred,
    status: 'Open',
    reporterName: input.reporterName.trim(),
    reporterEmail: input.reporterEmail.trim().toLowerCase(),
    reporterMatric: input.reporterMatric?.trim().toUpperCase() || undefined,
    verificationQuestion:
      input.kind === 'FOUND' && input.verificationQuestion?.trim()
        ? input.verificationQuestion.trim()
        : undefined,
    photoDataUrl: input.photoDataUrl,
    claims: [],
    createdAt: now,
    updatedAt: now,
  };
  return [item, ...items];
}

export function submitClaim(
  items: LostFoundItem[],
  itemId: string,
  input: {
    claimantName: string;
    claimantEmail: string;
    claimantMatric: string;
    answer: string;
    note: string;
  }
): LostFoundItem[] {
  const now = new Date().toISOString();
  const claim: ClaimRequest = {
    id: `CLM-${Date.now().toString().slice(-5)}`,
    claimantName: input.claimantName.trim(),
    claimantEmail: input.claimantEmail.trim().toLowerCase(),
    claimantMatric: input.claimantMatric.trim().toUpperCase(),
    answer: input.answer.trim(),
    note: input.note.trim(),
    status: 'Pending',
    submittedAt: now,
  };

  return items.map((item) => {
    if (item.id !== itemId) return item;
    return {
      ...item,
      status: item.status === 'Open' ? 'Claim Pending' : item.status,
      claims: [claim, ...item.claims],
      updatedAt: now,
    };
  });
}

export function reviewClaim(
  items: LostFoundItem[],
  itemId: string,
  claimId: string,
  decision: 'Approved' | 'Rejected',
  reviewerName: string
): LostFoundItem[] {
  const now = new Date().toISOString();
  return items.map((item) => {
    if (item.id !== itemId) return item;
    const updatedClaims = item.claims.map((c) => {
      if (c.id !== claimId) return c;
      return {
        ...c,
        status: decision,
        handoverCode: decision === 'Approved' ? generateHandoverCode() : undefined,
        reviewedAt: now,
        reviewedBy: reviewerName,
      };
    });
    const hasPending = updatedClaims.some((c) => c.status === 'Pending');
    const hasApproved = updatedClaims.some((c) => c.status === 'Approved');
    return {
      ...item,
      status: hasApproved ? 'Claim Pending' : hasPending ? 'Claim Pending' : 'Open',
      claims: updatedClaims,
      updatedAt: now,
    };
  });
}

export function confirmHandover(
  items: LostFoundItem[],
  itemId: string,
  enteredCode: string
): { items: LostFoundItem[]; ok: boolean } {
  const cleanCode = enteredCode.trim().toUpperCase();
  const target = items.find((i) => i.id === itemId);
  if (!target) return { items, ok: false };

  const approved = target.claims.find(
    (c) => c.status === 'Approved' && c.handoverCode?.toUpperCase() === cleanCode
  );
  if (!approved) return { items, ok: false };

  const now = new Date().toISOString();
  const next = items.map((i) => (i.id === itemId ? { ...i, status: 'Returned' as const, updatedAt: now } : i));
  return { items: next, ok: true };
}

export function escapeCsvCell(value: string | number | undefined | null): string {
  let text = value === undefined || value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function itemsToCsv(items: LostFoundItem[]): string {
  const header = ['ID', 'Type', 'Title', 'Category', 'Campus Zone', 'Spot Detail', 'Date', 'Status', 'Claims'];
  const rows = items.map((i) =>
    [
      i.id,
      i.kind,
      i.title,
      i.category,
      getZoneById(i.zoneId).name,
      i.spotDetail,
      i.dateOccurred,
      i.status,
      i.claims.length,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [header.map(escapeCsvCell).join(','), ...rows].join('\n');
}
