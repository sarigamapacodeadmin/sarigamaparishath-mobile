import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Banner, Button, Card, Field, Screen, Title } from '../components/ui';
import { ApiError, changePassword } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/language';

// Same rules as the website's My Profile > Change Password
export default function ChangePasswordScreen() {
  const { t } = useLanguage();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  if (!loading && !session) return <Redirect href="/login" />;

  const tooShort = t('The password must be at least 8 characters.', 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి.');
  const isDefault = t('Please choose a password other than 123456.', 'దయచేసి 123456 కాకుండా వేరే పాస్‌వర్డ్ ఎంచుకోండి.');

  const submit = async () => {
    setError('');
    setSaved(false);
    if (password.length < 8) return setError(tooShort);
    if (password !== confirm) return setError(t('The two passwords do not match.', 'రెండు పాస్‌వర్డ్‌లు సరిపోలలేదు.'));
    setSaving(true);
    try {
      await changePassword(password);
      setPassword('');
      setConfirm('');
      setSaved(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(
        code === 'password_too_short'
          ? tooShort
          : code === 'password_is_default'
            ? isDefault
            : t('Could not save. Please try again.', 'సేవ్ కాలేదు. మళ్ళీ ప్రయత్నించండి.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Title>{t('Change password', 'పాస్‌వర్డ్ మార్చండి')}</Title>
        <Banner type="error" text={error} />
        {saved && <Banner type="success" text={t('Your password has been changed.', 'మీ పాస్‌వర్డ్ మార్చబడింది.')} />}
        <Field
          label={t('New password (at least 8 characters)', 'కొత్త పాస్‌వర్డ్ (కనీసం 8 అక్షరాలు)')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Field
          label={t('Confirm new password', 'కొత్త పాస్‌వర్డ్ మళ్ళీ ఇవ్వండి')}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={submit}
        />
        <Button label={saving ? t('Saving...', 'సేవ్ అవుతోంది...') : t('Change password', 'పాస్‌వర్డ్ మార్చండి')} onPress={submit} loading={saving} />
        {saved && <Button variant="secondary" label={t('Back to my profile', 'నా ప్రొఫైల్‌కు తిరిగి')} onPress={() => router.back()} />}
      </Card>
    </Screen>
  );
}
