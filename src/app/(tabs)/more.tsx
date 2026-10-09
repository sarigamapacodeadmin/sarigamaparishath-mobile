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
        <Row icon="🔑" title={t('Member Login', 'సభ్యుల లాగిన్')} subtitle={t('Email or mobile number', 'ఈమెయిల్ లేదా మొబైల్ నంబర్')} onPress={go('/login')} />
      )}
      <Row icon="🖼️" title={t('Gallery', 'గ్యాలరీ')} subtitle={t('Photos from Parishath events', 'పరిషత్ కార్యక్రమాల ఫోటోలు')} onPress={go('/gallery')} />
      <Row icon="📝" title={t('Blog', 'బ్లాగ్')} subtitle={t('Articles and teachings', 'వ్యాసాలు మరియు బోధనలు')} onPress={go('/blog')} />
      <Row
        icon="🌐"
        title={t('Website', 'వెబ్‌సైట్')}
        subtitle={t('Books, FAQ, contact and more', 'పుస్తకాలు, ప్రశ్నలు, సంప్రదింపు మరియు మరిన్ని')}
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
