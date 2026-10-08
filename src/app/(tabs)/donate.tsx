import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RazorpayCheckout, type RazorpaySuccess } from '../../components/razorpay-checkout';
import { Banner, Button, Card, Chip, Field, Screen, Title, styles as ui } from '../../components/ui';
import { createDonationOrder, fetchMyMember, verifyPayment, type DonorDetails } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { RAZORPAY_KEY_ID } from '../../lib/config';
import { useLanguage } from '../../lib/language';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import { gouDattataPeriod, gouDattataPurpose } from '../../shared/donation-purposes';
import { CHOICE_PURPOSES, DATTATA_PLANS, DONATION_OPTIONS, PARISHATH_NAME, purposeName } from '../../shared/donation-options';
import type { Cow } from '../../shared/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// Donations through Razorpay, with the same options and purposes as the website
export default function DonateScreen() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [optionId, setOptionId] = useState<string | null>(null);
  const [cows, setCows] = useState<Cow[]>([]);
  const [dattataCow, setDattataCow] = useState('');
  const [dattataAmount, setDattataAmount] = useState(DATTATA_PLANS[0].amount);
  const [choicePurpose, setChoicePurpose] = useState(CHOICE_PURPOSES[0]);
  const [customAmount, setCustomAmount] = useState('');
  const [donor, setDonor] = useState<DonorDetails>({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [order, setOrder] = useState<{ id: string; amount: number } | null>(null);

  // Cows to choose from for Gou Dattata
  useEffect(() => {
    supabase
      .from('cows')
      .select('id, name, breed, sex, date_of_birth')
      .order('name', { ascending: true })
      .then(({ data }) => setCows((data as Cow[]) || []));
  }, []);

  // Fill in the donor's details for a logged-in member
  useEffect(() => {
    if (!user) return;
    fetchMyMember()
      .then((m) => setDonor((d) => ({ name: d.name || m.name || '', email: d.email || m.email || user.email || '', phone: d.phone || m.phone || '' })))
      .catch(() => setDonor((d) => ({ ...d, email: d.email || user.email || '' })));
  }, [user]);

  const option = DONATION_OPTIONS.find((o) => o.id === optionId) || null;
  const plan = DATTATA_PLANS.find((p) => p.amount === dattataAmount) || DATTATA_PLANS[0];
  const amount: number | null = !option
    ? null
    : option.kind === 'fixed'
      ? option.amount ?? null
      : option.kind === 'dattata'
        ? plan.amount
        : parseInt(customAmount, 10) || null;
  const purpose = !option
    ? ''
    : option.kind === 'dattata'
      ? gouDattataPurpose(dattataCow, plan.months)
      : option.kind === 'choice'
        ? choicePurpose
        : option.purpose;

  const summary = (() => {
    if (!option || !amount) return '';
    const en = language === 'en';
    let what: string;
    if (option.kind === 'dattata') {
      const period = gouDattataPeriod(plan.months, language);
      what = en ? `Gou Dattata of ${dattataCow || 'a cow chosen by the Parishath'} for ${period}` : `${dattataCow || 'పరిషత్ ఎంచుకునే గోవు'} కు ${period} గో దత్తత`;
    } else if (option.kind === 'choice') {
      what = purposeName(choicePurpose, language);
    } else {
      what = en ? option.impact_en.toLowerCase() : option.impact_te;
    }
    return en
      ? `You are donating ${rupees(amount)} towards ${what} to ${PARISHATH_NAME}, paid securely through Razorpay.`
      : `మీరు ${what} కోసం సనాతన ఋషిప్రోక్త గాయత్రీ మహా పరిషత్ కు ${rupees(amount)} విరాళం ఇస్తున్నారు. చెల్లింపు Razorpay ద్వారా సురక్షితంగా జరుగుతుంది.`;
  })();

  const fail = (text: string) => setMessage({ type: 'error', text });

  const donate = async () => {
    setMessage(null);
    if (!option) return fail(t('Please choose what you would like to donate for', 'దయచేసి విరాళం దేనికోసమో ఎంచుకోండి'));
    if (!amount || amount < 1) return fail(t('Please select or enter a donation amount', 'దయచేసి విరాళం మొత్తాన్ని ఎంచుకోండి లేదా నమోదు చేయండి'));
    if (!donor.name.trim()) return fail(t('Please enter your name', 'దయచేసి మీ పేరు నమోదు చేయండి'));
    if (!EMAIL_RE.test(donor.email.trim())) return fail(t('Please enter your email', 'దయచేసి మీ ఈమెయిల్ నమోదు చేయండి'));
    if (!RAZORPAY_KEY_ID) return fail('The app is missing its Razorpay key (EXPO_PUBLIC_RAZORPAY_KEY_ID).');

    setLoading(true);
    try {
      const res = await createDonationOrder(amount, purpose, { name: donor.name.trim(), email: donor.email.trim(), phone: donor.phone.trim() });
      setOrder({ id: res.order.id, amount: res.order.amount });
    } catch (err) {
      fail(`${t('Error', 'లోపం')}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const onPaid = async (payment: RazorpaySuccess) => {
    setOrder(null);
    const paidAmount = amount ?? 0;
    const email = donor.email.trim();
    try {
      const result = await verifyPayment(payment, paidAmount, purpose, { name: donor.name.trim(), email, phone: donor.phone.trim() });
      if (!result.verified) throw new Error('not verified');
      setMessage({
        type: 'success',
        text: t(
          `Thank you for your donation of ${rupees(paidAmount)}! A receipt has been sent to ${email}`,
          `${rupees(paidAmount)} విరాళం ఇచ్చినందుకు ధన్యవాదాలు! రసీదు ${email} కు పంపించాము`
        ),
      });
      setOptionId(null);
      setDattataCow('');
      setDattataAmount(DATTATA_PLANS[0].amount);
      setCustomAmount('');
    } catch {
      fail(
        t(
          `Payment successful but verification failed. Please contact us with payment ID ${payment.payment_id}.`,
          `చెల్లింపు జరిగింది కానీ ధృవీకరణ విఫలమైంది. దయచేసి చెల్లింపు ID ${payment.payment_id} తో పరిషత్ ను సంప్రదించండి.`
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>{t('Support the Parishath', 'పరిషత్‌కు సహకరించండి')}</Title>
      {message && <Banner type={message.type} text={message.text} />}

      {DONATION_OPTIONS.map((o) => {
        const selected = o.id === optionId;
        return (
          <Pressable key={o.id} onPress={() => setOptionId(o.id)} accessibilityRole="radio" accessibilityState={{ selected }}>
            <Card style={selected ? styles.selected : undefined}>
              <View style={styles.optionRow}>
                <Text style={{ fontSize: 32, marginRight: 12 }}>{o.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{language === 'en' ? o.title_en : o.title_te}</Text>
                  <Text style={ui.muted}>{language === 'en' ? o.impact_en : o.impact_te}</Text>
                </View>
              </View>
              <Text style={styles.amount}>
                {o.kind === 'fixed'
                  ? rupees(o.amount ?? 0)
                  : o.kind === 'dattata'
                    ? DATTATA_PLANS.map((p) => rupees(p.amount)).join(' / ')
                    : t('Any amount', 'ఏ మొత్తమైనా')}
              </Text>
            </Card>
          </Pressable>
        );
      })}

      {option?.kind === 'dattata' && (
        <Card>
          <Text style={styles.section}>{t('Period and amount', 'కాలం మరియు మొత్తం')}</Text>
          <View style={styles.wrap}>
            {DATTATA_PLANS.map((p) => (
              <Chip
                key={p.amount}
                label={`${gouDattataPeriod(p.months, language)}: ${rupees(p.amount)}`}
                selected={p.amount === dattataAmount}
                onPress={() => setDattataAmount(p.amount)}
              />
            ))}
          </View>
          <Text style={styles.section}>{t('Choose a cow', 'గోవును ఎంచుకోండి')}</Text>
          <View style={styles.wrap}>
            <Chip label={t('Let the Parishath choose', 'పరిషత్ ఎంచుకుంటుంది')} selected={!dattataCow} onPress={() => setDattataCow('')} />
            {cows.map((c) => (
              <Chip key={c.id} label={c.name} selected={dattataCow === c.name} onPress={() => setDattataCow(c.name)} />
            ))}
          </View>
        </Card>
      )}

      {option?.kind === 'choice' && (
        <Card>
          <Text style={styles.section}>{t('Donate towards', 'విరాళం దేనికోసం')}</Text>
          <View style={styles.wrap}>
            {CHOICE_PURPOSES.map((key) => (
              <Chip key={key} label={purposeName(key, language)} selected={choicePurpose === key} onPress={() => setChoicePurpose(key)} />
            ))}
          </View>
          <Field label={t('Amount (₹)', 'మొత్తం (₹)')} value={customAmount} onChangeText={(v) => setCustomAmount(v.replace(/\D/g, ''))} keyboardType="number-pad" />
        </Card>
      )}

      {option && (
        <Card>
          <Text style={styles.section}>{t('Your details', 'మీ వివరాలు')}</Text>
          <Field label={t('Full name', 'పూర్తి పేరు')} value={donor.name} onChangeText={(name) => setDonor((d) => ({ ...d, name }))} />
          <Field
            label={t('Email (for the receipt)', 'ఈమెయిల్ (రసీదు కోసం)')}
            value={donor.email}
            onChangeText={(email) => setDonor((d) => ({ ...d, email }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field label={t('Phone', 'ఫోన్')} value={donor.phone} onChangeText={(phone) => setDonor((d) => ({ ...d, phone }))} keyboardType="phone-pad" />
          {summary ? <Text style={[ui.muted, { marginBottom: 8 }]}>{summary}</Text> : null}
          <Button label={amount ? `${t('Donate', 'విరాళం ఇవ్వండి')} ${rupees(amount)}` : t('Donate', 'విరాళం ఇవ్వండి')} onPress={donate} loading={loading} />
        </Card>
      )}

      <Text style={[ui.muted, { textAlign: 'center', fontSize: 13 }]}>
        {t(
          'Your payment is secure. Payments are processed by Razorpay, a trusted Indian payment gateway.',
          'మీ చెల్లింపు సురక్షితం. చెల్లింపులు భారతదేశపు విశ్వసనీయ చెల్లింపు వ్యవస్థ Razorpay ద్వారా జరుగుతాయి.'
        )}
      </Text>

      {order && (
        <RazorpayCheckout
          visible
          orderId={order.id}
          amountPaise={order.amount}
          description={`Donation of ${rupees(order.amount / 100)}`}
          prefill={{ name: donor.name, email: donor.email, contact: donor.phone }}
          onSuccess={onPaid}
          onDismiss={() => {
            setOrder(null);
            setLoading(false);
            fail(t('Payment cancelled', 'చెల్లింపు రద్దు చేయబడింది'));
          }}
          onFailure={(text) => {
            setOrder(null);
            setLoading(false);
            fail(text);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  selected: { borderColor: colors.brand600, borderWidth: 2, borderTopWidth: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  optionTitle: { fontSize: 18, color: colors.brand600, fontWeight: '600', marginBottom: 2 },
  amount: { marginTop: 10, color: colors.vermilion600, fontWeight: '700', fontSize: 16 },
  section: { fontWeight: '600', color: colors.brand600, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
});
