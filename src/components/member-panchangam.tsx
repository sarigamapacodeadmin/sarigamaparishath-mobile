// Personal cards on the home screen for a member with birth details: hora now,
// slokams, the next good window, today's assessment for their birth star,
// festivals ahead, and the full panchangam for their city. Same as the
// website's app/components/home/member-panchangam.tsx, from src/shared/personal-panchangam.ts.

import { router } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Button, Card, Chip, styles as ui } from './ui';
import { useLanguage } from '../lib/language';
import { colors } from '../lib/theme';
import {
  PANCHANGAM_LABELS,
  formatIstRange,
  formatIstTime,
  istDateOf,
  shortMonth,
  untilText,
  type PanchangamLocation,
} from '../shared/panchangam';
import {
  DAY_SLOKAMS,
  HORA_PLANETS,
  PERSONAL_LABELS,
  assessDay,
  birthStar,
  currentHora,
  hinduDay,
  nextGoodWindow,
  observancesAhead,
  ordinalPosition,
  type BirthDetails,
  type DatedObservance,
  type DayLevel,
  type Slokam,
} from '../shared/personal-panchangam';

const LEVEL_COLORS: Record<DayLevel, { bg: string; fg: string }> = {
  good: { bg: '#e8f5ee', fg: '#1f6b43' },
  mixed: { bg: colors.gold100, fg: '#6b5428' },
  careful: { bg: '#fbefec', fg: colors.vermilion700 },
};

const dayKey = () => {
  const { year, month, day } = istDateOf(new Date());
  return `${year}-${month}-${day}`;
};

export function AddBirthDetailsCard() {
  const { language } = useLanguage();
  const L = PERSONAL_LABELS[language];
  return (
    <Card>
      <Text style={[ui.muted, { marginBottom: 10 }]}>{L.addDetails}</Text>
      <Button label={L.addDetailsButton} onPress={() => router.push('/profile')} />
    </Card>
  );
}

