import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Card, Field, Loading, Screen, Title, styles as ui } from '../components/ui';
import { ApiError, createMyMember, fetchMyMember } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { mustChangePassword } from '../shared/default-login';
import type { Member } from '../shared/types';

const EMPTY_FORM = { name: '', phone: '', city: '', state: '', gotra: '', bio_en: '' };

// The member's own profile, as on the website's /member/profile
export default function ProfileScreen() {
  const { t } = useLanguage();
  const { session, user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [donations, setDonations] = useState({ total: 0, count: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (key: keyof typeof EMPTY_FORM) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const m = await fetchMyMember();
      setMember(m);
      setForm({
        name: m.name || '',
        phone: m.phone || '',
        city: m.city || '',
        state: m.state || '',
        gotra: m.gotra || '',
        bio_en: m.bio_en || '',
      });
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

  const saveProfile = async () => {
    if (!member) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('members')
        .update({
          name: form.name,
          phone: form.phone,
          city: form.city || null,
          state: form.state || null,
          gotra: form.gotra || null,
          bio_en: form.bio_en || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.id);
      if (updateError) throw updateError;
      setMember({ ...member, ...form });
      setSuccess(t('Profile updated successfully.', 'ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది.'));
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to update profile', 'ప్రొఫైల్ నవీకరణ విఫలమైంది'));
    } finally {
      setSaving(false);
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
          <Field label={t('City', 'నగరం')} value={form.city} onChangeText={set('city')} />
          <Field label={t('State', 'రాష్ట్రం')} value={form.state} onChangeText={set('state')} />
          <Field label={t('Gotra', 'గోత్రం')} value={form.gotra} onChangeText={set('gotra')} />
          <Field label={t('About me', 'నా గురించి')} value={form.bio_en} onChangeText={set('bio_en')} multiline />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 24, fontWeight: '600', color: colors.brand600, marginBottom: 4 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.brand600 },
  row: { marginBottom: 12 },
  rowLabel: { fontWeight: '600', color: colors.brand600, marginBottom: 2 },
});
