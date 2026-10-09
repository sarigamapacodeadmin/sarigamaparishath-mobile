import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Card, Field, Screen, styles as ui } from '../components/ui';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';

// The website's official office phone (app/components/footer.tsx OFFICE_PHONE)
const OFFICE_PHONE = '+91 91820 76137';
const OFFICE_PHONE_TEL = '+919182076137';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone, location and a message form saved to contact_submissions, as on the website's /contact
export default function ContactScreen() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const set = (key: keyof typeof formData) => (value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!formData.name || !formData.email || !formData.message) {
      setError(t('All fields are required', 'అన్ని వివరాలు తప్పనిసరి'));
      setLoading(false);
      return;
    }
    if (!EMAIL_RE.test(formData.email)) {
      setError(t('Please enter a valid email', 'దయచేసి సరైన ఈమెయిల్ ఇవ్వండి'));
      setLoading(false);
      return;
    }

    try {
      const { error: submitError } = await supabase.from('contact_submissions').insert([
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ]);
      if (submitError) throw submitError;

      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      // Clear the success message after 5 seconds
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
      setError(message || t('Failed to send message', 'సందేశం పంపడం విఫలమైంది'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.intro}>
        {t('Have a question? Call us or send a message below.', 'ఏవైనా సందేహాలు ఉన్నాయా? ఫోన్ చేయండి లేదా కింద సందేశం పంపండి.')}
      </Text>

      <Card>
        <Text style={styles.cardTitle}>📞 {t('Phone', 'ఫోన్')}</Text>
        <Pressable
          onPress={() => Linking.openURL(`tel:${OFFICE_PHONE_TEL}`).catch(() => {})}
          accessibilityRole="link"
          accessibilityHint={t('Call the Parishath', 'పరిషత్‌కు ఫోన్ చేయండి')}
        >
          <Text style={styles.phone}>{OFFICE_PHONE}</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>📍 {t('Location', 'చిరునామా')}</Text>
        <Text style={styles.body}>{t('Hyderabad, Telangana', 'హైదరాబాద్, తెలంగాణ')}</Text>
      </Card>

      <View style={styles.panel}>
        <Text style={styles.formTitle}>{t('Send a Message', 'సందేశం పంపండి')}</Text>

        <Banner type="error" text={error} />
        {success && <Banner type="success" text={t('Thank you! Your message has been sent.', 'ధన్యవాదాలు! మీ సందేశం పంపబడింది.')} />}

        <Field
          label={`${t('Your Name', 'మీ పేరు')} *`}
          value={formData.name}
          onChangeText={set('name')}
          placeholder={t('Enter your name', 'మీ పేరు నమోదు చేయండి')}
          autoComplete="name"
        />
        <Field
          label={`${t('Email Address', 'ఈమెయిల్ చిరునామా')} *`}
          value={formData.email}
          onChangeText={set('email')}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label={`${t('Message', 'సందేశం')} *`}
          value={formData.message}
          onChangeText={set('message')}
          placeholder={t('Type your message here...', 'మీ సందేశాన్ని ఇక్కడ టైప్ చేయండి...')}
          multiline
          numberOfLines={6}
          style={[ui.input, { minHeight: 140, textAlignVertical: 'top' }]}
        />

        <Button
          label={loading ? t('Sending...', 'పంపుతోంది...') : `➤  ${t('Send Message', 'సందేశం పంపండి')}`}
          onPress={handleSubmit}
          disabled={loading}
        />

        <Text style={styles.footnote}>
          {t('Your details are used only to reply to your message.', 'మీ వివరాలు మీ సందేశానికి జవాబు ఇవ్వడానికి మాత్రమే ఉపయోగించబడతాయి.')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 20, color: colors.brand600, fontWeight: '600', marginBottom: 8 },
  phone: { color: '#374151', fontWeight: '600', fontSize: 16, textDecorationLine: 'underline' },
  body: { color: '#374151', fontSize: 16 },
  panel: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gold200, borderRadius: 6, padding: 18, marginTop: 6 },
  formTitle: { fontSize: 24, color: colors.brand600, fontWeight: '600', marginBottom: 16 },
  footnote: { textAlign: 'center', fontSize: 13, color: colors.subtle, marginTop: 16 },
});
