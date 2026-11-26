import { describe, it, expect } from 'vitest';
import {
  confirmHandover,
  createInitialItems,
  createItem,
  escapeCsvCell,
  itemsToCsv,
  reviewClaim,
  submitClaim,
} from '../src/data/store';

describe('UniFind Store & Claim Verification', () => {
  it('creates a Found item with a verification question and approves a claim with handover code', () => {
    const initial = createInitialItems();
    const afterCreate = createItem(initial, {
      kind: 'FOUND',
      title: 'Blue USB-C Power Bank',
      description: 'Found near Lecture Hall C charging bench.',
      category: 'Electronics',
      zoneId: 'LECTURE_HALL',
      spotDetail: 'Hall C Back Row',
      dateOccurred: '2026-11-26',
      reporterName: 'Aiman',
      reporterEmail: 'aiman@campus.edu.my',
      verificationQuestion: 'What brand is printed on the front?',
    });

    const createdId = afterCreate[0].id;
    expect(createdId).toBe('UF-206');

    const afterClaim = submitClaim(afterCreate, createdId, {
      claimantName: 'Muhammad Bukar',
      claimantEmail: 'muhammad@campus.edu.my',
      claimantMatric: '2024012345',
      answer: 'Anker 10000mAh with a scratch on the corner',
      note: 'Can pick up after 4 PM',
    });

    const claimedItem = afterClaim.find((i) => i.id === createdId)!;
    expect(claimedItem.status).toBe('Claim Pending');
    expect(claimedItem.claims.length).toBe(1);

    const claimId = claimedItem.claims[0].id;
    const afterApprove = reviewClaim(afterClaim, createdId, claimId, 'Approved', 'Aiman');
    const approvedClaim = afterApprove.find((i) => i.id === createdId)!.claims[0];
    expect(approvedClaim.status).toBe('Approved');
    expect(approvedClaim.handoverCode).toMatch(/^UF-[A-Z0-9]{4}$/);

    // Wrong code must fail
    const badHandover = confirmHandover(afterApprove, createdId, 'UF-0000');
    expect(badHandover.ok).toBe(false);

    // Correct code marks item Returned
    const goodHandover = confirmHandover(afterApprove, createdId, approvedClaim.handoverCode!);
    expect(goodHandover.ok).toBe(true);
    expect(goodHandover.items.find((i) => i.id === createdId)!.status).toBe('Returned');
  });

  it('escapes CSV formulas and quotes safely', () => {
    expect(escapeCsvCell('=SUM(A1:A5)')).toBe('"\'=SUM(A1:A5)"');
    expect(escapeCsvCell('+1+1')).toBe('"\'+1+1"');
    expect(escapeCsvCell('Hello, "Campus"')).toBe('"Hello, ""Campus"""');

    const csv = itemsToCsv(createInitialItems());
    expect(csv).toContain('"UF-205"');
  });
});
