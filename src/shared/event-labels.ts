// Copied from the web app (sarigamaparishath/lib/event-labels.ts). Keep the two in sync.

// Shared display labels for events (list and detail pages).

type Language = 'en' | 'te';

const STATUS_LABELS: Record<string, Record<Language, string>> = {
  upcoming: { en: 'Upcoming', te: 'రాబోయే' },
  ongoing: { en: 'Ongoing', te: 'జరుగుతోంది' },
  completed: { en: 'Completed', te: 'పూర్తయింది' },
  cancelled: { en: 'Cancelled', te: 'రద్దు చేయబడింది' },
};

// Badge colours in the site palette: indigo upcoming, gold ongoing,
// muted completed, vermilion cancelled.
const STATUS_BADGE: Record<string, string> = {
  upcoming: 'bg-brand-600 text-white',
  ongoing: 'bg-gold-500 text-brand-900',
  completed: 'bg-brand-100 text-brand-700',
  cancelled: 'bg-vermilion-50 text-vermilion-700',
};

const CATEGORY_LABELS: Record<string, Record<Language, string>> = {
  puja: { en: 'Puja', te: 'పూజ' },
  vedic: { en: 'Vedic', te: 'వైదికం' },
  festival: { en: 'Festival', te: 'ఉత్సవం' },
  homam: { en: 'Homam', te: 'హోమం' },
};

export function eventStatusLabel(status: string, language: Language) {
  return STATUS_LABELS[status]?.[language] || status;
}

export function eventStatusBadge(status: string) {
  return STATUS_BADGE[status] || 'bg-brand-100 text-brand-700';
}

// Unknown categories fall back to the stored value.
export function eventCategoryLabel(category: string, language: Language) {
  return CATEGORY_LABELS[category]?.[language] || category;
}
