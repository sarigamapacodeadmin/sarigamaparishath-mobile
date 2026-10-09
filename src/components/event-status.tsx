import { Text, View } from 'react-native';
import { colors } from '../lib/theme';
import { eventStatusLabel } from '../shared/event-labels';
import type { Language } from '../shared/types';

// Badge colours as on the website: indigo upcoming, gold ongoing, muted completed, vermilion cancelled
const BADGE: Record<string, { bg: string; fg: string }> = {
  upcoming: { bg: colors.brand600, fg: colors.white },
  ongoing: { bg: colors.gold500, fg: colors.brand700 },
  completed: { bg: colors.brand100, fg: colors.brand700 },
  cancelled: { bg: colors.vermilion50, fg: colors.vermilion700 },
};

export function EventStatusBadge({ status, language }: { status: string; language: Language }) {
  const c = BADGE[status] || BADGE.completed;
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: c.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ color: c.fg, fontWeight: '600', fontSize: 12 }}>{eventStatusLabel(status, language)}</Text>
    </View>
  );
}
