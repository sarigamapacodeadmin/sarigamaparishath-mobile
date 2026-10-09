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
      <Stack.Screen name="event/[id]" options={{ title: t('Event', 'కార్యక్రమం') }} />
      <Stack.Screen name="gallery" options={{ title: t('Gallery', 'గ్యాలరీ') }} />
      <Stack.Screen name="blog/index" options={{ title: t('Blog', 'బ్లాగ్') }} />
      <Stack.Screen name="blog/[slug]" options={{ title: t('Article', 'వ్యాసం') }} />
      <Stack.Screen name="about" options={{ title: t('About Parishath', 'పరిషత్ పరిచయం') }} />
      <Stack.Screen name="guruvugaru" options={{ title: t('About Guruvu garu', 'గురువు గారి గురించి') }} />
      <Stack.Screen name="books/index" options={{ title: t('Books', 'పుస్తకాలు') }} />
      <Stack.Screen name="books/[id]" options={{ title: t('Book', 'పుస్తకం') }} />
      <Stack.Screen name="testimonials" options={{ title: t('Testimonials', 'అనుభవాలు') }} />
      <Stack.Screen name="faq" options={{ title: t('FAQ', 'ప్రశ్నోత్తర మాలిక') }} />
      <Stack.Screen name="contact" options={{ title: t('Contact', 'సంప్రదించండి') }} />
      <Stack.Screen name="newsletter" options={{ title: t('Newsletter', 'వార్తాలేఖ') }} />
      <Stack.Screen name="profile" options={{ title: t('My Profile', 'నా ప్రొఫైల్') }} />
      <Stack.Screen name="login" options={{ title: t('Member Login', 'సభ్యుల లాగిన్') }} />
      <Stack.Screen name="register" options={{ title: t('Register', 'నమోదు') }} />
      <Stack.Screen name="forgot-password" options={{ title: t('Forgot password', 'పాస్‌వర్డ్ మర్చిపోయారా') }} />
      <Stack.Screen name="change-password" options={{ title: t('Change password', 'పాస్‌వర్డ్ మార్చండి') }} />
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
