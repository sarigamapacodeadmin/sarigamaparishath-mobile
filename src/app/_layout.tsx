import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageToggle } from '../components/ui';
import { AuthProvider } from '../lib/auth';
import { LanguageProvider, useLanguage } from '../lib/language';
import { colors } from '../lib/theme';

function RootStack() {
  const { t } = useLanguage();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand600 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        headerRight: () => <LanguageToggle />,
        contentStyle: { backgroundColor: colors.ivory },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="activity/[id]" options={{ title: t('Activity', 'కార్యక్రమం') }} />
      <Stack.Screen name="login" options={{ title: t('Member Login', 'సభ్యుల లాగిన్') }} />
      <Stack.Screen name="first-login" options={{ title: t('Set up your login', 'మీ లాగిన్ ఏర్పాటు'), headerBackVisible: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootStack />
      </AuthProvider>
    </LanguageProvider>
  );
}
