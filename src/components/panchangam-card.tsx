// Today's panchangam and sankalpam for the home screen, worked out on the phone
// from src/shared/panchangam.ts (Hyderabad sunrise, Lahiri ayanamsa), like the
// website's app/components/home/panchangam-card.tsx.

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../lib/language';
import { colors } from '../lib/theme';
import {
  PANCHANGAM_LABELS,
  computePanchangam,
  formatIstTime,
  istDateOf,
  shortMonth,
  type Panchangam,
} from '../shared/panchangam';

const dayKey = () => {
  const { year, month, day } = istDateOf(new Date());
  return `${year}-${month}-${day}`;
};

// Recalculates when the date changes in India (checked every minute)
function useTodaysPanchangam(): Panchangam {
  const [state, setState] = useState(() => ({ key: dayKey(), value: computePanchangam() }));
  useEffect(() => {
    const id = setInterval(() => {
      const key = dayKey();
      setState((s) => (s.key === key ? s : { key, value: computePanchangam() }));
    }, 60000);
    return () => clearInterval(id);
  }, []);
  return state.value;
}

// The moon as it looks today: a lit half plus an ellipse that either darkens
// it into a crescent or adds to it for a gibbous moon
function MoonPhase({ illumination, waxing, size }: { illumination: number; waxing: boolean; size: number }) {
  const r = size * 0.4;
  const rx = Math.abs(1 - 2 * illumination) * r;
  const gibbous = illumination >= 0.5;
  // Skip the shading near new and full moon, where its edges would show as a thin ring
  const shaded = illumination > 0.02 && illumination < 0.98;
  return (
    <View style={[moon.box, { width: size, height: size, borderRadius: size * 0.12 }]}>
      <View style={[moon.disc, { width: r * 2, height: r * 2, borderRadius: r }, illumination >= 0.98 && moon.full]}>
        {shaded && (
          <>
            <View style={[moon.half, { width: r, height: r * 2, [waxing ? 'right' : 'left']: 0 }]} />
            <View
              style={{
                position: 'absolute',
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                // A circle squeezed sideways, since border radii can't make an ellipse
                transform: [{ scaleX: rx / r }],
                backgroundColor: gibbous ? LIT : DARK,
              }}
            />
          </>
        )}
      </View>
    </View>
  );
}

const LIT = '#d9dbe0';
const DARK = '#5b6070';

const moon = StyleSheet.create({
  box: { backgroundColor: '#151a2e', alignItems: 'center', justifyContent: 'center' },
  disc: { backgroundColor: DARK, overflow: 'hidden' },
  half: { position: 'absolute', top: 0, backgroundColor: LIT },
  full: { backgroundColor: LIT },
});

export function PanchangamCard() {
  const { language } = useLanguage();
  const p = useTodaysPanchangam();
  const [expanded, setExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const L = PANCHANGAM_LABELS[language];
  const t = (name: { en: string; te: string }) => name[language];
  const day = String(istDateOf(p.date).day).padStart(2, '0');

  return (
    <View style={styles.card} accessibilityLabel={L.today}>
      <View style={styles.top}>
        {/* Date column, as on a Telugu wall calendar */}
        <View style={styles.dateCol}>
          <MoonPhase illumination={p.moon.illumination} waxing={p.moon.waxing} size={64} />
          <Text style={styles.date}>
            <Text style={styles.dateNum}>{day}</Text>
            <Text style={styles.dateMonth}>{shortMonth(p.date, language)}</Text>
          </Text>
          <Text style={styles.weekday}>{language === 'en' ? p.weekday.en.toUpperCase() : p.weekday.te}</Text>
          <View style={styles.divider} />
          <Text style={styles.lunarNum}>{p.lunarDay}</Text>
          <Text style={styles.masa}>{t(p.masa)}</Text>
          <Text style={styles.vara}>{t(p.vara)}</Text>
        </View>

        {/* Sankalpam */}
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{L.title}</Text>
            <Pressable
              onPress={() => setShowInfo((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={language === 'en' ? 'What is a sankalpam?' : 'సంకల్పం అంటే ఏమిటి?'}
              hitSlop={10}
              style={styles.infoButton}
            >
              <Text style={styles.infoText}>i</Text>
            </Pressable>
          </View>
          <Text style={styles.location} numberOfLines={1}>
            {t(p.location)}
          </Text>
          {showInfo && (
            <Text style={styles.info}>
              {L.info} {L.method}
            </Text>
          )}
          <Text style={styles.sankalpam} numberOfLines={expanded ? undefined : 7}>
            {t(p.sankalpam)}
          </Text>
          <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.more}>{expanded ? L.less : L.more}</Text>
          </Pressable>
        </View>
      </View>

      {/* Sunrise and sunset */}
      <View style={[styles.section, styles.times]}>
        <Text style={styles.time}>
          {L.sunrise} <Text style={styles.timeValue}>{formatIstTime(p.sunrise)}</Text>
        </Text>
        <Text style={styles.time}>
          {L.sunset} <Text style={styles.timeValue}>{formatIstTime(p.sunset)}</Text>
        </Text>
      </View>
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
    marginBottom: 16,
    overflow: 'hidden',
  },
  top: { flexDirection: 'row', gap: 12, padding: 14 },
  dateCol: { width: 100 },
  date: { marginTop: 8, color: colors.vermilion600, fontWeight: '700' },
  dateNum: { fontSize: 36, fontWeight: '700', color: colors.vermilion600 },
  dateMonth: { fontSize: 16, fontWeight: '700', color: colors.vermilion600 },
  weekday: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 },
  divider: { height: 2, backgroundColor: colors.vermilion600, marginVertical: 6 },
  lunarNum: { fontSize: 30, fontWeight: '700', color: colors.vermilion600, marginTop: 4 },
  masa: { fontSize: 13, fontWeight: '700', color: colors.vermilion600 },
  vara: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '600', color: colors.brand600 },
  infoButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { fontSize: 12, fontWeight: '700', color: colors.brand600 },
  location: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  info: { backgroundColor: colors.gold100, borderRadius: 6, padding: 10, marginTop: 8, fontSize: 13, lineHeight: 20, color: colors.text },
  sankalpam: { fontSize: 15, lineHeight: 26, color: colors.text, marginTop: 8 },
  more: { color: colors.brand600, fontWeight: '600', marginTop: 4 },
  section: { borderTopWidth: 1, borderTopColor: colors.gold200, padding: 14 },
  times: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 4, backgroundColor: '#fbf7ec', paddingVertical: 10 },
  time: { fontSize: 14, color: colors.subtle },
  timeValue: { fontWeight: '700', color: colors.text },
});
