import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Card, Chip, Field, Loading, Screen, Title, styles as ui } from '../components/ui';
import { ApiError, createMyMember, deleteMyPersonalData, fetchMyMember, updateMyMember } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { mustChangePassword } from '../shared/default-login';
import { findPlace, placeLabel, suggestPlaces } from '../shared/places';
import type { Member } from '../shared/types';
import { KSHOURA_LABELS, LIFE_STAGES, LIFE_STAGE_LABELS, isLifeStage } from '../shared/kshoura';

const EMPTY_FORM = {
  name: '',
  phone: '',
  city: '',
  state: '',
  gotra: '',
  bio_en: '',
  birth_date: '',
  birth_time: '',
  birth_place: '',
  language_preference: '',
  life_stage: '',
};

const formFrom = (m: Member) => ({
  name: m.name || '',
  phone: m.phone || '',
  city: m.city || '',
  state: m.state || '',
  gotra: m.gotra || '',
  bio_en: m.bio_en || '',
  birth_date: m.birth_date || '',
  birth_time: (m.birth_time || '').slice(0, 5),
  birth_place: m.birth_place || '',
  language_preference: m.language_preference || '',
  life_stage: m.life_stage || '',
});

// Text field with tap-to-fill suggestions from the place list
function PlaceField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  const { language, t } = useLanguage();
  const [focused, setFocused] = useState(false);
  const matched = findPlace(value);
  const suggestions = focused && !matched ? suggestPlaces(value) : [];
  return (
    <View>
      <Field
        label={label}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={t('Start typing, e.g. Vijayawada', 'టైప్ చేయండి, ఉదా. విజయవాడ')}
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((pl) => (
            <Pressable key={pl.en} accessibilityRole="button" onPress={() => onChangeText(placeLabel(pl, language))} style={styles.suggestion}>
              <Text style={{ color: colors.brand700 }}>{placeLabel(pl, language)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// The member's own profile, as on the website's /member/profile
export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  // "Fill in profile" on the Home screen's haircut card opens the form
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { session, user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [donations, setDonations] = useState({ total: 0, count: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = (key: keyof typeof EMPTY_FORM) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const m = await fetchMyMember();
      setMember(m);
      setForm(formFrom(m));
      if (edit === '1') setEditing(true);
      // Donation totals, where donations carry the member's login
      const { data } = await supabase.from('donations').select('amount').eq('user_id', user.id).eq('status', 'completed');
      if (data) {
        setDonations({ total: data.reduce((sum: number, d: { amount: number | null }) => sum + (d.amount || 0), 0), count: data.length });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Logged in, but no member record yet: offer to create one
        setMember(null);
        setForm({ ...EMPTY_FORM, name: (user.user_metadata?.name as string) || '' });
      } else {
        setError(err instanceof Error ? err.message : t('Failed to load profile', 'ప్రొఫైల్ లోడ్ విఫలమైంది'));
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading) return <Loading />;

  if (!session || !user) {
    return (
      <Screen>
        <Card>
          <Title>{t('My Profile', 'నా ప్రొఫైల్')}</Title>
          <Text style={[ui.muted, { textAlign: 'center', marginBottom: 12 }]}>
            {t('Please log in to see your member profile.', 'మీ సభ్యుల ప్రొఫైల్ చూడటానికి దయచేసి లాగిన్ అవ్వండి.')}
          </Text>
          <Button label={t('Login', 'లాగిన్')} onPress={() => router.push('/login')} />
        </Card>
      </Screen>
    );
  }

  if (mustChangePassword(user)) return <Redirect href="/first-login" />;
  if (loading) return <Loading />;

  const createProfile = async () => {
    setError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError(t('Name and phone are required', 'పేరు మరియు ఫోన్ తప్పనిసరి'));
      return;
    }
    setSaving(true);
    try {
      setMember(await createMyMember(form));
      setSuccess(t('Your member profile has been created.', 'మీ సభ్యుల ప్రొఫైల్ సృష్టించబడింది.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Could not create profile', 'ప్రొఫైల్ సృష్టించడం విఫలమైంది'));
    } finally {
      setSaving(false);
    }
  };

  const errorText = (code: string) => {
    switch (code) {
      case 'name_required':
        return t('Please enter your name.', 'దయచేసి మీ పేరు నమోదు చేయండి.');
      case 'phone_required':
        return t('Please enter your phone number.', 'దయచేసి మీ ఫోన్ నంబర్ నమోదు చేయండి.');
      case 'invalid_birth_date':
        return t('Please enter the date of birth as YYYY-MM-DD.', 'దయచేసి పుట్టిన తేదీని YYYY-MM-DD గా నమోదు చేయండి.');
      case 'invalid_birth_time':
        return t('Please enter the time of birth as HH:MM (24-hour).', 'దయచేసి పుట్టిన సమయాన్ని HH:MM (24 గంటలు) గా నమోదు చేయండి.');
      case 'birth_details_not_ready':
        return t('Birth details cannot be saved yet. Please try again later.', 'పుట్టిన వివరాలు ఇంకా సేవ్ చేయలేము. దయచేసి కొంతసేపటి తర్వాత ప్రయత్నించండి.');
      default:
        return code || t('Failed to update profile', 'ప్రొఫైల్ నవీకరణ విఫలమైంది');
    }
  };

  const saveProfile = async () => {
    if (!member) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await updateMyMember(form);
      setMember(updated);
      setForm(formFrom(updated));
      if (updated.language_preference === 'en' || updated.language_preference === 'te') setLanguage(updated.language_preference);
      setSuccess(
        t('Profile updated successfully.', 'ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది.') +
          (updated.life_stage_not_saved ? ` ${KSHOURA_LABELS[language].lifeStageNotSaved}` : '')
      );
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError && err.code ? errorText(err.code) : t('Failed to update profile', 'ప్రొఫైల్ నవీకరణ విఫలమైంది'));
    } finally {
      setSaving(false);
    }
  };

  const deletePersonalData = async () => {
    setError('');
    setSuccess('');
    setDeleting(true);
    try {
      const updated = await deleteMyPersonalData();
      setMember(updated);
      setForm(formFrom(updated));
      setEditing(false);
      setConfirmingDelete(false);
      setSuccess(t('Your personal details have been deleted.', 'మీ వ్యక్తిగత వివరాలు తొలగించబడ్డాయి.'));
    } catch {
      setError(t('Could not delete your data', 'మీ వివరాలు తొలగించడం విఫలమైంది'));
    } finally {
      setDeleting(false);
    }
  };

  const logout = async () => {
    await signOut();
    router.replace('/');
  };

  if (!member) {
    return (
      <Screen>
        <Card>
          <Title>{t('Complete your member profile', 'మీ సభ్యుల ప్రొఫైల్ పూర్తి చేయండి')}</Title>
          <Text style={[ui.muted, { marginBottom: 14 }]}>
            {t(
              'You are logged in, but your login does not have a member profile yet. Fill in these details to create it.',
              'మీరు లాగిన్ అయ్యారు, కానీ మీ లాగిన్‌కు ఇంకా సభ్యుల ప్రొఫైల్ లేదు. దీన్ని సృష్టించడానికి ఈ వివరాలు నింపండి.'
            )}
          </Text>
          <Banner type="error" text={error} />
          <Field label={`${t('Full name', 'పూర్తి పేరు')} *`} value={form.name} onChangeText={set('name')} />
          <Field label={`${t('Phone', 'ఫోన్')} *`} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <Field label={t('City', 'నగరం')} value={form.city} onChangeText={set('city')} />
          <Field label={t('State', 'రాష్ట్రం')} value={form.state} onChangeText={set('state')} />
          <Field label={t('Gotra', 'గోత్రం')} value={form.gotra} onChangeText={set('gotra')} />
          <Button label={t('Create profile', 'ప్రొఫైల్ సృష్టించండి')} onPress={createProfile} loading={saving} />
          <Button variant="secondary" label={t('Logout', 'లాగౌట్')} onPress={logout} />
        </Card>
      </Screen>
    );
  }

  const rows: { label: string; value?: string | null }[] = [
    { label: t('Email', 'ఈమెయిల్'), value: member.email },
    { label: t('Phone', 'ఫోన్'), value: member.phone },
    { label: t('City', 'నగరం'), value: member.city },
    { label: t('State', 'రాష్ట్రం'), value: member.state },
    { label: t('Gotra', 'గోత్రం'), value: member.gotra },
    { label: t('About me', 'నా గురించి'), value: member.bio_en },
    { label: t('Date of birth', 'పుట్టిన తేదీ'), value: member.birth_date },
    { label: t('Time of birth (IST)', 'పుట్టిన సమయం (IST)'), value: member.birth_time?.slice(0, 5) },
    { label: t('Place of birth', 'పుట్టిన ఊరు'), value: member.birth_place },
    {
      label: t('Preferred language', 'ఇష్టమైన భాష'),
      value: member.language_preference === 'te' ? 'తెలుగు' : member.language_preference === 'en' ? 'English' : null,
    },
    {
      label: KSHOURA_LABELS[language].lifeStageLabel,
      value: isLifeStage(member.life_stage) ? LIFE_STAGE_LABELS[member.life_stage][language] : null,
    },
  ];

  return (
    <Screen>
      <Banner type="error" text={error} />
      <Banner type="success" text={success} />
      <Card>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={ui.muted}>
          {t('Member since', 'సభ్యత్వం నుండి')} {new Date(member.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
        </Text>
      </Card>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>₹{donations.total.toLocaleString('en-IN')}</Text>
          <Text style={ui.muted}>{t('Total donated', 'మొత్తం విరాళం')}</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{donations.count}</Text>
          <Text style={ui.muted}>{t('Donations', 'విరాళాలు')}</Text>
        </Card>
      </View>

      {editing ? (
        <Card>
          <Field label={t('Full name', 'పూర్తి పేరు')} value={form.name} onChangeText={set('name')} />
          <Field label={t('Phone', 'ఫోన్')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <PlaceField label={t('City', 'నగరం')} value={form.city} onChangeText={set('city')} />
          <Field label={t('State', 'రాష్ట్రం')} value={form.state} onChangeText={set('state')} />
          <Field label={t('Gotra', 'గోత్రం')} value={form.gotra} onChangeText={set('gotra')} />
          <Field label={t('About me', 'నా గురించి')} value={form.bio_en} onChangeText={set('bio_en')} multiline />

          <Text style={styles.section}>{t('Birth details', 'జన్మ వివరాలు')}</Text>
          <Text style={[ui.muted, { marginBottom: 10 }]}>
            {t(
              'Used only to show your birth star and a personalised panchangam. Only you can see them.',
              'మీ జన్మ నక్షత్రం, మీ కోసం పంచాంగం చూపడానికి మాత్రమే. ఇవి మీకు మాత్రమే కనిపిస్తాయి.'
            )}
          </Text>
          <Field
            label={t('Date of birth (YYYY-MM-DD)', 'పుట్టిన తేదీ (YYYY-MM-DD)')}
            value={form.birth_date}
            onChangeText={set('birth_date')}
            placeholder="1975-08-15"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Field
            label={t('Time of birth, 24-hour IST (HH:MM)', 'పుట్టిన సమయం, 24 గంటలు IST (HH:MM)')}
            value={form.birth_time}
            onChangeText={set('birth_time')}
            placeholder="06:30"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          <PlaceField label={t('Place of birth', 'పుట్టిన ఊరు')} value={form.birth_place} onChangeText={set('birth_place')} />
          {form.birth_place && !findPlace(form.birth_place) ? (
            <Text style={[ui.muted, { marginTop: -6, marginBottom: 10 }]}>
              {t(
                'Not in our list. Pick the nearest town from the suggestions so we can work out your birth star.',
                'ఇది మా జాబితాలో లేదు. మీ జన్మ నక్షత్రం కోసం సూచనల నుండి దగ్గరి ఊరు ఎంచుకోండి.'
              )}
            </Text>
          ) : null}

          <Text style={styles.rowLabel}>{t('Preferred language', 'ఇష్టమైన భాష')}</Text>
          <View style={styles.chips}>
            {([['', t('Not set', 'ఎంచుకోలేదు')], ['en', 'English'], ['te', 'తెలుగు']] as const).map(([value, label]) => (
              <Chip key={value || 'none'} label={label} selected={form.language_preference === value} onPress={() => set('language_preference')(value)} />
            ))}
          </View>
          <Text style={styles.rowLabel}>{KSHOURA_LABELS[language].lifeStageLabel}</Text>
          <View accessibilityRole="radiogroup" style={{ marginBottom: 12 }}>
            {LIFE_STAGES.map((stage) => {
              const selected = form.life_stage === stage;
              return (
                <Pressable
                  key={stage}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => set('life_stage')(stage)}
                  style={[styles.radio, selected && styles.radioSelected]}
                >
                  <View style={[styles.radioDot, selected && styles.radioDotSelected]} />
                  <Text style={{ color: colors.brand700, flex: 1 }}>{LIFE_STAGE_LABELS[stage][language]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button label={t('Save', 'సేవ్ చేయండి')} onPress={saveProfile} loading={saving} />
          <Button
            variant="secondary"
            label={t('Cancel', 'రద్దు')}
            onPress={() => {
              setEditing(false);
              load();
            }}
          />
        </Card>
      ) : (
        <Card>
          {rows
            .filter((r) => r.value)
            .map((r) => (
              <View key={r.label} style={styles.row}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={ui.muted}>{r.value}</Text>
              </View>
            ))}
          <Button label={t('Edit profile', 'ప్రొఫైల్ మార్చండి')} onPress={() => setEditing(true)} />
        </Card>
      )}

      <Button variant="secondary" label={t('Change password', 'పాస్‌వర్డ్ మార్చండి')} onPress={() => router.push('/change-password')} />
      <Button variant="secondary" label={t('Logout', 'లాగౌట్')} onPress={logout} />

      <Card>
        <Text style={styles.danger}>{t('Delete my personal data', 'నా వ్యక్తిగత వివరాలు తొలగించండి')}</Text>
        <Text style={[ui.muted, { marginBottom: 12 }]}>
          {t(
            'This removes your birth details, city, state, gotra, bio and language choice. Your name, phone and email stay so you can still log in and get donation receipts.',
            'ఇది మీ జన్మ వివరాలు, నగరం, రాష్ట్రం, గోత్రం, మీ గురించి, భాష ఎంపికను తొలగిస్తుంది. లాగిన్, విరాళాల రసీదుల కోసం మీ పేరు, ఫోన్, ఈమెయిల్ ఉంటాయి.'
          )}
        </Text>
        {confirmingDelete ? (
          <>
            <Button label={t('Yes, delete them', 'అవును, తొలగించండి')} onPress={deletePersonalData} loading={deleting} />
            <Button variant="secondary" label={t('Keep them', 'ఉంచండి')} onPress={() => setConfirmingDelete(false)} />
          </>
        ) : (
          <Button variant="secondary" label={t('Delete my personal data', 'నా వ్యక్తిగత వివరాలు తొలగించండి')} onPress={() => setConfirmingDelete(true)} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.gold200,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  radioSelected: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.brand600 },
  radioDotSelected: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  name: { fontSize: 24, fontWeight: '600', color: colors.brand600, marginBottom: 4 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.brand600 },
  row: { marginBottom: 12 },
  rowLabel: { fontWeight: '600', color: colors.brand600, marginBottom: 2 },
  section: { fontSize: 18, fontWeight: '600', color: colors.brand600, marginTop: 8, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 14 },
  suggestions: { marginTop: -8, marginBottom: 12, borderWidth: 1, borderColor: colors.gold200, borderRadius: 6, backgroundColor: colors.white },
  suggestion: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.gold100 },
  danger: { fontSize: 18, fontWeight: '600', color: colors.vermilion700, marginBottom: 6 },
});
