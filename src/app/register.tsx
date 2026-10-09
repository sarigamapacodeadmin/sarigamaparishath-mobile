import { router } from 'expo-router';
import { useState } from 'react';
import { Banner, Button, Card, Field, Screen, Title } from '../components/ui';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';

const EMPTY = { name: '', email: '', password: '', confirmPassword: '', phone: '', city: '', state: '', gotra: '' };

// Same steps as the website's /register: a Supabase login, then the members row
export default function RegisterScreen() {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof EMPTY) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setError('');
    const email = form.email.trim().toLowerCase();
    if (!form.name.trim() || !email || !form.password || !form.phone.trim()) {
      return setError(t('Name, Email, Password, and Phone are required', 'పేరు, ఈమెయిల్, పాస్‌వర్డ్ మరియు ఫోన్ తప్పనిసరి'));
    }
    if (form.password !== form.confirmPassword) return setError(t('Passwords do not match', 'పాస్‌వర్డ్‌లు సరిపోలలేదు'));
    if (form.password.length < 6) {
      return setError(t('Password must be at least 6 characters', 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి'));
    }

    setSaving(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password: form.password });
      if (authError) {
        if (/already registered/i.test(authError.message)) {
          throw new Error(
            t(
              'This email already has a login. Please log in instead. If you have no member profile yet, you can create it from My Profile after logging in.',
              'ఈ ఈమెయిల్‌కు ఇప్పటికే లాగిన్ ఉంది. దయచేసి లాగిన్ అవ్వండి. మీకు ఇంకా సభ్యుల ప్రొఫైల్ లేకపోతే, లాగిన్ అయ్యాక నా ప్రొఫైల్ నుండి సృష్టించవచ్చు.'
            )
          );
        }
        throw authError;
      }
      if (!data.user) throw new Error(t('Failed to create user', 'ఖాతా సృష్టించడం విఫలమైంది'));

      const { error: memberError } = await supabase.from('members').insert([
        {
          user_id: data.user.id,
          name: form.name.trim(),
          email,
          phone: form.phone.trim(),
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          gotra: form.gotra.trim() || null,
          status: 'active',
          category: 'veda',
          joined_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        },
      ]);
      if (memberError) {
        if (memberError.code === '23505') {
          throw new Error(
            t(
              'A member with this email already exists. Please log in and open My Profile.',
              'ఈ ఈమెయిల్‌తో ఇప్పటికే సభ్యత్వం ఉంది. దయచేసి లాగిన్ అయ్యి నా ప్రొఫైల్ తెరవండి.'
            )
          );
        }
        throw memberError;
      }

      // signUp may have signed the new member in; they log in themselves, as on the website
      await supabase.auth.signOut();
      setForm(EMPTY);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Registration failed', 'నమోదు విఫలమైంది'));
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <Card>
          <Title>{t('Register', 'నమోదు')}</Title>
          <Banner
            type="success"
            text={t('Registration successful! Please verify your email and login.', 'నమోదు విజయవంతమైంది! దయచేసి మీ ఈమెయిల్ ధృవీకరించి లాగిన్ అవ్వండి.')}
          />
          <Button label={t('Login', 'లాగిన్')} onPress={() => router.replace('/login')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Title>{t('Become a Member', 'సభ్యులుగా చేరండి')}</Title>
        <Banner type="error" text={error} />
        <Field label={`${t('Full name', 'పూర్తి పేరు')} *`} value={form.name} onChangeText={set('name')} autoComplete="name" />
        <Field
          label={`${t('Email', 'ఈమెయిల్')} *`}
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />
        <Field label={`${t('Phone', 'ఫోన్')} *`} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" />
        <Field
          label={`${t('Password (at least 6 characters)', 'పాస్‌వర్డ్ (కనీసం 6 అక్షరాలు)')} *`}
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Field
          label={`${t('Confirm password', 'పాస్‌వర్డ్ మళ్ళీ ఇవ్వండి')} *`}
          value={form.confirmPassword}
          onChangeText={set('confirmPassword')}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Field label={t('City', 'నగరం')} value={form.city} onChangeText={set('city')} />
        <Field label={t('State', 'రాష్ట్రం')} value={form.state} onChangeText={set('state')} />
        <Field label={t('Gotra', 'గోత్రం')} value={form.gotra} onChangeText={set('gotra')} />
        <Button label={saving ? t('Registering...', 'నమోదు అవుతోంది...') : t('Register', 'నమోదు చేయండి')} onPress={submit} loading={saving} />
      </Card>
    </Screen>
  );
}
