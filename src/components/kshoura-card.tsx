// "Haircut today? (Kshoura)" band in the Home screen's "For you today" section,
// for signed-in members with a profile: green or red, tap to see why. Same as the website's app/components/home/kshoura-card.tsx;
// the rules are in src/shared/kshoura.ts. The time rules follow the live clock.

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './ui';
import { useLanguage } from '../lib/language';
import { colors } from '../lib/theme';
import { KSHOURA_ALSO_REMEMBER, KSHOURA_LABELS, kshouraVerdict } from '../shared/kshoura';
import type { PanchangamLocation } from '../shared/panchangam';
import { kshouraPanchangam, kshouraProfile, type BirthDetails } from '../shared/personal-panchangam';

const GREEN = { bg: '#e8f5ee', border: '#9fd8b8', top: '#1f8a55', fg: '#1f6b43' };
const RED = { bg: colors.vermilion50, border: colors.vermilion200, top: colors.vermilion600, fg: colors.vermilion700 };

export function KshouraCard({ member, location }: { member: BirthDetails; location: PanchangamLocation }) {
  const { language } = useLanguage();
  const L = KSHOURA_LABELS[language];
  const [minute, setMinute] = useState(() => Math.floor(Date.now() / 60000));
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);

  // Re-check every minute so the time rules follow the clock
  useEffect(() => {
    const id = setInterval(() => setMinute(Math.floor(Date.now() / 60000)), 15000);
    return () => clearInterval(id);
  }, []);

  const { latitude, longitude } = location;
  const verdict = useMemo(() => {
    const now = new Date(minute * 60000);
    return kshouraVerdict(kshouraPanchangam(now, location), kshouraProfile(member), now);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- location is compared by its coordinates
  }, [minute, latitude, longitude, member]);

  const tone = verdict.ok ? GREEN : RED;
  return (
    <View style={[s.card, { borderColor: tone.border }]}>
      {/* The band: only the verdict; tap to see why */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={[s.band, { backgroundColor: tone.top }]}
      >
        <View style={s.mark}>
          <Text style={s.markText}>{verdict.ok ? '✓' : '✗'}</Text>
        </View>
        <Text style={s.headline}>{verdict.headline[language]}</Text>
        <Text style={s.chevron}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open ? (
        <View style={s.details}>
          <Text style={s.title}>{L.title}</Text>
          <Text style={s.why}>{L.why}</Text>
          {verdict.shown.map((r) => (
            <View key={r.id} style={s.line}>
              <Text style={{ color: r.status === 'fail' ? colors.vermilion600 : r.status === 'pass' ? GREEN.top : colors.subtle, width: 16 }}>
                {r.status === 'fail' ? '✗' : r.status === 'pass' ? '✓' : '–'}
              </Text>
              <Text style={[s.text, r.status === 'skipped' && { color: colors.muted }]}>{r.text[language]}</Text>
            </View>
          ))}

          {verdict.weekdayEffect ? <Text style={s.effect}>{verdict.weekdayEffect[language]}</Text> : null}

          {verdict.profileIncomplete ? (
            <View style={s.box}>
              <Text style={[s.text, { marginBottom: 8 }]}>{L.note}</Text>
              <Button label={L.fillProfile} onPress={() => router.push('/profile?edit=1')} />
            </View>
          ) : null}

          <View style={s.box}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: remember }} onPress={() => setRemember((o) => !o)}>
              <Text style={s.remember}>
                {remember ? '▾ ' : '▸ '}
                {L.alsoRemember}
              </Text>
            </Pressable>
            {remember
              ? KSHOURA_ALSO_REMEMBER.map((item) => (
                  <View key={item.en} style={s.line}>
                    <Text style={{ width: 16, color: colors.muted }}>•</Text>
                    <Text style={[s.text, { color: colors.muted }]}>{item[language]}</Text>
                  </View>
                ))
              : null}
          </View>

          <Text style={s.footer}>{L.footer}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.white, marginBottom: 12 },
  band: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  mark: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  markText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  headline: { flex: 1, color: colors.white, fontSize: 17, fontWeight: '700' },
  chevron: { color: colors.white, fontSize: 14 },
  details: { padding: 14 },
  title: { fontSize: 17, fontWeight: '600', color: colors.brand600 },
  why: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 4 },
  line: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  text: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
  effect: { marginTop: 10, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: GREEN.border, backgroundColor: colors.white, color: GREEN.fg, fontWeight: '600' },
  box: { marginTop: 12, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: colors.gold200, backgroundColor: colors.white },
  remember: { fontSize: 15, fontWeight: '600', color: colors.brand600 },
  footer: { fontSize: 12, color: colors.subtle, marginTop: 12 },
});
