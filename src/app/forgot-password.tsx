import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Card, Field, Screen, Title, styles as ui } from '../components/ui';
import { ApiError, requestPasswordReset } from '../lib/api';
import { useLanguage } from '../lib/language';

// As on the website's /forgot-password: the reset link is emailed and opens the website
export default function ForgotPasswordScreen() {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!identifier.trim()) {
      setError(t('Please enter your email or 10-digit mobile number.', 'దయచేసి మీ ఈమెయిల్ లేదా 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి.'));
      return;
    }
    setSending(true);
    try {
      await requestPasswordReset(identifier.trim());
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'invalid_identifier'
          ? t('Please enter your email or 10-digit mobile number.', 'దయచేసి మీ ఈమెయిల్ లేదా 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి.')
          : t('Could not send the email. Please try again later.', 'ఈమెయిల్ పంపలేకపోయాం. కొద్దిసేపటి తర్వాత ప్రయత్నించండి.')
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Title>{t('Forgot password', 'పాస్‌వర్డ్ మర్చిపోయారా')}</Title>
        {sent ? (
          <Banner
            type="success"
            text={t(
              'If this matches a member login with an email address, we have sent a link to choose a new password. Please check your inbox and spam folder.',
              'ఇది ఈమెయిల్ ఉన్న సభ్యుల లాగిన్‌కు సరిపోతే, కొత్త పాస్‌వర్డ్ ఎంచుకునే లింక్ పంపాం. దయచేసి మీ ఇన్‌బాక్స్, స్పామ్ ఫోల్డర్ చూడండి.'
            )}
          />
        ) : (
          <>
            <Banner type="error" text={error} />
            <Field
              label={t('Email or mobile number', 'ఈమెయిల్ లేదా మొబైల్ నంబర్')}
              placeholder={t('Email, or your 10-digit mobile number', 'ఈమెయిల్, లేదా 10 అంకెల మొబైల్ నంబర్')}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              onSubmitEditing={submit}
            />
            <Button label={sending ? t('Sending...', 'పంపుతోంది...') : t('Send reset link', 'రీసెట్ లింక్ పంపండి')} onPress={submit} loading={sending} />
          </>
        )}
        <Text style={[ui.muted, { textAlign: 'center', marginTop: 14 }]}>
          {t(
            'Members who have no email on their login can ask the admin to reset their password to 123456.',
            'లాగిన్‌కు ఈమెయిల్ లేని సభ్యులు తమ పాస్‌వర్డ్‌ను 123456 కు రీసెట్ చేయమని నిర్వాహకులను అడగవచ్చు.'
          )}
        </Text>
        <Button variant="secondary" label={t('Back to login', 'లాగిన్‌కు తిరిగి')} onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}
