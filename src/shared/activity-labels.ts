// Copied from the web app (sarigamaparishath/lib/activity-labels.ts). Keep the two in sync.

// Shared display labels and colours for activity categories (list and detail
// pages). Names follow the four core values; colours are the logo's petals.

type Language = 'en' | 'te';

interface CategoryInfo {
  en: string;
  te: string;
  color: string;
}

export const ACTIVITY_CATEGORIES: Record<string, CategoryInfo> = {
  veda: { en: 'Veda Parirakshana', te: 'వేద పరిరక్షణ', color: '#f5d4c1' },
  gau: { en: 'Gou Samrakshana', te: 'గో సంరక్షణ', color: '#e87c72' },
  gnana: { en: 'Gnana Samuparjana', te: 'జ్ఞాన సముపార్జన', color: '#e9d42d' },
  bhakti: { en: 'Bhakthi Samuparjana', te: 'భక్తి సముపార్జన', color: '#4e579c' },
};

export function activityCategoryLabel(category: string, language: Language) {
  return ACTIVITY_CATEGORIES[category]?.[language] || category;
}

export function activityCategoryColor(category: string) {
  return ACTIVITY_CATEGORIES[category]?.color || '#c9a24b';
}
