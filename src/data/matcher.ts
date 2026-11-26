import { CampusZone, CampusZoneId, LostFoundItem, MatchSuggestion } from '../types';

export const CAMPUS_ZONES: CampusZone[] = [
  {
    id: 'LIBRARY',
    name: 'Main Library',
    shortName: 'Library',
    x: 245,
    y: 125,
    neighbors: ['LECTURE_HALL', 'CAFETERIA', 'ENGINEERING'],
  },
  {
    id: 'ENGINEERING',
    name: 'Engineering & IT Block',
    shortName: 'Eng & IT',
    x: 560,
    y: 115,
    neighbors: ['LIBRARY', 'LECTURE_HALL', 'SPORTS'],
  },
  {
    id: 'LECTURE_HALL',
    name: 'Central Lecture Halls',
    shortName: 'Lecture Halls',
    x: 405,
    y: 215,
    neighbors: ['LIBRARY', 'ENGINEERING', 'CAFETERIA', 'SURAU'],
  },
  {
    id: 'CAFETERIA',
    name: 'Student Cafeteria',
    shortName: 'Cafeteria',
    x: 185,
    y: 270,
    neighbors: ['LIBRARY', 'LECTURE_HALL', 'HOSTEL', 'BUS_HUB'],
  },
  {
    id: 'SURAU',
    name: 'Campus Surau / Mosque',
    shortName: 'Surau',
    x: 575,
    y: 270,
    neighbors: ['LECTURE_HALL', 'SPORTS', 'HOSTEL'],
  },
  {
    id: 'HOSTEL',
    name: 'Hostel Residential Complex',
    shortName: 'Hostels',
    x: 340,
    y: 365,
    neighbors: ['CAFETERIA', 'SURAU', 'BUS_HUB'],
  },
  {
    id: 'SPORTS',
    name: 'Sports Complex',
    shortName: 'Sports',
    x: 695,
    y: 195,
    neighbors: ['ENGINEERING', 'SURAU'],
  },
  {
    id: 'BUS_HUB',
    name: 'Campus Shuttle & Bus Hub',
    shortName: 'Bus Hub',
    x: 115,
    y: 385,
    neighbors: ['CAFETERIA', 'HOSTEL'],
  },
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'near', 'from', 'that', 'this', 'was', 'have',
  'lost', 'found', 'item', 'left', 'inside', 'around', 'block', 'room', 'very',
  'some', 'your', 'mine', 'into', 'onto', 'over', 'under', 'blue', 'small',
]);

export function getZoneById(id: CampusZoneId): CampusZone {
  return CAMPUS_ZONES.find((z) => z.id === id) ?? CAMPUS_ZONES[0];
}

export function tokenizeText(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return Array.from(new Set(words));
}

/**
 * Computes a weighted 0..100 match score between a LOST report and a FOUND report.
 * Weights:
 * - Category match: 35 pts
 * - Location proximity (exact zone = 25 pts, neighboring zone = 12 pts)
 * - Keyword overlap in title/description/spot: up to 30 pts
 * - Date proximity (<= 3 days = 10 pts, <= 7 days = 5 pts)
 */
export function scorePair(lostItem: LostFoundItem, foundItem: LostFoundItem): MatchSuggestion {
  let score = 0;
  const reasons: string[] = [];

  if (lostItem.category === foundItem.category) {
    score += 35;
    reasons.push(`Same category (${lostItem.category})`);
  }

  const lostZone = getZoneById(lostItem.zoneId);
  if (lostItem.zoneId === foundItem.zoneId) {
    score += 25;
    reasons.push(`Same zone (${lostZone.shortName})`);
  } else if (lostZone.neighbors.includes(foundItem.zoneId)) {
    score += 12;
    reasons.push(`Nearby zone (${getZoneById(foundItem.zoneId).shortName})`);
  }

  const lostTokens = tokenizeText(`${lostItem.title} ${lostItem.description} ${lostItem.spotDetail}`);
  const foundTokens = tokenizeText(`${foundItem.title} ${foundItem.description} ${foundItem.spotDetail}`);
  const foundSet = new Set(foundTokens);
  const shared = lostTokens.filter((t) => foundSet.has(t));

  if (shared.length > 0) {
    const keywordPts = Math.min(30, shared.length * 10);
    score += keywordPts;
    reasons.push(`Keywords: ${shared.slice(0, 3).join(', ')}`);
  }

  const lostTime = Date.parse(lostItem.dateOccurred);
  const foundTime = Date.parse(foundItem.dateOccurred);
  if (!Number.isNaN(lostTime) && !Number.isNaN(foundTime)) {
    const diffDays = Math.abs(foundTime - lostTime) / (1000 * 60 * 60 * 24);
    if (diffDays <= 3) {
      score += 10;
      reasons.push('Reported within 3 days');
    } else if (diffDays <= 7) {
      score += 5;
      reasons.push('Reported within 7 days');
    }
  }

  return {
    lostItem,
    foundItem,
    score: Math.min(100, score),
    reasons,
  };
}

/**
 * Finds all active LOST <-> FOUND matches above the minimum score threshold,
 * sorted highest score first.
 */
export function findSmartMatches(items: LostFoundItem[], minScore = 45): MatchSuggestion[] {
  const lostList = items.filter((i) => i.kind === 'LOST' && i.status !== 'Returned');
  const foundList = items.filter((i) => i.kind === 'FOUND' && i.status !== 'Returned');

  const matches: MatchSuggestion[] = [];
  for (const lost of lostList) {
    for (const found of foundList) {
      const result = scorePair(lost, found);
      if (result.score >= minScore) {
        matches.push(result);
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
