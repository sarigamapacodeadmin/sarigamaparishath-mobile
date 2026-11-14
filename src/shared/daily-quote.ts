// Which Deivathin Kural quote to show today. Copied from the web app's
// lib/daily-quote.ts; keep the two identical apart from this header comment.
// The quotes table holds 365 quotes, Q-001 to Q-365, one for each day of the
// year counted in India (1 January = Q-001). In a leap year 31 December wraps round to Q-001.

export const QUOTE_COUNT = 365;

const IST_MS = 5.5 * 60 * 60 * 1000;

export interface DailyQuote {
  id: string;
  quote_telugu: string;
  quote_english: string;
  context: string | null;
  footer_note: string | null;
}

// Day of the year in India, 1 to 366
export function istDayOfYear(now: Date): number {
  const ist = new Date(now.getTime() + IST_MS);
  const start = Date.UTC(ist.getUTCFullYear(), 0, 1);
  const today = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
  return Math.round((today - start) / 86400000) + 1;
}

export function quoteIdFor(now: Date): string {
  const n = ((istDayOfYear(now) - 1) % QUOTE_COUNT) + 1;
  return `Q-${String(n).padStart(3, '0')}`;
}

export const QUOTE_LABELS = {
  en: {
    title: 'Deivathin Kural',
    subtitle: 'Thought for the day',
    by: 'Sri Kanchi Paramacharya',
    showContext: 'Show the context of this quote',
    hideContext: 'Hide the context',
  },
  te: {
    title: 'దైవత్తిన్ కురల్',
    subtitle: 'నేటి సూక్తి',
    by: 'శ్రీ కంచి పరమాచార్య',
    showContext: 'ఈ సూక్తి సందర్భం చూపించు',
    hideContext: 'సందర్భం దాచు',
  },
} as const;
