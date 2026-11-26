export type UserRole = 'STUDENT' | 'SECURITY';

export type ItemKind = 'LOST' | 'FOUND';

export type ItemStatus = 'Open' | 'Claim Pending' | 'Returned';

export type ItemCategory =
  | 'Electronics'
  | 'ID & Cards'
  | 'Keys'
  | 'Bags & Wallets'
  | 'Bottles & Umbrellas'
  | 'Books & Notes'
  | 'Accessories'
  | 'Other';

export type CampusZoneId =
  | 'LIBRARY'
  | 'ENGINEERING'
  | 'CAFETERIA'
  | 'LECTURE_HALL'
  | 'HOSTEL'
  | 'SURAU'
  | 'SPORTS'
  | 'BUS_HUB';

export interface CampusZone {
  id: CampusZoneId;
  name: string;
  shortName: string;
  x: number; // SVG 0..800
  y: number; // SVG 0..460
  neighbors: CampusZoneId[];
}

export interface ClaimRequest {
  id: string;
  claimantName: string;
  claimantEmail: string;
  claimantMatric: string;
  answer: string;
  note: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  handoverCode?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface LostFoundItem {
  id: string;
  kind: ItemKind;
  title: string;
  description: string;
  category: ItemCategory;
  zoneId: CampusZoneId;
  spotDetail: string;
  dateOccurred: string; // YYYY-MM-DD
  status: ItemStatus;
  reporterName: string;
  reporterEmail: string;
  reporterMatric?: string;
  verificationQuestion?: string;
  photoDataUrl?: string;
  claims: ClaimRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchSuggestion {
  lostItem: LostFoundItem;
  foundItem: LostFoundItem;
  score: number; // 0..100
  reasons: string[];
}
