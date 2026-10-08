import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Card, Field, Screen, Title, styles as ui } from '../components/ui';
import { ApiError, completeFirstLogin } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';

// Members who logged in with the default password (123456) set their own
// email and password here, as on the website's /member/first-login.
export default function FirstLoginScreen() {
  const { t } = useLanguage();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!loading && !session) return <Redirect href="/login" />;

  const errors: Record<string, string> = {
    invalid_email: t('Please enter a valid email address.', 'దయచేసి సరైన ఈమెయిల్ చిరునామా ఇవ్వండి.'),
    password_too_short: t('The password must be at least 8 characters.', 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి.'),
    password_is_default: t('Please choose a password other than 123456.', 'దయచేసి 123456 కాకుండా వేరే పాస్‌వర్డ్ ఎంచుకోండి.'),
    email_taken: t(
      'This email is already used by another account. Please use a different one.',
      'ఈ ఈమెయిల్ ఇప్పటికే మరో ఖాతాకు ఉంది. దయచేసి వేరే ఈమెయిల్ ఇవ్వండి.'
    ),
  };

  const save = async () => {
    setError('');
    if (password.length < 8) return setError(errors.password_too_short);
    if (password !== confirm) return setError(t('The two passwords do not match.', 'రెండు పాస్‌వర్డ్‌లు సరిపోలలేదు.'));

    setSaving(true);
    try {
      const result = await completeFirstLogin(email.trim(), password);
      // Sign in again with the new details so the session carries them
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: result.email, password });
      router.replace(signInError ? '/login' : '/profile');
    } catch (err) {
      if (err instanceof ApiError) {
        setError((err.code && errors[err.code]) || err.message || t('Could not save. Please try again.', 'సేవ్ కాలేదు. మళ్ళీ ప్రయత్నించండి.'));
      } else {
        setError(t('Network error. Please try again.', 'నెట్‌వర్క్ లోపం. మళ్ళీ ప్రయత్నించండి.'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Title>{t('Set up your login', 'మీ లాగిన్ ఏర్పాటు చేసుకోండి')}</Title>
        <Text style={[ui.muted, { marginBottom: 14 }]}>
          {t(
            'Welcome to the Parishath! Please enter your own email address and a new password. From now on you will log in with these.',
            'పరిషత్‌కు స్వాగతం! దయచేసి మీ సొంత ఈమెయిల్ చిరునామా మరియు కొత్త పాస్‌వర్డ్ ఇవ్వండి. ఇకపై మీరు వీటితోనే లాగిన్ అవుతారు.'
          )}
        </Text>
        <Banner type="error" text={error} />
        <Field label={t('Your email', 'మీ ఈమెయిల్')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label={t('New password (at least 8 characters)', 'కొత్త పాస్‌వర్డ్ (కనీసం 8 అక్షరాలు)')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        <Field label={t('Confirm new password', 'కొత్త పాస్‌వర్డ్ మళ్ళీ ఇవ్వండి')} value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />
        <Button label={saving ? t('Saving...', 'సేవ్ అవుతోంది...') : t('Save and continue', 'సేవ్ చేసి కొనసాగండి')} onPress={save} loading={saving} />
      </Card>
    </Screen>
  );
}
