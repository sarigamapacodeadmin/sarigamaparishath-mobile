// Which Demuni Swaram quote to show today. Copied from the web app's
// lib/daily-quote.ts; keep the two identical apart from this header comment.
// The card shows the active rows of the quotes table in Quote ID order, one a
// day from 1 January (India time); repeats are switched off in the table.

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

// Position (from 0) of today's quote among the active quotes in Quote ID order
export function quoteIndexFor(now: Date, activeCount: number): number {
  return (istDayOfYear(now) - 1) % activeCount;
}

export const QUOTE_LABELS = {
  en: {
    title: 'Demuni Swaram',
    subtitle: 'Thought for the day',
    by: 'Sri Sri Sri Chandrasekharendra Saraswathi Maha Swami',
    showContext: 'Show the context of this quote',
    hideContext: 'Hide the context',
  },
  te: {
    title: 'దేముని స్వరం',
    subtitle: 'నేటి సూక్తి',
    by: 'శ్రీ శ్రీ శ్రీ చంద్రశేఖరేంద్ర సరస్వతీ మహాస్వామి',
    showContext: 'ఈ సూక్తి సందర్భం చూపించు',
    hideContext: 'సందర్భం దాచు',
  },
} as const;
