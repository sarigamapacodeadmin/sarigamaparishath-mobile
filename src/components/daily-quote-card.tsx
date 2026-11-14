// Today's Deivathin Kural quote under the logo on Home, in the app language
// only. The bulb in the bottom-right corner opens the context, then the
// Parishath logo with the footer note. Texts come from the quotes table in
// Supabase (web repo supabase/migrations/20261114_quotes.sql).

import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { QUOTE_LABELS, quoteIdFor, type DailyQuote } from '../shared/daily-quote';

export function DailyQuoteCard() {
  const { language } = useLanguage();
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [open, setOpen] = useState(false);
  const L = QUOTE_LABELS[language];

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('quotes')
      .select('id, quote_telugu, quote_english, context, footer_note')
      .eq('id', quoteIdFor(new Date()))
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled && !error) setQuote(data as DailyQuote | null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing until the quote has loaded, or if the table isn't set up yet
  if (!quote) return null;

  return (
    <View style={styles.card} accessibilityLabel={`${L.title}: ${L.subtitle}`}>
      <Text style={styles.heading}>
        {L.title} · {L.subtitle}
      </Text>
      <Text style={styles.mark} accessibilityElementsHidden importantForAccessibility="no">
        “
      </Text>
      <Text style={styles.quote}>{language === 'en' ? quote.quote_english : quote.quote_telugu}</Text>
      <Text style={styles.by}>— {L.by}</Text>

      {open && (
        <View style={{ marginTop: 12 }}>
          {!!quote.context && <Text style={styles.context}>{quote.context}</Text>}
          {!!quote.footer_note && (
            <View style={styles.footer}>
              <Image source={require('../../assets/parishath-logo.jpg')} style={styles.footerLogo} accessibilityIgnoresInvertColors />
              <Text style={styles.footerText}>{quote.footer_note}</Text>
            </View>
          )}
        </View>
      )}

      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? L.hideContext : L.showContext}
        hitSlop={8}
        style={[styles.bulb, open && styles.bulbOpen]}
      >
        <Text style={[styles.bulbGlyph, !open && { opacity: 0.6 }]}>💡</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gold200,
    borderRadius: 6,
    padding: 16,
    paddingBottom: 52,
    marginTop: 14,
  },
  heading: { textAlign: 'center', color: '#86692f', fontWeight: '600', fontSize: 13 },
  mark: { color: colors.gold500, fontSize: 36, lineHeight: 40, marginTop: 8 },
  quote: { color: colors.brand700, fontSize: 19, lineHeight: 30 },
  by: { color: colors.vermilion600, fontWeight: '600', textAlign: 'right', marginTop: 8 },
  context: { backgroundColor: '#fbf7ec', borderRadius: 6, padding: 10, color: '#374151', fontSize: 14, lineHeight: 21 },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: 1, borderTopColor: colors.gold200, marginTop: 12, paddingTop: 10 },
  footerLogo: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.gold200 },
  footerText: { flex: 1, color: colors.brand600, fontWeight: '600', fontSize: 14, lineHeight: 21 },
  bulb: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gold200,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulbOpen: { backgroundColor: colors.gold100, borderColor: colors.gold500 },
  bulbGlyph: { fontSize: 18 },
});
