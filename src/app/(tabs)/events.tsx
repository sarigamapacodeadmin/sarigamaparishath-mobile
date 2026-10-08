import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { EventStatusBadge } from '../../components/event-status';
import { Banner, Card, Chip, Loading, styles as ui } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { useLanguage } from '../../lib/language';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import { eventCategoryLabel } from '../../shared/event-labels';
import type { ParishathEvent } from '../../shared/types';

// Upcoming events first (soonest at the top), then past events (most recent first),
// as on the website's /events
function sortUpcomingFirst(events: ParishathEvent[]) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const key = (e: ParishathEvent) => `${(e.event_date || '').slice(0, 10)} ${(e.event_time || '99:99').slice(0, 5)}`;
  const upcoming = events.filter((e) => (e.event_date || '').slice(0, 10) >= today);
  const past = events.filter((e) => (e.event_date || '').slice(0, 10) < today);
  upcoming.sort((a, b) => key(a).localeCompare(key(b)));
  past.sort((a, b) => key(b).localeCompare(key(a)));
  return [...upcoming, ...past];
}

const STATUSES = ['all', 'upcoming', 'ongoing', 'completed'] as const;

export default function EventsScreen() {
  const { language, t } = useLanguage();
  const [events, setEvents] = useState<ParishathEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all');
  const [category, setCategory] = useState('all');

  const load = useCallback(async () => {
    setError('');
    const { data, error: dbError } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true, nullsFirst: false });
    if (dbError) setError(t('Could not load events. Pull down to try again.', 'కార్యక్రమాలు లోడ్ కాలేదు. మళ్ళీ ప్రయత్నించడానికి క్రిందికి లాగండి.'));
    else setEvents(sortUpcomingFirst((data as ParishathEvent[]) || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const categories = useMemo(() => Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[], [events]);

  const shown = events.filter((e) => {
    if (status !== 'all' && e.status !== status) return false;
    if (category !== 'all' && e.category !== category) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const title = language === 'en' ? e.title_en : e.title_te;
    const desc = (language === 'en' ? e.description_en : e.description_te) || '';
    return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  });

  const statusLabel = (s: string) =>
    s === 'all' ? t('All', 'అన్నీ') : { upcoming: t('Upcoming', 'రాబోయే'), ongoing: t('Ongoing', 'జరుగుతోంది'), completed: t('Completed', 'పూర్తయింది') }[s] || s;

  const header = (
    <View>
      <TextInput
        style={[ui.input, { marginBottom: 12 }]}
        placeholder={t('Search events', 'కార్యక్రమాలను వెతకండి')}
        placeholderTextColor={colors.subtle}
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.chips}>
        {STATUSES.map((s) => (
          <Chip key={s} label={statusLabel(s)} selected={status === s} onPress={() => setStatus(s)} />
        ))}
      </View>
      {categories.length > 1 && (
        <View style={styles.chips}>
          <Chip label={t('All categories', 'అన్ని వర్గాలు')} selected={category === 'all'} onPress={() => setCategory('all')} />
          {categories.map((c) => (
            <Chip key={c} label={eventCategoryLabel(c, language)} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      )}
      <Banner type="error" text={error} />
    </View>
  );

  return (
    <FlatList
      style={ui.screen}
      contentContainerStyle={ui.screenContent}
      data={loading ? [] : shown}
      keyExtractor={(e) => String(e.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={loading ? <Loading /> : !error ? <Text style={ui.muted}>{t('No events found.', 'కార్యక్రమాలు ఏవీ లేవు.')}</Text> : null}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          colors={[colors.brand600]}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      renderItem={({ item: e }) => (
        <Pressable onPress={() => router.push(`/event/${e.id}`)} accessibilityRole="button">
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {e.image_url ? <Image source={{ uri: e.image_url }} style={styles.image} resizeMode="cover" /> : null}
            <View style={{ padding: 16 }}>
              <EventStatusBadge status={e.status} language={language} />
              <Text style={styles.title}>{language === 'en' ? e.title_en : e.title_te}</Text>
              <Text style={styles.date}>
                📅 {formatDate(e.event_date, language)}
                {e.event_time ? `  •  ${e.event_time.slice(0, 5)}` : ''}
              </Text>
              {(e.location_en || e.location_te) && <Text style={ui.muted}>📍 {language === 'en' ? e.location_en : e.location_te}</Text>}
              {e.capacity ? (
                <Text style={[ui.muted, { marginTop: 4 }]}>
                  {t('Registered', 'నమోదైనవారు')}: {e.registered_count ?? 0} / {e.capacity}
                </Text>
              ) : null}
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  image: { width: '100%', height: 170, backgroundColor: colors.gold100 },
  title: { fontSize: 18, color: colors.brand600, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  date: { color: colors.vermilion600, fontWeight: '600', marginBottom: 4 },
});
