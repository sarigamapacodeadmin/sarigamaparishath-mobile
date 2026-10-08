import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Card, Field, Screen, Title, styles as ui } from '../components/ui';
import { LoginError, useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/config';
import { useLanguage } from '../lib/language';

// Same rules as the website's /login: an email, or the member's 10-digit mobile number
export default function LoginScreen() {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!identifier.trim() || !password) {
      setError(t('Email or mobile number and password are required', 'ఈమెయిల్ లేదా మొబైల్ నంబర్ మరియు పాస్‌వర్డ్ తప్పనిసరి'));
      return;
    }
    setLoading(true);
    try {
      const { mustChange } = await signIn(identifier, password);
      // Members on the default password set their own email and password first
      router.replace(mustChange ? '/first-login' : '/profile');
    } catch (err) {
      if (err instanceof LoginError && err.code === 'shared_phone') {
        setError(
          t(
            'This mobile number belongs to more than one member. Please log in with your email, or ask the admin.',
            'ఈ మొబైల్ నంబర్ ఒకరి కంటే ఎక్కువ సభ్యులకు ఉంది. దయచేసి ఈమెయిల్‌తో లాగిన్ అవ్వండి, లేదా నిర్వాహకులను అడగండి.'
          )
        );
      } else if (err instanceof LoginError && err.code === 'invalid_phone_login') {
        setError(t('Invalid mobile number or password', 'మొబైల్ నంబర్ లేదా పాస్‌వర్డ్ తప్పు'));
      } else {
        setError(err instanceof Error ? err.message : t('Login failed', 'లాగిన్ విఫలమైంది'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Title>{t('Member Login', 'సభ్యుల లాగిన్')}</Title>
        {!isSupabaseConfigured && (
          <Banner type="error" text="The app is missing its Supabase settings (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)." />
        )}
        <Banner type="error" text={error} />
        <Field
          label={t('Email or mobile number', 'ఈమెయిల్ లేదా మొబైల్ నంబర్')}
          placeholder={t('Email, or your 10-digit mobile number', 'ఈమెయిల్, లేదా 10 అంకెల మొబైల్ నంబర్')}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
        />
        <Field
          label={t('Password', 'పాస్‌వర్డ్')}
          placeholder={t('Your password', 'మీ పాస్‌వర్డ్')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={submit}
        />
        <Button label={loading ? t('Logging in...', 'లాగిన్ అవుతోంది...') : t('Login', 'లాగిన్')} onPress={submit} loading={loading} />
        <Text style={[ui.muted, { textAlign: 'center', marginTop: 16 }]}>
          {t(
            'New members are registered by the Parishath. Ask the admin to add you, then log in with your mobile number.',
            'కొత్త సభ్యులను పరిషత్ నమోదు చేస్తుంది. మిమ్మల్ని చేర్చమని నిర్వాహకులను అడగండి, తర్వాత మీ మొబైల్ నంబర్‌తో లాగిన్ అవ్వండి.'
          )}
        </Text>
      </Card>
    </Screen>
  );
}
