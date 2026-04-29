import { describe, expect, it } from 'vitest';

import { formatPurchaseReceiptId } from './purchase-receipt-id';

describe('formatPurchaseReceiptId', () => {
  it('returns null when purchaseAt is null', () => {
    expect(
      formatPurchaseReceiptId({
        id: 'abc-def-123',
        codeUsed: 'CODE',
        purchaseAt: null,
      }),
    ).toBeNull();
  });

  it('builds INV line from code, YYYYMMDD, and last 8 chars of compact id', () => {
    expect(
      formatPurchaseReceiptId({
        id: '550e8400-e29b-41d4-a716-446655440000',
        codeUsed: '4XYKDBJ6XC',
        purchaseAt: '2026-04-29T12:00:00.000Z',
      }),
    ).toBe('INV-4XYKDBJ6XC-20260429-55440000');
  });
});
