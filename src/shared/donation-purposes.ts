// Copied from the web app (sarigamaparishath/lib/donation-purposes.ts). Keep the two in sync.

// Donation purposes shared by the donations page and the receipts.
// A Gou Dattata donation records the chosen cow and period in its purpose,
// as "gou_dattata:<cow name or 'any'>:<months>", so it reaches the donations
// table and the receipt without new columns.

export interface GouDattata {
  cow: string | null; // null: the Parishath chooses the cow
  months: number;
}

export function gouDattataPurpose(cow: string, months: number): string {
  return `gou_dattata:${cow.replace(/:/g, ' ').trim() || 'any'}:${months}`;
}

export function parseGouDattata(purpose: string | null | undefined): GouDattata | null {
  if (!purpose?.startsWith('gou_dattata:')) return null;
  const parts = purpose.split(':');
  const months = Number(parts[parts.length - 1]) || 0;
  const cow = parts.slice(1, -1).join(':');
  return { cow: cow && cow !== 'any' ? cow : null, months };
}

// The purpose key without any Gou Dattata details, e.g. "gou_dattata".
export function purposeKey(purpose: string | null | undefined): string {
  return (purpose || '').split(':')[0];
}

export function gouDattataPeriod(months: number, language: 'en' | 'te'): string {
  if (months === 12) return language === 'en' ? 'one year' : 'ఒక సంవత్సరం';
  return language === 'en' ? `${months} months` : `${months} నెలలు`;
}
