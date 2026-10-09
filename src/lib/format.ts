import type { Language } from '../shared/types';

// Dates as the website shows them, e.g. "Sat, Oct 18, 2026" / Telugu month names
export function formatDate(value: string, language: Language, style: 'short' | 'long' = 'short') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(language === 'en' ? 'en-US' : 'te-IN', {
    weekday: style,
    month: style,
    day: 'numeric',
    year: 'numeric',
  });
}

// Telugu if present, else English (and the other way round): blog posts may have only one
export function pick(language: Language, en?: string | null, te?: string | null) {
  return language === 'te' ? (te?.trim() ? te : en || '') : en?.trim() ? en : te || '';
}
