import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from '../components/ui';
import { useLanguage } from '../lib/language';
import { colors } from '../lib/theme';
import { ACTIVITY_CATEGORIES } from '../shared/activity-labels';

// The website's /about page (sarigamaparishath/app/about/page.tsx): four summary
// cards that each open a details panel, and a call to become a member.

type CardKey = 'vision' | 'aims' | 'team' | 'values';

interface Member {
  name: string;
  role: string;
  profile?: Href; // screen that shows this member's profile
}

// The chairman's profile (the website opens it as a panel via #subbarao-pantulu)
const SUBBARAO_PROFILE: Href = '/guruvugaru';

const content = {
  en: {
    title: 'About Parishath',
    subtitle: 'The vision, aims, people and core values of the Parishath',
    readMore: 'Read more',
    close: 'Close',
    vision: 'Vision',
    visionText:
      'To create a global community of spiritual seekers united in the pursuit of Vedic wisdom, cow protection, and the advancement of human consciousness through authentic spiritual practices.',
    aims: 'Aims',
    aimsLead:
      'To arrange for Vedic study, the propagation of the Vedas by Veda Pandits, and the preservation of the Vedas in every corner of Bharat, and thereby work to protect Sanatana Dharma.',
    aimsPoints: [
      "Awaken Bharat's Vedic, scientific and dharmic culture by sharing spiritual knowledge with everyone, regularly, through social media, books and magazines.",
      'As the walking God, Paramacharya, wished and directed, support the development of Veda Pathashalas to protect the Vedas.',
      'Support goshalas and the growth of cow lineages, a mainstay in protecting Sanatana Dharma.',
      'Honour Veda Pandits, who pray for the prosperity of all people and the welfare of the world, by holding Veda Sabhas.',
      'Encourage Vedic education by giving financial help to poor Veda students.',
      'Work to relieve the mental and financial hardship caused by natural disasters, on our own or together with organisations doing such work.',
      'Work for the welfare of women, children and elderly people in society who are struck by misfortune, orphaned or destitute.',
      'Hold many kinds of programmes to bring the path of Bhakti and the teaching of Gnana to everyone.',
      "Work, by deliberate effort or as opportunities arise, to achieve the Parishath's aims and ideals.",
    ],
    aimsCount: (n: number) => `${n} aims in all`,
    team: 'Executive Members',
    teamMore: (n: number) => `and ${n} more members`,
    teamMembers: [
      { name: 'Sri Nemani Subbarao Pantulu garu', role: 'Chairman', profile: SUBBARAO_PROFILE },
      { name: 'Smt. Nemani Venkata Lakshmi', role: 'President' },
      { name: 'Sri Nemani Siva Shankara Prasad', role: 'Vice President' },
      { name: 'Sri Kalyan Panguluri', role: 'Secretary' },
      { name: 'Sri Bommakanti Venkata Dileep', role: 'Joint Secretary' },
      { name: 'Sri Kolluru Gayatri Vara Prasad', role: 'Treasurer' },
      { name: 'Sri Chintalapati Venkata Murali Krishna', role: 'Executive Member' },
      { name: 'Sri Gunnala Rajasekhar', role: 'Executive Member' },
      { name: 'Sri Thoom Pavan Kalyan', role: 'Executive Member' },
      { name: 'Smt. Kolluru Aparna', role: 'Executive Member' },
    ] as Member[],
    values: 'Core Values',
    valuesLead: 'The four petals of the Parishath logo. Together they protect Sanatana Dharma.',
    valuesList: [
      { key: 'veda', desc: 'Vedic study, support for Veda Pathashalas and poor Veda students, and honouring Veda Pandits through Veda Sabhas.' },
      { key: 'gau', desc: 'Support for goshalas and the growth of cow lineages, a mainstay of Sanatana Dharma.' },
      { key: 'gnana', desc: 'Sharing Vedic, scientific and dharmic knowledge with everyone through social media, books and magazines.' },
      { key: 'bhakti', desc: 'Programmes that bring the path of Bhakti to everyone.' },
    ],
    ctaTitle: 'Become a Member',
    ctaText: 'Be part of the Parishath and its work to preserve Vedic wisdom.',
    ctaButton: 'Join the Parishath',
  },
  te: {
    title: 'పరిషత్ పరిచయం',
    subtitle: 'పరిషత్ దార్శనికత, లక్ష్యాలు, కార్యవర్గం మరియు ప్రధాన విలువలు',
    readMore: 'మరింత చదవండి',
    close: 'మూసివేయండి',
    vision: 'దార్శనికత',
    visionText:
      'వేద జ్ఞానం, గో సంరక్షణ, మరియు ప్రామాణిక ఆధ్యాత్మిక సాధనల ద్వారా మానవ చైతన్య వికాసం కోసం ఐక్యమైన ప్రపంచవ్యాప్త ఆధ్యాత్మిక సాధకుల సమాజాన్ని నిర్మించడం.',
    aims: 'లక్ష్యాలు',
    aimsLead:
      'భారతావనిలో నలుమూలలా వేదాధ్యయనం, వేదపండితులచే వేద ప్రచారము మరియు, వేద పరిరక్షణ చేయుటకు తగు ఏర్పాటు చేస్తూ, తద్వారా సనాతన ధర్మ పరిరక్షణ కై కృషి చేయడం.',
    aimsPoints: [
      'బహుళ సామాజిక మాధ్యమాల ద్వారా, ఎప్పటికప్పుడు ఆధ్యాత్మిక సమాచారమును పుస్తక మరియు పత్రికల రూపేణా అందరికీ అందిస్తూ, వైదిక, వైజ్ఞానిక, ధార్మికమైన భారతీయ సంస్కృతిని జాగృతం చేయడం.',
      'నడిచేదైవమయిన పరమాచార్యవర్యుల ఆశయ, ఆదేశానుసారం, వేదం పరిరక్షణ కై, వేద పాఠశాలల అభివృద్ధికి తగు సహాయమందించడం.',
      'సనాతన ధర్మ పరిరక్షణ లో పట్టుకొమ్మ అయిన గోశాలల మరియు గో సంతతి అభివృద్ధికి సహాయమందించడం.',
      'సర్వ మానవ సౌభాగ్యము, విశ్వ కళ్యాణము ఆశించు వేద పండితులను, వేద సభల నిర్వహణ ద్వారా సత్కరించటం.',
      'పేద వేద విద్యార్థులకు ఆర్థిక సహాయమందిస్తూ, తద్వారా వేదవిద్యను ప్రోత్సహించడం.',
      'ప్రాకృతిక వైపరీత్యముల ద్వారా సంభవించే మానసిక ఆర్ధిక సంక్షోభాల నివారణ కై, స్వయంగా గానీ అట్టి విశేష కార్యాచరణములకై ప్రయత్నించు సంస్థల తో జతకూడి గానీ విశేష కృషి సల్పడం.',
      'సమాజంలో దైవోపహతులైన లేదా అనాధులైన లేదా దీను లైన స్త్రీ-బాల-వృద్ధుల సంక్షేమమునకై కృషి చేయడం.',
      'భక్తి ప్రచార మార్గం, జ్ఞాన ప్రబోధనం, అందరికీ అందించడంకోసం, బహు విధములైన కార్యక్రమములను నిర్వహించడం.',
      'పరిషత్ లక్ష్యములు మరియు ఆశయముల సాధనకై ప్రయత్నపూర్వకముగా, లేదా యాదృచ్చికంగా కృషి చేయడం.',
    ],
    aimsCount: (n: number) => `మొత్తం ${n} లక్ష్యాలు`,
    team: 'కార్యవర్గం',
    teamMore: (n: number) => `మరియు మరో ${n} మంది సభ్యులు`,
    teamMembers: [
      { name: 'శ్రీ నేమాని సుబ్బారావు పంతులు గారు', role: 'ఛైర్మన్', profile: SUBBARAO_PROFILE },
      { name: 'శ్రీమతి నేమాని వెంకట లక్ష్మి', role: 'అధ్యక్షురాలు' },
      { name: 'శ్రీ నేమాని శివ శంకర ప్రసాద్', role: 'ఉపాధ్యక్షులు' },
      { name: 'శ్రీ కళ్యాణ్ పంగులూరి', role: 'కార్యదర్శి' },
      { name: 'శ్రీ బొమ్మకంటి వెంకట దిలీప్', role: 'సంయుక్త కార్యదర్శి' },
      { name: 'శ్రీ కొల్లూరు గాయత్రీ వరప్రసాద్', role: 'కోశాధికారి' },
      { name: 'శ్రీ చింతలపాటి వెంకట మురళీ కృష్ణ', role: 'కార్యవర్గ సభ్యులు' },
      { name: 'శ్రీ గున్నాల రాజశేఖర్', role: 'కార్యవర్గ సభ్యులు' },
      { name: 'శ్రీ తూం పవన్ కళ్యాణ్', role: 'కార్యవర్గ సభ్యులు' },
      { name: 'శ్రీమతి కొల్లూరు అపర్ణ', role: 'కార్యవర్గ సభ్యురాలు' },
    ] as Member[],
    values: 'ప్రధాన విలువలు',
    valuesLead: 'పరిషత్ చిహ్నంలోని నాలుగు దళాలు. ఇవి కలిసి సనాతన ధర్మాన్ని పరిరక్షిస్తాయి.',
    valuesList: [
      { key: 'veda', desc: 'వేదాధ్యయనం, వేద పాఠశాలలకు మరియు పేద వేద విద్యార్థులకు సహాయం, వేద సభల ద్వారా వేద పండితుల సత్కారం.' },
      { key: 'gau', desc: 'సనాతన ధర్మానికి పట్టుకొమ్మ అయిన గోశాలలకు మరియు గో సంతతి అభివృద్ధికి సహాయం.' },
      { key: 'gnana', desc: 'సామాజిక మాధ్యమాలు, పుస్తకాలు, పత్రికల ద్వారా వైదిక, వైజ్ఞానిక, ధార్మిక జ్ఞానాన్ని అందరికీ అందించడం.' },
      { key: 'bhakti', desc: 'భక్తి మార్గాన్ని అందరికీ చేర్చే కార్యక్రమాల నిర్వహణ.' },
    ],
    ctaTitle: 'పరిషత్ సభ్యత్వం స్వీకరించండి',
    ctaText: 'వేద జ్ఞాన సంరక్షణకు అంకితమైన పరిషత్‌లో భాగస్వాములు కండి.',
    ctaButton: 'సభ్యత్వం కావాలి',
  },
};