export function MemberPanchangam({
  member,
  location,
  children,
}: {
  member: BirthDetails;
  location: PanchangamLocation;
  children?: ReactNode; // shown first, under the heading (the haircut band)
}) {
  const { language } = useLanguage();
  const L = PERSONAL_LABELS[language];
  const P = PANCHANGAM_LABELS[language];
  const t = (name: { en: string; te: string }) => name[language];
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(() => new Date());
  const [openSlokam, setOpenSlokam] = useState<Slokam | null>(null);
  const [show, setShow] = useState({ ekadashi: true, purnima: true, amavasya: false });
  const [ahead, setAhead] = useState<DatedObservance[]>([]);
  const placeKey = `${location.latitude},${location.longitude}`;
  const today = dayKey();

  // Move the hora and windows on every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Festivals ahead take a moment to work out, so they follow the first render
  useEffect(() => {
    const id = setTimeout(() => setAhead(observancesAhead(new Date(), location, 120)), 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, placeKey]);

  const star = useMemo(() => birthStar(member), [member]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const p = useMemo(() => hinduDay(now, location), [now, placeKey]);
  const hora = currentHora(p, now);
  const planet = hora ? HORA_PLANETS[hora.hora.planet] : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const good = useMemo(() => nextGoodWindow(now, location), [now, placeKey]);
  const assessment = star ? assessDay(star, p) : null;
  const slokams = [
    ...(planet ? [{ label: L.horaSlokam, slokam: planet.slokam }] : []),
    { label: L.daySlokam, slokam: DAY_SLOKAMS[p.weekdayIndex] },
  ];
  const upcoming = ahead.filter((a) => a.observance.kind === 'festival').slice(0, 12);
  const festivals = ahead.filter((a) => {
    const o = a.observance;
    return o.kind === 'festival' || o.kind === 'vrata' || (!!o.tag && show[o.tag]);
  });
  const dateLabel = (d: Date) => `${istDateOf(d).day} ${shortMonth(d, language)}`;
  const kalas: [string, [Date, Date]][] = [
    [P.rahu, p.rahuKalam],
    [P.yama, p.yamagandam],
    [P.gulika, p.gulikaKalam],
    [L.abhijit, p.abhijit],
    [P.brahma, p.brahmaMuhurtam],
    ...p.durmuhurtam.map((d): [string, [Date, Date]] => [L.durmuhurtam, d]),
  ];
  const slideWidth = width - 56;

  return (
    <View>
      <Text style={s.heading}>{L.heading}</Text>
      {children}

      {/* Hora now */}
      <Card>
        <Text style={s.cardTitle}>{L.hora}</Text>
        {hora && planet ? (
          <>
            <Text style={s.big}>{t(planet.name)}</Text>
            <Text style={s.text}>
              {L.deity}: <Text style={{ fontWeight: '600' }}>{t(planet.deity)}</Text>
            </Text>
            <Text style={s.text}>
              {language === 'en' ? `${L.until} ${formatIstTime(hora.hora.end)}` : `${formatIstTime(hora.hora.end)} ${L.until}`}
            </Text>
            {hora.next && (
              <Text style={ui.muted}>
                {L.nextHora}: {t(HORA_PLANETS[hora.next.planet].name)}
              </Text>
            )}
          </>
        ) : null}
      </Card>

      {/* Good window */}
      <Card>
        <Text style={s.cardTitle}>{L.goodWindow}</Text>
        {good && (
          <>
            <Text style={ui.muted}>{good.current ? L.now : L.goodNext}</Text>
            <Text style={s.big}>{formatIstRange([good.window.start, good.window.end])}</Text>
            <Text style={[s.text, { fontWeight: '600' }]}>
              {t(good.window.label)}
              {istDateOf(good.window.start).day !== istDateOf(now).day ? ` · ${dateLabel(good.window.start)}` : ''}
            </Text>
          </>
        )}
        <Text style={s.small}>{L.goodNote}</Text>
      </Card>

      {/* Birth star */}
      {star && assessment && (
        <Card>
          <Text style={s.cardTitle}>{L.birthStar}</Text>
          <Text style={s.big}>
            {t(star.nakshatraName)} <Text style={s.text}>{star.pada} {L.pada}</Text>
          </Text>
          <Text style={s.text}>
            {L.rashi}: {t(star.rashiName)}
          </Text>
          <View style={[s.level, { backgroundColor: LEVEL_COLORS[assessment.level].bg }]}>
            <Text style={{ color: LEVEL_COLORS[assessment.level].fg, fontWeight: '700' }}>{L[assessment.level]}</Text>
          </View>
          <Text style={s.text}>
            {L.todayStar}: {t(assessment.todayNakshatra)}
          </Text>
          <Text style={s.text}>
            {L.tara}: {t(assessment.tara.name)} ({t(assessment.tara.meaning)})
          </Text>
          <Text style={s.text}>
            {L.chandra}: {ordinalPosition(assessment.chandra.position, language)}
          </Text>
          {assessment.chandra.chandrashtama && <Text style={[s.text, { color: colors.vermilion700, fontWeight: '600' }]}>{L.chandrashtama}</Text>}
        </Card>
      )}

      {/* Slokams: swipe between them */}
      <Text style={s.section}>{L.slokams}</Text>
      <ScrollView horizontal pagingEnabled={false} snapToInterval={slideWidth + 12} decelerationRate="fast" showsHorizontalScrollIndicator={false}>
        {slokams.map(({ label, slokam }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityHint={L.tapToRead}
            onPress={() => setOpenSlokam(slokam)}
            style={[s.slide, { width: slideWidth }]}
          >
            <Text style={s.kicker}>{label}</Text>
            <Text style={s.slokamTitle}>{t(slokam.title)}</Text>
            <Text style={s.verse} numberOfLines={2}>
              {slokam.te}
            </Text>
            <Text style={s.small}>{L.tapToRead}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Upcoming festivals */}
      {upcoming.length > 0 && (
        <>
          <Text style={s.section}>{L.upcoming}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {upcoming.map((a) => (
              <View key={`${a.date.getTime()}-${a.observance.name.en}`} style={s.festivalTile}>
                <Text style={s.date}>{dateLabel(a.date)}</Text>
                <Text style={s.text}>{t(a.observance.name)}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* Full panchangam for the member's city */}
      <Card>
        <Text style={s.cardTitle}>{L.panchangam}</Text>
        <Text style={[ui.muted, { marginBottom: 8 }]}>{t(p.location)}</Text>
        <Row label={P.samvatsara} value={t(p.samvatsara)} />
        <Row label={P.masa} value={`${t(p.masa)}, ${t(p.paksha)} ${P.paksha}`} />
        {([
          [P.tithi, p.tithi],
          [P.nakshatra, p.nakshatra],
          [P.yoga, p.yoga],
          [P.karana, p.karana],
        ] as const).map(([label, el]) => (
          <Row key={label} label={label} value={`${t(el.name)} ${untilText(el, p, language)}`} />
        ))}
        <Row label={P.sunrise} value={formatIstTime(p.sunrise)} />
        <Row label={P.sunset} value={formatIstTime(p.sunset)} />

        <Text style={s.sub}>{L.kalas}</Text>
        {kalas.map(([label, range]) => (
          <Row key={`${label}-${range[0].getTime()}`} label={label} value={formatIstRange(range)} />
        ))}
        {p.weekdayIndex === 3 && <Text style={s.small}>{L.wednesday}</Text>}

        <Text style={s.sub}>{L.horas}</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[false, true].map((night) => (
            <View key={String(night)} style={{ flex: 1 }}>
              <Text style={s.kicker}>{night ? L.night : L.day}</Text>
              {p.horas.map((h, i) =>
                h.night === night ? (
                  <View key={i} style={[s.horaRow, hora?.index === i && s.horaNow]}>
                    <Text style={[s.text, hora?.index === i && { fontWeight: '700' }]}>{t(HORA_PLANETS[h.planet].name).split(' ')[0]}</Text>
                    <Text style={ui.muted}>{formatIstTime(h.start)}</Text>
                  </View>
                ) : null
              )}
            </View>
          ))}
        </View>
      </Card>

      {/* Festivals for the member's city */}
      <Card>
        <Text style={s.cardTitle}>{L.festivals}</Text>
        <View style={s.chips}>
          {(['ekadashi', 'purnima', 'amavasya'] as const).map((tag) => (
            <Chip key={tag} label={L[tag]} selected={show[tag]} onPress={() => setShow((v) => ({ ...v, [tag]: !v[tag] }))} />
          ))}
        </View>
        {festivals.map((a) => (
          <View key={`${a.date.getTime()}-${a.observance.name.en}`} style={s.festivalRow}>
            <Text style={[s.date, { width: 64 }]}>{dateLabel(a.date)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.text}>{t(a.observance.name)}</Text>
              {a.observance.note && <Text style={s.small}>{t(a.observance.note)}</Text>}
            </View>
          </View>
        ))}
        <Text style={s.small}>{L.festivalsNote}</Text>
      </Card>

      <Modal visible={!!openSlokam} transparent animationType="fade" onRequestClose={() => setOpenSlokam(null)}>
        <Pressable style={s.backdrop} onPress={() => setOpenSlokam(null)}>
          {openSlokam && (
            <Pressable style={s.dialog} onPress={() => {}}>
              <ScrollView>
                <Text style={s.cardTitle}>{t(openSlokam.title)}</Text>
                <Text style={[s.verse, { fontSize: 18, lineHeight: 32 }]}>{openSlokam.te}</Text>
                {language === 'en' && <Text style={[s.text, { fontStyle: 'italic', marginTop: 8 }]}>{openSlokam.en}</Text>}
                <Text style={s.sub}>{L.meaning}</Text>
                <Text style={s.text}>{t(openSlokam.meaning)}</Text>
                <Button variant="secondary" label={L.close} onPress={() => setOpenSlokam(null)} />
              </ScrollView>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '600', color: colors.brand600, textAlign: 'center', marginVertical: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.brand600, marginBottom: 6 },
  section: { fontSize: 18, fontWeight: '600', color: colors.brand600, marginTop: 4, marginBottom: 8 },
  sub: { fontSize: 15, fontWeight: '700', color: colors.brand600, marginTop: 12, marginBottom: 4 },
  big: { fontSize: 22, fontWeight: '600', color: colors.vermilion700, marginBottom: 2 },
  text: { fontSize: 14, color: '#1f2937', lineHeight: 20 },
  small: { fontSize: 12, color: colors.subtle, marginTop: 6 },
  kicker: { fontSize: 12, fontWeight: '700', color: '#8a6d2f', textTransform: 'uppercase', marginBottom: 4 },
  level: { borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, marginVertical: 8 },
  slide: {
    marginRight: 12,
    marginBottom: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gold200,
    borderTopWidth: 4,
    borderTopColor: '#c9a24a',
    borderRadius: 6,
  },
  slokamTitle: { fontSize: 15, fontWeight: '600', color: colors.brand600, marginBottom: 6 },
  verse: { fontSize: 16, lineHeight: 26, color: '#1f2937' },
  festivalTile: { width: 140, marginRight: 10, padding: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gold200, borderRadius: 6 },
  date: { fontWeight: '700', color: colors.vermilion700 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 2 },
  rowLabel: { width: 120, color: colors.subtle, fontSize: 14 },
  rowValue: { flex: 1, color: '#1f2937', fontSize: 14 },
  horaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, borderRadius: 4 },
  horaNow: { backgroundColor: colors.gold100 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  festivalRow: { flexDirection: 'row', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.gold100 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  dialog: { maxHeight: '85%', backgroundColor: colors.white, borderRadius: 8, padding: 20 },
});
