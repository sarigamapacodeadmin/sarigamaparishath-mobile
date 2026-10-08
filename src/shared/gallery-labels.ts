// Copied from the web app (sarigamaparishath/lib/gallery-labels.ts). Keep the two in sync.

// Display labels for gallery photo categories. The core value categories reuse
// the activity names; anything else falls back to the event labels, then the
// stored value.
import { ACTIVITY_CATEGORIES } from './activity-labels';
import { eventCategoryLabel } from './event-labels';

type Language = 'en' | 'te';

const GALLERY_LABELS: Record<string, Record<Language, string>> = {
  events: { en: 'Events', te: 'కార్యక్రమాలు' },
};

export function galleryCategoryLabel(category: string, language: Language) {
  return (
    GALLERY_LABELS[category]?.[language] ||
    ACTIVITY_CATEGORIES[category]?.[language] ||
    eventCategoryLabel(category, language)
  );
}
