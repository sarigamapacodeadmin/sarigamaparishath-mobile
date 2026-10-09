import { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banner, Card, Loading, styles as ui } from '../components/ui';
import { pick } from '../lib/format';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';

// The website's /testimonials page (sarigamaparishath/app/testimonials/page.tsx):
// featured testimonials first, then the rest, newest first.

interface Testimonial {
  id: number;
  name: string;
  role: string;
  message: string;
  name_te?: string | null;
  role_te?: string | null;
  message_te?: string | null;
  image_url: string | null;
  rating: number;
  featured: boolean;
}

function Stars({ rating, size }: { rating: number; size: number }) {
  return (
    <View style={styles.stars} accessible accessibilityLabel={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: size, color: i < rating ? colors.gold500 : '#d1d5db' }}>
          ★
        </Text>
      ))}
    </View>
  );
}

export default function TestimonialsScreen() {
  const { language, t } = useLanguage();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const { data, error: dbError } = await supabase
      .from('testimonials')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });
    if (dbError) setError(`${t('Could not load testimonials. Pull down to try again.', 'అనుభవాలు లోడ్ కాలేదు. మళ్ళీ ప్రయత్నించడానికి క్రిందికి లాగండి.')} (${dbError.message})`);
    else setTestimonials((data as Testimonial[]) || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const featured = testimonials.filter((item) => item.featured);
  const others = testimonials.filter((item) => !item.featured);

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={ui.screenContent}
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
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('Member Testimonials', 'సభ్యుల అనుభవాలు')}</Text>
        <View style={styles.heroRule} />
        <Text style={styles.heroSubtitle}>{t('Members share their experiences with the Parishath', 'పరిషత్ సభ్యులు తమ అనుభవాలను పంచుకుంటున్నారు')}</Text>
      </View>

      <Banner type="error" text={error} />

      {loading ? (
        <Loading />
      ) : (
        <>
          {featured.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <Text style={styles.sectionTitle}>{t('Featured Testimonials', 'ప్రత్యేక అనుభవాలు')}</Text>
              {featured.map((item) => (
                <Card key={item.id} style={{ padding: 20 }}>
                  <View style={styles.person}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={[styles.avatar, { width: 56, height: 56, borderRadius: 28 }]} accessibilityLabel={pick(language, item.name, item.name_te)} />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{pick(language, item.name, item.name_te)}</Text>
                      <Text style={styles.role}>{pick(language, item.role, item.role_te)}</Text>
                    </View>
                  </View>
                  <Stars rating={item.rating} size={18} />
                  <Text style={styles.message}>“{pick(language, item.message, item.message_te)}”</Text>
                </Card>
              ))}
            </View>
          )}

          {others.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>{t('More Testimonials', 'మరిన్ని అనుభవాలు')}</Text>
              {others.map((item) => (
                <View key={item.id} style={styles.plainCard}>
                  <View style={styles.person}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={[styles.avatar, { width: 48, height: 48, borderRadius: 24 }]} accessibilityLabel={pick(language, item.name, item.name_te)} />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { fontSize: 16 }]}>{pick(language, item.name, item.name_te)}</Text>
                      <Text style={[styles.role, { fontSize: 12 }]}>{pick(language, item.role, item.role_te)}</Text>
                    </View>
                  </View>
                  <Stars rating={item.rating} size={16} />
                  <Text style={[styles.message, { fontSize: 14, lineHeight: 21 }]} numberOfLines={4}>
                    “{pick(language, item.message, item.message_te)}”
                  </Text>
                </View>
              ))}
            </View>
          )}

          {testimonials.length === 0 && !error && <Text style={styles.empty}>{t('No testimonials yet.', 'ఇంకా అనుభవాలు లేవు.')}</Text>}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.brand600,
    borderBottomWidth: 4,
    borderBottomColor: colors.gold500,
    borderRadius: 6,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 22,
  },
  heroTitle: { color: colors.white, fontSize: 28, fontWeight: '600', textAlign: 'center' },
  heroRule: { width: 96, height: 2, backgroundColor: colors.gold500, marginVertical: 12 },
  heroSubtitle: { color: colors.brand100, fontSize: 16, textAlign: 'center', lineHeight: 23 },
  sectionTitle: { fontSize: 24, color: colors.brand600, fontWeight: '600', textAlign: 'center', marginBottom: 18 },
  plainCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gold200, borderRadius: 6, padding: 16, marginBottom: 14 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  avatar: { backgroundColor: colors.gold100 },
  name: { fontSize: 18, color: colors.brand600, fontWeight: '500' },
  role: { fontSize: 14, color: colors.subtle, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  message: { color: '#374151', fontStyle: 'italic', fontSize: 15, lineHeight: 23 },
  empty: { color: colors.subtle, fontSize: 17, textAlign: 'center', paddingVertical: 32 },
});
