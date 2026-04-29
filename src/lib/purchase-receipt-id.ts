/**
 * Deterministic display id for a completed purchase row (code + purchase date + referral id).
 * Returns null when there is no purchase yet.
 */
export function formatPurchaseReceiptId(input: {
  id: string;
  codeUsed: string;
  purchaseAt: string | null;
}): string | null {
  if (!input.purchaseAt) {
    return null;
  }
  const ymd = input.purchaseAt.slice(0, 10).replace(/-/g, '');
  const suffix = input.id.replace(/-/g, '').slice(-8).toUpperCase();
  return `INV-${input.codeUsed}-${ymd}-${suffix}`;
}
