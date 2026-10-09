import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { DONATION_PURPOSES } from '../shared/donation-options';
import { gouDattataPeriod, parseGouDattata, purposeKey } from '../shared/donation-purposes';
import { Card, styles as ui } from './ui';

// The parts of the website's donations page (sarigamaparishath/app/donations/page.tsx)
// that the app's Donate tab did not have: live counts (members, cows, events),
// the last 4 completed donations (donor names only for signed-in members, as on
// the website, "A devotee" otherwise), the total raised this month, and the FAQ.

export type DonationsExtraSection = 'stats' | 'recent' | 'faq';

interface RecentDonation {
  id: string;
  date: string;
  amount: number;
  donor_name: string;
  impact_en: string;
  impact_te: string;
}

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// Public member total: member_count() function first, then a direct count (as lib/member-count.ts on the website)
async function fetchMemberCount(): Promise<number> {
  const { data, error } = await supabase.rpc('member_count');
  if (!error && data !== null && data !== undefined) return Number(data) || 0;
  const { count } = await supabase.from('members').select('id', { count: 'exact', head: true });
  return count || 0;
}

function describe(purpose: string | null) {
  const info = DONATION_PURPOSES.find((p) => p.value === purposeKey(purpose)) || DONATION_PURPOSES[DONATION_PURPOSES.length - 1];
  const dattata = parseGouDattata(purpose);
  return {
    impact_en: dattata ? `${info.label_en}, ${gouDattataPeriod(dattata.months, 'en')}` : info.label_en,
    impact_te: dattata ? `${info.label_te}, ${gouDattataPeriod(dattata.months, 'te')}` : info.label_te,
  };
}