// The first six are office bearers; the summary card lists them
const OFFICE_BEARERS = 6;

export default function AboutScreen() {
  const { language } = useLanguage();
  const texts = content[language];
  const [open, setOpen] = useState<CardKey | null>(null);

  const valueName = (key: string) => ACTIVITY_CATEGORIES[key]?.[language] || key;
  const valueColor = (key: string) => ACTIVITY_CATEGORIES[key]?.color || colors.gold500;

  // Close the details panel first, then open the member's profile screen
  const openProfile = (href: Href) => {
    setOpen(null);
    router.push(href);
  };

  const cards: { key: CardKey; title: string; summary: ReactNode }[] = [
    {
      key: 'vision',
      title: texts.vision,
      summary: (
        <Text style={styles.body} numberOfLines={5}>
          {texts.visionText}
        </Text>
      ),
    },
    {
      key: 'aims',
      title: texts.aims,
      summary: (
        <>
          <Text style={styles.body} numberOfLines={4}>
            {texts.aimsLead}
          </Text>
          <Text style={styles.count}>{texts.aimsCount(texts.aimsPoints.length + 1)}</Text>
        </>
      ),
    },
    {
      key: 'team',
      title: texts.team,
      summary: (
        <>
          {texts.teamMembers.slice(0, 3).map((m) => (
            <View key={m.name} style={{ marginBottom: 6 }}>
              {m.profile ? (
                <Text style={styles.link} onPress={() => openProfile(m.profile!)} accessibilityRole="link">
                  {m.name}
                </Text>
              ) : (
                <Text style={styles.memberName}>{m.name}</Text>
              )}
              <Text style={styles.memberRole}>{m.role}</Text>
            </View>
          ))}
          <Text style={styles.count}>{texts.teamMore(texts.teamMembers.length - 3)}</Text>
        </>
      ),
    },
    {
      key: 'values',
      title: texts.values,
      summary: (
        <>
          {texts.valuesList.map((v) => (
            <View key={v.key} style={styles.valueRow}>
              <View style={[styles.dot, { backgroundColor: valueColor(v.key) }]} />
              <Text style={styles.valueName}>{valueName(v.key)}</Text>
            </View>
          ))}
        </>
      ),
    },
  ];

  const openCard = cards.find((c) => c.key === open);

  return (
    <>
      <Screen>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{texts.title}</Text>
          <View style={styles.heroRule} />
          <Text style={styles.heroSubtitle}>{texts.subtitle}</Text>
        </View>

        {cards.map((card) => (
          <Card key={card.key} style={{ padding: 20 }}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <View style={styles.cardRule} />
            {card.summary}
            <Pressable onPress={() => setOpen(card.key)} accessibilityRole="button" style={styles.readMore} hitSlop={8}>
              <Text style={styles.readMoreText}>{texts.readMore} →</Text>
            </Pressable>
          </Card>
        ))}

        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>{texts.ctaTitle}</Text>
          <Text style={styles.ctaText}>{texts.ctaText}</Text>
          <Pressable
            onPress={() => router.push('/register')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ctaButtonText}>{texts.ctaButton}</Text>
          </Pressable>
        </View>
      </Screen>

      {/* Details panel */}
      <Modal visible={!!openCard} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(null)}>
          {openCard && (
            <Pressable style={styles.panel} onPress={() => {}} accessibilityViewIsModal>
              <View style={styles.panelHead}>
                <Text style={styles.panelTitle} accessibilityRole="header">
                  {openCard.title}
                </Text>
                <Pressable onPress={() => setOpen(null)} accessibilityRole="button" accessibilityLabel={texts.close} hitSlop={10} style={{ padding: 4 }}>
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                {open === 'vision' && <Text style={styles.lead}>{texts.visionText}</Text>}

                {open === 'aims' && (
                  <>
                    <Text style={[styles.lead, { marginBottom: 18 }]}>{texts.aimsLead}</Text>
                    {texts.aimsPoints.map((point, i) => (
                      <View key={i} style={styles.aimRow}>
                        <Text style={styles.aimMark}>✦</Text>
                        <Text style={[styles.body, { flex: 1 }]}>{point}</Text>
                      </View>
                    ))}
                  </>
                )}

                {open === 'team' &&
                  texts.teamMembers.map((m, i) => (
                    <View key={m.name} style={[styles.memberBox, i < OFFICE_BEARERS && styles.memberBoxBearer]}>
                      {m.profile ? (
                        <Text style={[styles.memberBoxName, styles.underline]} onPress={() => openProfile(m.profile!)} accessibilityRole="link">
                          {m.name}
                        </Text>
                      ) : (
                        <Text style={styles.memberBoxName}>{m.name}</Text>
                      )}
                      <Text style={styles.memberBoxRole}>{m.role}</Text>
                    </View>
                  ))}

                {open === 'values' && (
                  <>
                    <Text style={[styles.body, { marginBottom: 18 }]}>{texts.valuesLead}</Text>
                    {texts.valuesList.map((v) => (
                      <View key={v.key} style={styles.valueBox}>
                        <View style={[styles.dot, styles.dotLarge, { backgroundColor: valueColor(v.key) }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.valueBoxName}>{valueName(v.key)}</Text>
                          <Text style={styles.body}>{v.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

// Gold shades from the website theme that are not in lib/theme.ts
const gold50 = '#fbf7ec';
const gold300 = '#ddbe74';

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.brand600,
    borderBottomWidth: 4,
    borderBottomColor: colors.gold500,
    borderRadius: 6,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  heroTitle: { color: colors.white, fontSize: 28, fontWeight: '600', textAlign: 'center' },
  heroRule: { width: 96, height: 2, backgroundColor: colors.gold500, marginVertical: 12 },
  heroSubtitle: { color: colors.brand100, fontSize: 16, textAlign: 'center', lineHeight: 23 },
  cardTitle: { fontSize: 22, color: colors.brand600, fontWeight: '600', marginBottom: 10 },
  cardRule: { width: 48, height: 2, backgroundColor: colors.gold500, marginBottom: 14 },
  body: { color: '#374151', fontSize: 15, lineHeight: 23 },
  lead: { color: colors.text, fontSize: 17, lineHeight: 26 },
  count: { color: '#86692f', fontSize: 14, marginTop: 10 },
  link: { color: colors.brand600, fontSize: 14, textDecorationLine: 'underline', textDecorationColor: colors.gold500 },
  underline: { textDecorationLine: 'underline', textDecorationColor: colors.gold500 },
  memberName: { color: '#111827', fontSize: 14 },
  memberRole: { color: colors.vermilion600, fontSize: 14 },
  valueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  valueName: { color: '#1f2937', fontSize: 15 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: '#d1d5db' },
  dotLarge: { width: 16, height: 16, borderRadius: 8, marginTop: 5, marginRight: 14 },
  readMore: { alignSelf: 'flex-start', marginTop: 18 },
  readMoreText: { color: colors.brand600, fontWeight: '600', fontSize: 15 },
  cta: {
    backgroundColor: colors.brand600,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: colors.gold500,
    borderRadius: 6,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaTitle: { color: colors.white, fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  ctaText: { color: colors.brand100, fontSize: 16, textAlign: 'center', lineHeight: 23, marginBottom: 18 },
  ctaButton: { backgroundColor: colors.gold500, borderRadius: 6, paddingVertical: 13, paddingHorizontal: 28 },
  ctaButtonText: { color: '#0f1530', fontWeight: '600', fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,21,48,0.7)', justifyContent: 'center', padding: 16 },
  panel: { backgroundColor: colors.white, borderRadius: 6, borderTopWidth: 4, borderTopColor: colors.gold500, maxHeight: '85%' },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    padding: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold200,
  },
  panelTitle: { flex: 1, fontSize: 24, color: colors.brand600, fontWeight: '600' },
  closeText: { fontSize: 22, color: colors.subtle },
  aimRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  aimMark: { color: colors.gold500, marginTop: 2 },
  memberBox: { borderWidth: 1, borderColor: colors.gold200, backgroundColor: colors.white, borderRadius: 6, padding: 14, marginBottom: 10 },
  memberBoxBearer: { borderColor: gold300, backgroundColor: gold50 },
  memberBoxName: { fontSize: 17, color: colors.brand600, fontWeight: '500' },
  memberBoxRole: { fontSize: 14, color: colors.vermilion600, fontWeight: '600', marginTop: 2 },
  valueBox: { flexDirection: 'row', borderWidth: 1, borderColor: colors.gold200, borderRadius: 6, padding: 14, marginBottom: 14 },
  valueBoxName: { fontSize: 19, color: colors.brand600, fontWeight: '500', marginBottom: 2 },
});
