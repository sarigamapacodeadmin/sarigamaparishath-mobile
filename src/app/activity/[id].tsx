import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Card, Loading, Screen, styles as ui } from '../../components/ui';
import { fetchActivity } from '../../lib/api';
import { useLanguage } from '../../lib/language';
import { colors } from '../../lib/theme';
import { activityCategoryColor, activityCategoryLabel } from '../../shared/activity-labels';
import type { Activity } from '../../shared/types';

type Bilingual = 'schedule' | 'frequency' | 'location' | 'duration' | 'level' | 'instructor' | 'requirements' | 'benefits';

const DETAILS: { key: Bilingual; en: string; te: string }[] = [
  { key: 'schedule', en: 'Schedule', te: 'సమయం' },
  { key: 'frequency', en: 'Frequency', te: 'తరచుదనం' },
  { key: 'location', en: 'Location', te: 'స్థలం' },
  { key: 'duration', en: 'Duration', te: 'వ్యవధి' },
  { key: 'level', en: 'Level', te: 'స్థాయి' },
  { key: 'instructor', en: 'Guided by', te: 'మార్గదర్శకులు' },
  { key: 'requirements', en: 'Requirements', te: 'అవసరాలు' },
  { key: 'benefits', en: 'Benefits', te: 'ప్రయోజనాలు' },
];

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t } = useLanguage();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchActivity(id)
      .then(setActivity)
      .catch(() => setError(t('This activity could not be found.', 'ఈ కార్యక్రమం కనబడలేదు.')));
    // t changes with language; the activity itself doesn't need reloading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <Screen>
        <Banner type="error" text={error} />
      </Screen>
    );
  }
  if (!activity) return <Loading />;

  const pick = (key: Bilingual) => (activity[`${key}_${language}` as keyof Activity] as string | null | undefined) || null;
  const title = language === 'en' ? activity.title_en : activity.title_te;
  const body =
    (language === 'en' ? activity.full_description_en : activity.full_description_te) ||
    (language === 'en' ? activity.description_en : activity.description_te);

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <View style={[styles.hero, { borderBottomColor: activityCategoryColor(activity.category) }]}>
        <Text style={{ fontSize: 56 }}>{activity.icon}</Text>
        <Text style={styles.category}>{activityCategoryLabel(activity.category, language)}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Card>
        <Text style={[ui.muted, { fontSize: 16, lineHeight: 25 }]}>{body}</Text>
      </Card>
      {DETAILS.some((d) => pick(d.key)) && (
        <Card>
          {DETAILS.filter((d) => pick(d.key)).map((d) => (
            <View key={d.key} style={styles.detail}>
              <Text style={styles.detailLabel}>{language === 'en' ? d.en : d.te}</Text>
              <Text style={ui.muted}>{pick(d.key)}</Text>
            </View>
          ))}
          {activity.participants ? (
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>{t('Participants', 'పాల్గొనేవారు')}</Text>
              <Text style={ui.muted}>{activity.participants}</Text>
            </View>
          ) : null}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingBottom: 16, marginBottom: 16, borderBottomWidth: 4 },
  category: { fontSize: 12, color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 },
  title: { fontSize: 24, color: colors.brand600, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  detail: { marginBottom: 12 },
  detailLabel: { fontWeight: '600', color: colors.brand600, marginBottom: 2 },
});
