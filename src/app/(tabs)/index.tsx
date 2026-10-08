import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Screen, Title, styles as ui } from '../../components/ui';
import { fetchActivities } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useLanguage } from '../../lib/language';
import { colors } from '../../lib/theme';
import type { Activity } from '../../shared/types';

// The four core values, as on the website's home page (app/components/home/core-values.tsx)
const CORE_VALUES = [
  {
    key: 'veda',
    color: '#f5d4c1',
    en: 'Veda Parirakshana',
    te: 'వేద పరిరక్షణ',
    textEn: 'Encouraging those who learn the Vedas exactly as the Rishis gave them, spreading the Vedas through Veda Parayana, and taking steps so they reach future generations.',
    textTe: 'ఋషులు అందించిన వేదాలను యథాతథంగా నేర్చుకునే వారిని ప్రోత్సహించడం, వేద పారాయణ ద్వారా వేద ప్రచారం, తరువాతి తరాలకు అందగలిగేలా తగు చర్యలు తీసుకోవడం.',
  },
  {
    key: 'gou',
    color: '#e87c72',
    en: 'Gou Samrakshana',
    te: 'గో సంరక్షణ',
    textEn: 'Caring for and protecting Gomata at Srigovardhani Go Shala.',
    textTe: 'శ్రీగోవర్ధని గో శాలలో గోమాతను పోషించడం, రక్షించడం.',
  },
  {
    key: 'gnana',
    color: '#e9d42d',
    en: 'Gnana Samuparjana',
    te: 'జ్ఞాన సముపార్జన',
    textEn: 'Gaining true knowledge through study, satsang and self-enquiry.',
    textTe: 'అధ్యయనం, సత్సంగం, ఆత్మవిచారం ద్వారా నిజమైన జ్ఞానాన్ని పొందడం.',
  },
  {
    key: 'bhakthi',
    color: '#4e579c',
    en: 'Bhakthi Samuparjana',
    te: 'భక్తి సముపార్జన',
    textEn: 'Growing devotion through prayer, japa, bhajans and seva.',
    textTe: 'ప్రార్థన, జపం, భజనలు, సేవ ద్వారా భక్తిని పెంపొందించుకోవడం.',
  },
];

export default function HomeScreen() {
  const { t, language } = useLanguage();
  const { session } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivities()
      .then((data) => setActivities(data.slice(0, 4)))
      .catch(() => setActivities([]));
  }, []);

  return (
    <Screen>
      <View style={styles.hero}>
        <Image source={require('../../../assets/parishath-logo.jpg')} style={styles.logo} accessibilityIgnoresInvertColors />
        <Text style={styles.name}>{t('Sanatana Rishiproktha Gayatri Maha Parishath', 'సనాతన ఋషిప్రోక్త గాయత్రీ మహా పరిషత్')}</Text>
        <Text style={styles.ornament}>— ✦ —</Text>
        <Text style={styles.tagline}>
          {t(
            'Preserving Vedic Wisdom • Protecting Cows • Spreading Spiritual Knowledge',
            'వేద జ్ఞాన సంరక్షణ • గో సంరక్షణ • ఆధ్యాత్మిక జ్ఞాన ప్రచారం'
          )}
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          {session ? (
            <Button label={t('My Profile', 'నా ప్రొఫైల్')} onPress={() => router.push('/profile')} />
          ) : (
            <Button label={t('Member Login', 'సభ్యుల లాగిన్')} onPress={() => router.push('/login')} />
          )}
          <Button variant="secondary" label={t('Donate', 'విరాళం ఇవ్వండి')} onPress={() => router.push('/donate')} />
        </View>
      </View>

      <Title>{t('Our Core Values', 'మా మూల సూత్రాలు')}</Title>
      {CORE_VALUES.map((value) => (
        <Card key={value.key} style={{ borderTopColor: value.color }}>
          <Text style={styles.cardTitle}>{language === 'en' ? value.en : value.te}</Text>
          <Text style={ui.muted}>{language === 'en' ? value.textEn : value.textTe}</Text>
        </Card>
      ))}

      {activities.length > 0 && (
        <>
          <Title>{t('Our Activities', 'పరిషత్ కార్యకలాపాలు')}</Title>
          {activities.map((a) => (
            <Pressable key={a.id} onPress={() => router.push(`/activity/${a.id}`)} accessibilityRole="button">
              <Card>
                <Text style={{ fontSize: 34 }}>{a.icon}</Text>
                <Text style={styles.cardTitle}>{language === 'en' ? a.title_en : a.title_te}</Text>
                <Text style={ui.muted} numberOfLines={3}>
                  {language === 'en' ? a.description_en : a.description_te}
                </Text>
                <Text style={styles.more}>{t('Learn More →', 'మరింత తెలుసుకోండి →')}</Text>
              </Card>
            </Pressable>
          ))}
          <Button variant="secondary" label={t('All activities', 'అన్ని కార్యకలాపాలు')} onPress={() => router.push('/activities')} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 12, marginBottom: 18 },
  logo: { width: 150, height: 155, borderRadius: 75, marginBottom: 14 },
  name: { fontSize: 22, fontWeight: '600', color: colors.brand600, textAlign: 'center' },
  ornament: { color: colors.gold500, marginVertical: 10, fontSize: 16 },
  tagline: { fontSize: 16, color: '#374151', textAlign: 'center', lineHeight: 24, marginBottom: 14 },
  cardTitle: { fontSize: 19, color: colors.brand600, fontWeight: '600', marginBottom: 6 },
  more: { color: colors.brand600, fontWeight: '600', marginTop: 10 },
});
