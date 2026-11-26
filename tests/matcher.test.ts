import { describe, it, expect } from 'vitest';
import { findSmartMatches, scorePair } from '../src/data/matcher';
import { createInitialItems } from '../src/data/store';

describe('UniFind Smart Matching Engine', () => {
  it('gives a high match score for same category, same zone, matching keywords, and close dates', () => {
    const items = createInitialItems();
    const foundAirpods = items.find((i) => i.id === 'UF-205')!;
    const lostAirpods = items.find((i) => i.id === 'UF-204')!;

    const result = scorePair(lostAirpods, foundAirpods);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.reasons.some((r) => r.includes('Same category'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Same zone'))).toBe(true);
  });

  it('finds active matches automatically and ignores already returned items', () => {
    const items = createInitialItems();
    const matches = findSmartMatches(items, 45);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].lostItem.id).toBe('UF-204');
    expect(matches[0].foundItem.id).toBe('UF-205');
    expect(matches.every((m) => m.foundItem.status !== 'Returned')).toBe(true);
  });
});
