import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Screen, styles as ui } from '../components/ui';
import { resubscribeNewsletter, unsubscribeNewsletter } from '../lib/books-api';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Newsletter subscribe and unsubscribe, as on the website's /newsletter
export default function NewsletterScreen() {
  const { t } = useLanguage();
  return (
    <Screen>
      <Text style={styles.intro}>
        {t(
          'Get occasional updates on Parishath events and activities by email.',
          'పరిషత్ కార్యక్రమాలు, కార్యకలాపాల గురించి అప్పుడప్పుడు ఈమెయిల్ ద్వారా సమాచారం పొందండి.'
        )}
      </Text>

      <Card style={{ padding: 20 }}>
        <SubscribeForm />
      </Card>

      {/* What you will receive */}
      <View style={styles.panel}>
        <Text style={styles.infoTitle}>{t('Events', 'కార్యక్రమాలు')}</Text>
        <Text style={styles.infoText}>{t('News of upcoming programmes and gatherings', 'రాబోయే కార్యక్రమాలు, సమావేశాల సమాచారం')}</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.infoTitle}>{t('Activities', 'కార్యకలాపాలు')}</Text>
        <Text style={styles.infoText}>{t('Updates on the work of the Parishath', 'పరిషత్ కార్యకలాపాల గురించి తాజా సమాచారం')}</Text>
      </View>

      {/* Unsubscribe, for existing subscribers */}
      <View style={[styles.panel, { marginTop: 10, alignItems: 'stretch' }]}>
        <UnsubscribeForm />
      </View>

      <View style={styles.privacy}>
        <Text style={styles.privacyText}>
          {t(
            'We use your email only to send Parishath updates. You can unsubscribe at any time on this page.',
            'మీ ఈమెయిల్‌ను పరిషత్ సమాచారం పంపడానికి మాత్రమే ఉపయోగిస్తాము. ఈ పేజీలో ఎప్పుడైనా చందా రద్దు చేసుకోవచ్చు.'
          )}
        </Text>
      </View>
    </Screen>
  );
}