export function DonationsExtra({
  sections = ['stats', 'recent', 'faq'],
  refreshKey = 0,
}: {
  // Which blocks to show, in this order
  sections?: DonationsExtraSection[];
  // Change this (e.g. increment after a verified payment) to reload the figures
  refreshKey?: number;
}) {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({ members: 0, cows: 0, events: 0 });
  const [recent, setRecent] = useState<RecentDonation[]>([]);
  const [monthly, setMonthly] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const [members, events, cows, donations, month] = await Promise.all([
      fetchMemberCount().catch(() => 0),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('cows').select('id', { count: 'exact', head: true }),
      supabase
        .from('donations')
        .select('id, donor_name, amount, status, created_at, purpose')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase.from('donations').select('amount').eq('status', 'completed').gte('created_at', monthStart).lt('created_at', nextMonthStart),
    ]);

    setStats({ members, events: events.count || 0, cows: cows.count || 0 });
    if (!donations.error && donations.data) {
      setRecent(
        donations.data.map((d: any) => ({
          id: String(d.id),
          date: new Date(d.created_at).toISOString().split('T')[0],
          amount: Number(d.amount) || 0,
          donor_name: d.donor_name || '',
          ...describe(d.purpose),
        }))
      );
    }
    if (!month.error && month.data) {
      setMonthly(month.data.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0));
    }
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [load, refreshKey, user?.id]);

  // A count that is unavailable (0) is not shown, as on the website
  const statItems = [
    { value: stats.members, en: 'Members', te: 'సభ్యులు' },
    { value: stats.cows, en: 'Cows cared for', te: 'సంరక్షణలో గోవులు' },
    { value: stats.events, en: 'Events held', te: 'నిర్వహించిన కార్యక్రమాలు' },
  ].filter((s) => s.value > 0);

  const faq = [
    {
      q: t('How is my donation used?', 'నా విరాళం ఎలా ఉపయోగించబడుతుంది?'),
      a: t(
        'Your donation goes only to what you choose: cow maintenance, the Veda Pathashala, Gou Dattata for a cow, Gou Grasam, or protecting Sanatana Dharma.',
        'మీరు ఎంచుకున్న దానికే మీ విరాళం ఉపయోగించబడుతుంది: గో పోషణ, వేద పాఠశాల, గో దత్తత, గో గ్రాసం, లేదా సనాతన ధర్మ పరిరక్షణ.'
      ),
    },
    {
      q: t('What is Srigovardhani Go Shala?', 'శ్రీగోవర్ధని గో శాల ఏమిటి?'),
      a: t(
        'Srigovardhani Go Shala is where the Parishath cares for and protects Gomata. When you donate for Gou Samrakshana, your contribution goes directly to the care and nutrition of the cows.',
        'శ్రీగోవర్ధని గో శాలలో పరిషత్ గోమాతను పోషిస్తూ రక్షిస్తోంది. గో సంరక్షణ కోసం మీరు ఇచ్చే విరాళం గోవుల సంరక్షణ మరియు పోషణకు నేరుగా ఉపయోగపడుతుంది.'
      ),
    },
    {
      q: t('Will I get a receipt?', 'నాకు రసీదు వస్తుందా?'),
      a: t('Yes. A receipt is emailed to you as soon as your payment succeeds.', 'అవును. మీ చెల్లింపు పూర్తి కాగానే రసీదు మీ ఈమెయిల్ కు పంపబడుతుంది.'),
    },
  ];

  const blocks = sections.map((section) => {
    if (section === 'stats') {
      if (statItems.length === 0) return null;
      return (
        <View key="stats" style={styles.statsBand}>
          {statItems.map((s) => (
            <View key={s.en} style={styles.stat}>
              <Text style={styles.statValue}>{s.value.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>{language === 'en' ? s.en : s.te}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (section === 'recent') {
      return (
        <Card key="recent">
          <Text style={styles.heading}>{t('Recent Donations', 'ఇటీవలి విరాళాలు')}</Text>
          {recent.length > 0 ? (
            recent.map((d, i) => (
              <View key={d.id} style={[styles.row, i === recent.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.rowTop}>
                  <Text style={styles.donor} numberOfLines={1}>
                    {user && d.donor_name ? d.donor_name : t('A devotee', 'ఒక భక్తుడు')}
                  </Text>
                  <Text style={styles.rowAmount}>{rupees(d.amount)}</Text>
                </View>
                <Text style={[ui.muted, { fontSize: 14 }]}>{language === 'en' ? d.impact_en : d.impact_te}</Text>
                <Text style={styles.date}>{d.date}</Text>
              </View>
            ))
          ) : (
            <Text style={[ui.muted, { textAlign: 'center', paddingVertical: 8 }]}>
              {loaded ? t('No donations yet', 'ఇంకా విరాళాలు లేవు') : t('Loading...', 'లోడ్ అవుతోంది...')}
            </Text>
          )}
          {monthly > 0 && (
            <View style={styles.monthly}>
              <Text style={styles.monthlyLabel}>{t('Raised This Month', 'ఈ నెలలో సేకరించిన విరాళాలు')}</Text>
              <Text style={styles.monthlyValue}>{rupees(monthly)}</Text>
            </View>
          )}
        </Card>
      );
    }
    return (
      <Card key="faq">
        <Text style={styles.heading}>{t('Frequently Asked Questions', 'ప్రశ్నోత్తర మాలిక')}</Text>
        {faq.map((f) => (
          <View key={f.q} style={{ marginBottom: 12 }}>
            <Text style={styles.question}>{f.q}</Text>
            <Text style={[ui.muted, { fontSize: 14 }]}>{f.a}</Text>
          </View>
        ))}
      </Card>
    );
  });

  return <View>{blocks}</View>;
}

const styles = StyleSheet.create({
  statsBand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: colors.brand600,
    borderBottomWidth: 4,
    borderBottomColor: colors.gold500,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  stat: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, minWidth: 90 },
  statValue: { fontSize: 24, fontWeight: '600', color: colors.gold500 },
  statLabel: { fontSize: 13, color: colors.brand100, textAlign: 'center' },
  heading: { fontSize: 20, color: colors.brand600, fontWeight: '600', marginBottom: 10 },
  row: { borderBottomWidth: 1, borderBottomColor: colors.gold200, paddingVertical: 10 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  donor: { flex: 1, fontWeight: '600', color: colors.text, marginRight: 8 },
  rowAmount: { color: colors.brand600, fontWeight: '600' },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  monthly: { marginTop: 12, padding: 12, backgroundColor: colors.gold100, borderColor: colors.gold200, borderWidth: 1, borderRadius: 6 },
  monthlyLabel: { fontSize: 14, fontWeight: '600', color: colors.brand700, marginBottom: 2 },
  monthlyValue: { fontSize: 22, fontWeight: '600', color: colors.brand600 },
  question: { fontWeight: '600', color: colors.text, marginBottom: 4 },
});
