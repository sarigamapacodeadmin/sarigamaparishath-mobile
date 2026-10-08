import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Banner, Card, Chip, Loading, styles as ui } from '../../components/ui';
import { fetchActivities } from '../../lib/api';
import { useLanguage } from '../../lib/language';
import { colors } from '../../lib/theme';
import { ACTIVITY_CATEGORIES, activityCategoryColor, activityCategoryLabel } from '../../shared/activity-labels';
import type { Activity } from '../../shared/types';

const CATEGORY_OPTIONS = [
  { value: 'all', en: 'All Activities', te: 'అన్ని కార్యకలాపాలు' },
  ...Object.entries(ACTIVITY_CATEGORIES).map(([value, c]) => ({ value, en: c.en, te: c.te })),
];

export default function ActivitiesScreen() {
  const { language, t } = useLanguage();
  const [category, setCategory] = useState('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setActivities(await fetchActivities(category));
    } catch {
      setError(t('Could not load activities. Pull down to try again.', 'కార్యకలాపాలు లోడ్ కాలేదు. మళ్ళీ ప్రయత్నించడానికి క్రిందికి లాగండి.'));
    }
  }, [category, t]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const header = (
    <View>
      <Text style={styles.heading}>{t('Choose a category', 'వర్గాన్ని ఎంచుకోండి')}</Text>
      <View style={styles.chips}>
        {CATEGORY_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            label={language === 'en' ? o.en : o.te}
            selected={category === o.value}
            onPress={() => setCategory(o.value)}
            dotColor={o.value === 'all' ? undefined : activityCategoryColor(o.value)}
          />
        ))}
      </View>
      <Banner type="error" text={error} />
    </View>
  );

  return (
    <FlatList
      style={ui.screen}
      contentContainerStyle={ui.screenContent}
      data={loading ? [] : activities}
      keyExtractor={(a) => String(a.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={
        loading ? <Loading /> : !error ? <Text style={ui.muted}>{t('No activities in this category yet.', 'ఈ వర్గంలో ఇంకా కార్యకలాపాలు లేవు.')}</Text> : null
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand600]} />}
      renderItem={({ item: a }) => (
        <Pressable onPress={() => router.push(`/activity/${a.id}`)} accessibilityRole="button">
          <Card style={{ borderTopColor: activityCategoryColor(a.category) }}>
            <View style={styles.row}>
              <Text style={styles.icon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.category}>{activityCategoryLabel(a.category, language)}</Text>
                <Text style={styles.title}>{language === 'en' ? a.title_en : a.title_te}</Text>
              </View>
            </View>
            <Text style={ui.muted} numberOfLines={3}>
              {language === 'en' ? a.description_en : a.description_te}
            </Text>
            {(a.schedule_en || a.frequency_en) && (
              <View style={styles.meta}>
                <Text style={styles.schedule}>{language === 'en' ? a.schedule_en : a.schedule_te}</Text>
                <Text style={ui.muted}>{language === 'en' ? a.frequency_en : a.frequency_te}</Text>
              </View>
            )}
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 16, color: colors.brand600, fontWeight: '600', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { fontSize: 34, marginRight: 12 },
  category: { fontSize: 12, color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 18, color: colors.brand600, fontWeight: '600' },
  meta: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  schedule: { color: colors.vermilion600, fontWeight: '600' },
});
