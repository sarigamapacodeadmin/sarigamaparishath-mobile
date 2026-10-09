import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Banner, Card, Chip, Loading, styles as ui } from '../components/ui';
import { pick } from '../lib/format';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';

// The website's /faq page (sarigamaparishath/app/faq/page.tsx): visible questions
// from the `faqs` table, a category filter, and tap to open an answer.

interface FAQ {
  id: number;
  question: string;
  answer: string;
  question_te?: string | null;
  answer_te?: string | null;
  category: string;
  order_index: number;
  visible: boolean;
}

// The office phone shown on the website (app/components/footer.tsx)
const OFFICE_PHONE = '+91 91820 76137';

export default function FAQScreen() {
  const { language, t } = useLanguage();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    const { data, error: dbError } = await supabase
      .from('faqs')
      .select('*')
      .eq('visible', true)
      .order('order_index', { ascending: true });
    if (dbError) setError(t('Could not load the questions. Pull down to try again.', 'ప్రశ్నలు లోడ్ కాలేదు. మళ్ళీ ప్రయత్నించడానికి క్రిందికి లాగండి.'));
    else setFaqs((data as FAQ[]) || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const categories = useMemo(() => Array.from(new Set(faqs.map((f) => f.category).filter(Boolean))), [faqs]);
  const filteredFaqs = selectedCategory ? faqs.filter((f) => f.category === selectedCategory) : faqs;

  const toggleExpand = (id: number) => setExpandedId(expandedId === id ? null : id);

  const header = (
    <View>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('Frequently Asked Questions', 'ప్రశ్నోత్తర మాలిక')}</Text>
        <View style={styles.heroRule} />
        <Text style={styles.heroSubtitle}>{t('Answers to common questions about the Parishath', 'పరిషత్ గురించి సాధారణ ప్రశ్నలకు సమాధానాలు')}</Text>
      </View>
      {!loading && categories.length > 0 && (
        <View style={styles.chips}>
          <Chip label={t('All Questions', 'అన్ని ప్రశ్నలు')} selected={selectedCategory === null} onPress={() => setSelectedCategory(null)} />
          {categories.map((category) => (
            <Chip key={category} label={category} selected={selectedCategory === category} onPress={() => setSelectedCategory(category)} />
          ))}
        </View>
      )}
      <Banner type="error" text={error} />
    </View>
  );

  const empty = loading ? (
    <Loading />
  ) : error ? null : (
    <Text style={styles.empty}>
      {faqs.length === 0
        ? t('No questions have been added yet.', 'ఇంకా ప్రశ్నలు చేర్చలేదు.')
        : t('No questions in this category.', 'ఈ విభాగంలో ప్రశ్నలు లేవు.')}
    </Text>
  );

  const footer = loading ? null : (
    <Card style={{ padding: 20, alignItems: 'center', marginTop: 24 }}>
      <Text style={styles.ctaTitle}>{t("Didn't find your answer?", 'మీ సమాధానం దొరకలేదా?')}</Text>
      <Text style={styles.ctaText}>
        {t('Send us a message through the contact page, or call us.', 'సంప్రదింపు పేజీ ద్వారా సందేశం పంపండి, లేదా ఫోన్ చేయండి.')}
      </Text>
      <Pressable
        onPress={() => router.push('/contact')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.contactButton, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.contactButtonText}>{t('Contact Us', 'సంప్రదించండి')}</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(`tel:${OFFICE_PHONE.replace(/\s/g, '')}`)} accessibilityRole="link" hitSlop={8} style={{ marginTop: 16 }}>
        <Text style={styles.phone}>📞 {OFFICE_PHONE}</Text>
      </Pressable>
    </Card>
  );

  return (
    <FlatList
      style={ui.screen}
      contentContainerStyle={ui.screenContent}
      data={loading ? [] : filteredFaqs}
      keyExtractor={(f) => String(f.id)}
      extraData={[expandedId, language]}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={footer}
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
      renderItem={({ item: faq }) => {
        const expanded = expandedId === faq.id;
        return (
          <View style={styles.item}>
            <Pressable
              onPress={() => toggleExpand(faq.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={({ pressed }) => [styles.question, pressed && { backgroundColor: colors.ivory }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.questionText}>{pick(language, faq.question, faq.question_te)}</Text>
                {faq.category ? <Text style={styles.category}>{faq.category}</Text> : null}
              </View>
              <Text style={[styles.chevron, expanded && { transform: [{ rotate: '180deg' }] }]}>▾</Text>
            </Pressable>
            {expanded && (
              <View style={styles.answer}>
                <Text style={styles.answerText}>{pick(language, faq.answer, faq.answer_te)}</Text>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const gold600 = '#a9853a'; // from the website theme

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.brand600,
    borderBottomWidth: 4,
    borderBottomColor: colors.gold500,
    borderRadius: 6,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  heroTitle: { color: colors.white, fontSize: 28, fontWeight: '600', textAlign: 'center' },
  heroRule: { width: 96, height: 2, backgroundColor: colors.gold500, marginVertical: 12 },
  heroSubtitle: { color: colors.brand100, fontSize: 16, textAlign: 'center', lineHeight: 23 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  item: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gold200, borderRadius: 6, overflow: 'hidden', marginBottom: 14 },
  question: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  questionText: { fontSize: 17, color: colors.brand600, fontWeight: '500', lineHeight: 24 },
  category: { fontSize: 14, color: gold600, fontWeight: '500', marginTop: 4 },
  chevron: { fontSize: 20, color: gold600, marginLeft: 14 },
  answer: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.ivory, borderTopWidth: 1, borderTopColor: colors.gold200 },
  answerText: { color: '#374151', fontSize: 15, lineHeight: 23 },
  empty: { color: colors.subtle, fontSize: 17, textAlign: 'center', paddingVertical: 32 },
  ctaTitle: { fontSize: 22, color: colors.brand600, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  ctaText: { color: '#374151', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 18 },
  contactButton: { backgroundColor: colors.brand600, borderRadius: 6, paddingVertical: 12, paddingHorizontal: 24 },
  contactButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  phone: { color: colors.brand600, fontWeight: '600', fontSize: 16 },
});
