import { router, type Href } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { API_URL } from '../../lib/config';
import { useLanguage } from '../../lib/language';
import { colors } from '../../lib/theme';

function Row({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Card>
    </Pressable>
  );
}

// Everything that doesn't have its own tab
export default function MoreScreen() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const go = (href: Href) => () => router.push(href);

  return (
    <Screen>
      {session ? (
        <Row icon="👤" title={t('My Profile', 'నా ప్రొఫైల్')} subtitle={t('Your details and donations', 'మీ వివరాలు మరియు విరాళాలు')} onPress={go('/profile')} />
      ) : (
        <>
          <Row icon="🔑" title={t('Member Login', 'సభ్యుల లాగిన్')} subtitle={t('Email or mobile number', 'ఈమెయిల్ లేదా మొబైల్ నంబర్')} onPress={go('/login')} />
          <Row icon="✍️" title={t('Register', 'నమోదు')} subtitle={t('Become a member', 'సభ్యులుగా చేరండి')} onPress={go('/register')} />
        </>
      )}
      <Row icon="🖼️" title={t('Gallery', 'గ్యాలరీ')} subtitle={t('Photos from Parishath events', 'పరిషత్ కార్యక్రమాల ఫోటోలు')} onPress={go('/gallery')} />
      <Row icon="📝" title={t('Blog', 'బ్లాగ్')} subtitle={t('Articles and teachings', 'వ్యాసాలు మరియు బోధనలు')} onPress={go('/blog')} />
      <Row icon="🙏" title={t('About Guruvu garu', 'గురువు గారి గురించి')} subtitle={t('Sri Nemani Subbarao Pantulu garu', 'శ్రీ నేమాని సుబ్బారావు పంతులు గారు')} onPress={go('/guruvugaru')} />
      <Row icon="🪷" title={t('About Parishath', 'పరిషత్ పరిచయం')} subtitle={t('Vision, aims, team and core values', 'దార్శనికత, లక్ష్యాలు, కార్యవర్గం, విలువలు')} onPress={go('/about')} />
      <Row icon="📚" title={t('Books', 'పుస్తకాలు')} subtitle={t('Parishath publications', 'పరిషత్ ప్రచురణలు')} onPress={go('/books')} />
      <Row icon="💬" title={t('Testimonials', 'అనుభవాలు')} subtitle={t('Experiences of members', 'సభ్యుల అనుభవాలు')} onPress={go('/testimonials')} />
      <Row icon="❓" title={t('FAQ', 'ప్రశ్నోత్తర మాలిక')} subtitle={t('Frequently asked questions', 'తరచుగా అడిగే ప్రశ్నలు')} onPress={go('/faq')} />
      <Row icon="📞" title={t('Contact', 'సంప్రదించండి')} subtitle={t('Phone and message form', 'ఫోన్ మరియు సందేశ ఫారం')} onPress={go('/contact')} />
      <Row icon="✉️" title={t('Newsletter', 'వార్తాలేఖ')} subtitle={t('Updates by email', 'ఈమెయిల్ ద్వారా సమాచారం')} onPress={go('/newsletter')} />
      <Row
        icon="🌐"
        title={t('Website', 'వెబ్‌సైట్')}
        subtitle={t('sarigamaparishath.vercel.app', 'sarigamaparishath.vercel.app')}
        onPress={() => Linking.openURL(API_URL)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderLeftWidth: 4, borderLeftColor: colors.gold500 },
  icon: { fontSize: 28, marginRight: 14 },
  title: { fontSize: 17, color: colors.brand600, fontWeight: '600' },
  subtitle: { color: colors.subtle, marginTop: 2 },
  chevron: { fontSize: 28, color: colors.gold500, marginLeft: 8 },
});