// The website's NewsletterForm with the /newsletter page's title, subtitle, button and placeholder
function SubscribeForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleSubmit = async () => {
    const value = email.trim();
    if (!value) {
      setStatus('error');
      setMessage(t('Please enter your email', 'దయచేసి మీ ఈమెయిల్ ఇవ్వండి'));
      return;
    }
    // The website's email input does this check in the browser before submitting
    if (!EMAIL_RE.test(value)) {
      setStatus('error');
      setMessage(t('Please enter a valid email.', 'దయచేసి సరైన ఈమెయిల్ ఇవ్వండి.'));
      return;
    }

    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert([{ email: value, name: null, status: 'active' }]);

      if (error) {
        if (error.code === '23505') {
          // The email is on the list: reactivate it if it was unsubscribed earlier
          if (await resubscribeNewsletter(value)) {
            setStatus('success');
            setMessage(t('Welcome back! You are subscribed again.', 'మళ్ళీ స్వాగతం! మీ చందా తిరిగి ప్రారంభమైంది.'));
            setEmail('');
          } else {
            setStatus('error');
            setMessage(t('This email is already subscribed', 'ఈ ఈమెయిల్ ఇప్పటికే చందాదారుగా ఉంది'));
          }
        } else {
          throw error;
        }
      } else {
        setStatus('success');
        setMessage(t('Thank you for subscribing!', 'చందా చేసినందుకు ధన్యవాదాలు!'));
        setEmail('');
        // Reset after 3 seconds
        timer.current = setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
      }
    } catch (err) {
      console.error('Error subscribing:', err);
      setStatus('error');
      setMessage(t('Failed to subscribe. Please try again.', 'చందా విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'));
    } finally {
      setLoading(false);
    }
  };

  const placeholder = t('Enter your email address', 'మీ ఈమెయిల్ చిరునామా నమోదు చేయండి');

  return (
    <View>
      <Text style={styles.formTitle}>{t('Subscribe to the Newsletter', 'వార్తాలేఖకు చందా చేయండి')}</Text>
      <Text style={styles.formSubtitle}>{t('Occasional updates on events and activities', 'కార్యక్రమాలు, కార్యకలాపాల గురించి అప్పుడప్పుడు సమాచారం')}</Text>

      <TextInput
        style={[ui.input, { borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 12 }, loading && { opacity: 0.6 }]}
        value={email}
        onChangeText={setEmail}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        placeholderTextColor={colors.subtle}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!loading}
        onSubmitEditing={handleSubmit}
      />

      <Pressable
        accessibilityRole="button"
        onPress={handleSubmit}
        disabled={loading}
        style={({ pressed }) => [styles.subscribeBtn, loading && { backgroundColor: '#9ca3af' }, pressed && { opacity: 0.85 }]}
      >
        {loading ? <ActivityIndicator color={colors.white} size="small" style={{ marginRight: 8 }} /> : <Text style={styles.btnIcon}>✉</Text>}
        <Text style={styles.subscribeText}>{loading ? t('Subscribing...', 'చందా చేస్తోంది...') : t('Subscribe', 'చందా చేయండి')}</Text>
      </Pressable>

      {status !== 'idle' && message ? (
        <View style={[styles.status, status === 'success' ? styles.statusOk : styles.statusErr]} accessibilityLiveRegion="polite">
          <Text style={{ color: status === 'success' ? '#166534' : '#991b1b', marginRight: 8, fontSize: 16 }}>{status === 'success' ? '✓' : '⚠'}</Text>
          <Text style={{ color: status === 'success' ? '#166534' : '#991b1b', flex: 1 }}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
}

// The website's NewsletterUnsubscribe. A link with ?unsubscribe=<email> prefills the email.
function UnsubscribeForm() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ unsubscribe?: string }>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const fromLink = Array.isArray(params.unsubscribe) ? params.unsubscribe[0] : params.unsubscribe;
    if (fromLink) setEmail(fromLink);
  }, [params.unsubscribe]);

  const handleSubmit = async () => {
    setResult(null);
    // The website's field is required, so an empty email is not sent
    if (!email.trim()) {
      setResult({ ok: false, text: t('Please enter a valid email.', 'దయచేసి సరైన ఈమెయిల్ ఇవ్వండి.') });
      return;
    }
    setLoading(true);
    try {
      const { ok, data } = await unsubscribeNewsletter(email);
      if (ok) {
        setEmail('');
        setResult({
          ok: true,
          text: data.already
            ? t('This email was already unsubscribed.', 'ఈ ఈమెయిల్ ఇప్పటికే చందా నుండి తొలగించబడింది.')
            : t('You have been unsubscribed. You will no longer receive the newsletter.', 'మీ చందా రద్దు చేయబడింది. ఇకపై మీకు వార్తాలేఖ రాదు.'),
        });
      } else if (data.error === 'not_subscribed') {
        setResult({ ok: false, text: t('This email is not subscribed to the newsletter.', 'ఈ ఈమెయిల్ వార్తాలేఖకు చందా చేయలేదు.') });
      } else if (data.error === 'invalid_email') {
        setResult({ ok: false, text: t('Please enter a valid email.', 'దయచేసి సరైన ఈమెయిల్ ఇవ్వండి.') });
      } else {
        throw new Error(data.error || 'failed');
      }
    } catch {
      setResult({ ok: false, text: t('Could not unsubscribe. Please try again.', 'చందా రద్దు కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.') });
    } finally {
      setLoading(false);
    }
  };

  const label = t('Your email', 'మీ ఈమెయిల్');

  return (
    <View>
      <Text style={styles.unsubTitle}>{t('Unsubscribe', 'చందా రద్దు చేయండి')}</Text>
      <Text style={styles.unsubText}>
        {t(
          'Already subscribed and no longer want the newsletter? Enter the email you subscribed with.',
          'ఇప్పటికే చందా చేసి, ఇకపై వార్తాలేఖ వద్దనుకుంటే, చందా చేసిన ఈమెయిల్ నమోదు చేయండి.'
        )}
      </Text>
      <TextInput
        style={[ui.input, loading && { opacity: 0.6 }]}
        value={email}
        onChangeText={setEmail}
        placeholder={label}
        accessibilityLabel={label}
        placeholderTextColor={colors.subtle}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!loading}
        onSubmitEditing={handleSubmit}
      />
      <Pressable
        accessibilityRole="button"
        onPress={handleSubmit}
        disabled={loading}
        style={({ pressed }) => [styles.unsubBtn, (loading || pressed) && { opacity: 0.6 }]}
      >
        <Text style={styles.unsubBtnText}>{loading ? t('Please wait...', 'దయచేసి వేచి ఉండండి...') : t('Unsubscribe', 'చందా రద్దు చేయండి')}</Text>
      </Pressable>
      {result ? (
        <View style={[styles.result, result.ok ? styles.resultOk : styles.resultErr]} accessibilityLiveRegion="polite">
          <Text style={{ color: result.ok ? colors.brand700 : colors.vermilion700, fontSize: 14 }}>{result.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 16 },
  formTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  formSubtitle: { color: colors.muted, marginBottom: 18, lineHeight: 21 },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand600,
    borderRadius: 8,
    paddingVertical: 13,
    marginTop: 14,
  },
  btnIcon: { color: colors.white, fontSize: 17, marginRight: 8 },
  subscribeText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  status: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 8, borderWidth: 1, marginTop: 14 },
  statusOk: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusErr: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  panel: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gold200, borderRadius: 6, padding: 18, marginBottom: 14, alignItems: 'center' },
  infoTitle: { fontSize: 18, color: colors.brand600, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  infoText: { color: colors.muted, textAlign: 'center', lineHeight: 21 },
  unsubTitle: { fontSize: 20, color: colors.brand600, fontWeight: '600', marginBottom: 8 },
  unsubText: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 12 },
  unsubBtn: { borderWidth: 1, borderColor: colors.brand600, borderRadius: 6, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  unsubBtnText: { color: colors.brand600, fontWeight: '600', fontSize: 16 },
  result: { padding: 12, borderRadius: 6, borderWidth: 1, marginTop: 12 },
  resultOk: { backgroundColor: colors.brand50, borderColor: '#c8cee5' },
  resultErr: { backgroundColor: colors.vermilion50, borderColor: colors.vermilion200 },
  privacy: { borderTopWidth: 1, borderTopColor: colors.gold200, marginTop: 10, paddingTop: 18 },
  privacyText: { color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
