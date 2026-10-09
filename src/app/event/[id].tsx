import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { EventStatusBadge } from '../../components/event-status';
import { Banner, Button, Card, Field, Loading, Screen, styles as ui } from '../../components/ui';
import { ApiError, fetchMyMember, registerForEvent } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatDate } from '../../lib/format';
import { useLanguage } from '../../lib/language';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import { eventCategoryLabel } from '../../shared/event-labels';
import type { ParishathEvent } from '../../shared/types';

// An event with its details and the registration form, as on the website's /events/[id]
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [event, setEvent] = useState<ParishathEvent | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', attendees: '1' });
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState<'new' | 'updated' | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: dbError }) => {
        if (dbError || !data) setError(language === 'en' ? 'Event not found' : 'కార్యక్రమం కనుగొనబడలేదు');
        else setEvent(data as ParishathEvent);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Logged-in members get their details filled in; they can still change them
  useEffect(() => {
    if (!user) return;
    fetchMyMember()
      .then((m) => setForm((f) => ({ ...f, name: f.name || m.name || '', email: f.email || m.email || user.email || '', phone: f.phone || m.phone || '' })))
      .catch(() => setForm((f) => ({ ...f, email: f.email || user.email || '' })));
  }, [user]);

  if (error) {
    return (
      <Screen>
        <Banner type="error" text={error} />
      </Screen>
    );
  }
  if (!event) return <Loading />;

  const errorText = (code?: string, remaining?: number) => {
    switch (code) {
      case 'invalid_name':
        return t('Please enter your name.', 'దయచేసి మీ పేరు నమోదు చేయండి.');
      case 'invalid_email':
        return t('Please enter a valid email address.', 'దయచేసి సరైన ఈమెయిల్ చిరునామా నమోదు చేయండి.');
      case 'invalid_phone':
        return t('Please enter a valid phone number.', 'దయచేసి సరైన ఫోన్ నంబర్ నమోదు చేయండి.');
      case 'invalid_attendees':
        return t('Number of people must be between 1 and 50.', 'హాజరయ్యేవారి సంఖ్య 1 నుండి 50 మధ్య ఉండాలి.');
      case 'full':
        return t(`Only ${remaining ?? 0} places are left.`, `ఇంకా ${remaining ?? 0} స్థానాలు మాత్రమే మిగిలి ఉన్నాయి.`);
      case 'closed':
        return t('Registration for this event is closed.', 'ఈ కార్యక్రమానికి నమోదు ముగిసింది.');
      default:
        return t('Registration failed. Please try again.', 'నమోదు విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.');
    }
  };

  const register = async () => {
    setRegistering(true);
    setRegError('');
    setRegSuccess(null);
    try {
      const result = await registerForEvent(event.id, { ...form, attendees: Number(form.attendees) });
      setEvent({ ...event, registered_count: result.registered_count });
      setRegSuccess(result.updated ? 'updated' : 'new');
    } catch (err) {
      const remaining = err instanceof ApiError ? Number(err.body?.remaining) : undefined;
      setRegError(errorText(err instanceof ApiError ? err.code : undefined, remaining));
    } finally {
      setRegistering(false);
    }
  };

  const title = language === 'en' ? event.title_en : event.title_te;
  const description = language === 'en' ? event.description_en : event.description_te;
  const location = language === 'en' ? event.location_en : event.location_te;
  const isFull = !!event.capacity && event.registered_count >= event.capacity;
  const canRegister = event.registration_required !== false && event.status === 'upcoming' && !isFull;
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const details: [string, string | null | undefined][] = [
    [t('Date', 'తేదీ'), formatDate(event.event_date, language, 'long')],
    [t('Time', 'సమయం'), event.event_time?.slice(0, 5)],
    [t('Location', 'ప్రదేశం'), location],
    [t('Category', 'వర్గం'), event.category ? eventCategoryLabel(event.category, language) : null],
    [t('Difficulty Level', 'కష్ట స్థాయి'), event.difficulty_level],
    [t('Age Group', 'వయస్సు సమూహం'), event.age_group],
    [t('Organized By', 'నిర్వాహకులు'), [event.organizer_name, event.organizer_phone, event.organizer_email].filter(Boolean).join('\n') || null],
    [t('People registered', 'నమోదైనవారు'), event.capacity ? `${event.registered_count ?? 0} / ${event.capacity}` : null],
  ];

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      {event.image_url ? <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" /> : null}
      <EventStatusBadge status={event.status} language={language} />
      <Text style={styles.title}>{title}</Text>

      <Card>
        {details
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <View key={label} style={styles.detail}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={ui.muted}>{value}</Text>
            </View>
          ))}
        {isFull && <Text style={styles.full}>{t('Event is Full', 'కార్యక్రమం పూర్తిగా నిండిపోయింది')}</Text>}
      </Card>

      {description ? (
        <Card>
          <Text style={styles.section}>{t('About This Event', 'ఈ కార్యక్రమం గురించి')}</Text>
          <Text style={[ui.muted, { fontSize: 16, lineHeight: 25 }]}>{description}</Text>
        </Card>
      ) : null}

      <Card>
        {event.registration_required === false ? (
          <Text style={ui.muted}>{t('Registration not required', 'నమోదు అవసరం లేదు')}</Text>
        ) : canRegister ? (
          <>
            <Text style={styles.section}>{t('Register to attend', 'హాజరు కోసం నమోదు చేసుకోండి')}</Text>
            {regSuccess && (
              <Banner
                type="success"
                text={
                  regSuccess === 'updated'
                    ? t('Your registration has been updated.', 'మీ నమోదు నవీకరించబడింది.')
                    : t('You are registered. See you there!', 'మీ నమోదు పూర్తయింది. కార్యక్రమంలో కలుద్దాం!')
                }
              />
            )}
            <Banner type="error" text={regError} />
            <Field label={t('Name', 'పేరు')} value={form.name} onChangeText={set('name')} />
            <Field label={t('Email', 'ఈమెయిల్')} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
            <Field label={t('Phone', 'ఫోన్ నంబర్')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            <Field
              label={t('Number of people attending (including you)', 'హాజరయ్యేవారి సంఖ్య (మీతో కలిపి)')}
              value={form.attendees}
              onChangeText={(v) => set('attendees')(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
            <Button label={registering ? t('Registering...', 'నమోదు అవుతోంది...') : t('Register', 'నమోదు చేసుకోండి')} onPress={register} loading={registering} />
          </>
        ) : (
          <Text style={ui.muted}>
            {isFull
              ? t('This event is full.', 'ఈ కార్యక్రమం నిండిపోయింది.')
              : t('Registration for this event is closed.', 'ఈ కార్యక్రమానికి నమోదు ముగిసింది.')}
          </Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 210, borderRadius: 6, marginBottom: 14, backgroundColor: colors.gold100 },
  title: { fontSize: 24, color: colors.brand600, fontWeight: '600', marginTop: 8, marginBottom: 14 },
  detail: { marginBottom: 10 },
  detailLabel: { fontWeight: '600', color: colors.brand600, marginBottom: 2 },
  section: { fontSize: 18, color: colors.brand600, fontWeight: '600', marginBottom: 10 },
  full: { color: colors.vermilion600, fontWeight: '600' },
});
