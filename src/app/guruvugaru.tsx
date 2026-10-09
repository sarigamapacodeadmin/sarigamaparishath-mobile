import { Image, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from '../components/ui';
import { useLanguage } from '../lib/language';
import { colors } from '../lib/theme';

// Profile of Brahmasri Nemani Subbarao Pantulu garu (Gayatri Guruvu garu), as on the
// website's profile panel (sarigamaparishath/lib/people/subbarao-pantulu.ts). Keep the two in sync.
const PROFILE = {
  en: {
    title: 'Gayatri Upasaka Brahmasri Nemani Subbarao Pantulu garu',
    role: 'Chairman, Sanatana Rishiproktha Gayatri Maha Parishath',
    paragraphs: [
      'Brahmasri Nemani Subbarao Pantulu garu, popularly known as Subbarao Master or Gayatri Guruvu garu, is a reputed and respected teacher. His father, Sri Nemani Jagannadha Rao, was a great singer who sang devotional songs melodiously in bhajans, and his mother, Smt. Sitaramam, was a devoted lady of pure satwik nature. Our master imbibed both devotion and tolerance from his parents. His wife, Smt. Venkata Lakshmi, is a true Sahadharmachaarini.',
      'A holder of a BE in Electrical Engineering from Andhra University, Visakhapatnam (1965-70), our master took to teaching as a profession after graduation, out of an inherent liking for it. As a freelance lecturer he taught Maths, Physics and Chemistry for over 45 years with such devotion and dedication that his students are spread all over the world today, working in various professions and capacities and serving society.',
      'Subbarao Master is a multifaceted personality. He is a speaker, poet, lyricist, playwright, actor, director, singer, instrumentalist, composer and a caroms champion.',
      'Sri Guruvu garu had his Veda vidya from Brahmasri Aryasomayajula Chinna Yagneswara Deekshitulu and Brahmasri Vishnubhatla Jagannadha Ghanapati. His maanasa guru, Jagadguru Sri Sri Sri Chandrasekharendra Saraswati Mahaswamy of Kanchi Peetham, and his japa guru, Jagadguru Sri Sri Sri Vidyaranya Mahaswamy of Sringeri Peetham, helped him begin Gayatri Upaasana at the behest of Gayatri Maatha herself in 1980. He deepened his meditation on the Gayatri mantra day by day and year by year, and performed penance for 40 days each at Basara (2002), Naimisharanyam (2004) and Kasi (2014), where he had divine mystic experiences and was enlightened by Vedamaatha Gayatri herself.',
      'At the advice of Gayatri Maatha herself, Guruvu garu performed the Sarvatomukha Gayatri Mahayagam for the welfare of mankind in Visakhapatnam in 2005, with the blessings of Sadguru Sri Sivananda Murthy, under the able leadership of Rajarshi PVRK Prasad (IAS Retd.) and with the cooperation of many other stalwarts.',
      'Guruvu garu also conducted Sandhyavandanam classes for many years, spreading the glory of Gayatri with missionary zeal.',
    ],
  },
  te: {
    title: 'గాయత్రీ ఉపాసక బ్రహ్మశ్రీ నేమాని సుబ్బారావు పంతులుగారు',
    role: 'ఛైర్మన్, సనాతన ఋషిప్రోక్త గాయత్రీ మహా పరిషత్',
    paragraphs: [
      'బ్రహ్మశ్రీ నేమాని సుబ్బారావు పంతులుగారు, మనందరికీ గాయత్రీ గురువుగారిగా సుపరిచితులే. వీరు శ్రీ నేమాని జగన్నాధ రావు, సీతారామం దంపతుల గర్భ శుక్తి ముక్తా ఫలంగా జన్మించి, వారి భక్తి తత్పరత యనెడి ఆనువంశికతను ఆస్తిగా స్వీకరించారు. శ్రీమతి వెంకట లక్ష్మీ గారు సహధర్మచారిణిగా, గురువు గారి ఆధ్యాత్మిక ప్రయాణంలో అడుగడుగునా సహకరిస్తున్న పుణ్యమూర్తి.',
      'విశాఖపట్టణంలో గల ఆంధ్రా యూనివర్సిటీలో BE ఎలెక్ట్రికల్ ఇంజనీరింగ్ విభాగంలో పట్టభద్రులయినా, అధ్యాపక వృత్తిపై మక్కువతో \'మాస్టారుగా\' సుమారు 45 సంవత్సరాలు గణితం, భౌతిక, రసాయనిక శాస్త్రాలను బోధించి, ప్రపంచ వ్యాప్తంగా విస్తరించిన శిష్య పరంపరతో ఇతోధికంగా సమ సమాజ నిర్మాణంలో కృతకృత్యులయ్యారు.',
      'మన మాస్టారు బహుముఖ ప్రజ్ఞాశాలి. వారి ప్రావీణ్యం వక్తగా, కవిగా, పాటల రచయితగా, దర్శకునిగా, సంగీతకారునిగా మాత్రమే కాక, క్యారమ్స్ ఆటలో కూడా పలువురకు ఆదర్శప్రాయం.',
      'బ్రహ్మశ్రీ నేమాని సుబ్బారావుగారు, ఆర్యసోమయాజుల చిన యజ్ఞేశ్వర దీక్షితులు మరియు విష్ణుభట్ల జగన్నాధ ఘనాపాఠీ గార్ల వద్ద వైదిక విద్యనభ్యసించి, మానసగురువులుగా శ్రీ శ్రీ శ్రీ చంద్రశేఖరేంద్ర సరస్వతీ మహాస్వామి వారిని, మరియు జపగురువులుగా శ్రీ శ్రీ శ్రీ విద్యారణ్య మహాస్వామి వారిని స్వీకరించి, వారి అనుగ్రహంతో గాయత్రీ మహా మంత్రజప సాధనా తత్పరులై, బాసర (2002), నైమిశారణ్యం (2004), కాశీ (2014) మరియు శ్రీశైలం (2017) వంటి పుణ్య క్షేత్రాలలో మండల దీక్షలనాచరించి, గాయత్రీ మంత్రాన్ని అమ్మ సహాయంతో అక్షర కోటి జపించి, తత్ఫలాన్ని అమ్మ అనుజ్ఞతో విశ్వకళ్యాణమునకై ధారపోసిన మహనీయుడు.',
      'అమ్మ అనుగ్రహంతో, సద్గురు శ్రీ శివానంద మూర్తి గారి ఆశీర్వాదంతో, రాజర్షి శ్రీ PVRK ప్రసాద్ (IAS) వారి సహకారంతో 2005 సంవత్సరంలో సర్వతోముఖ గాయత్రీ మహా యజ్ఞాన్ని లోకకళ్యాణార్థం గావించి, విశాఖపట్టణం HB కాలనీ యందున్న వేదమాత గాయత్రీ ఆలయంలో తమ యావత్ తపశ్శక్తిని ధారపోసి, సనాతన ధర్మ మార్గంలో పయనిస్తూ ఎందరో శిష్యులకు సంధ్యావందనాది నిత్య విధులను నేర్పించి, వారిచే ఆచరింపజేస్తున్న ఆధ్యాత్మిక గురువు శ్రీ సుబ్బారావు పంతులు గారు.',
    ],
  },
};

export default function GuruvugaruScreen() {
  const { language } = useLanguage();
  const texts = PROFILE[language];

  return (
    <Screen>
      <Card style={{ padding: 20 }}>
        <View style={styles.head}>
          <Image
            source={require('../../assets/people/nemani-subbarao-pantulu.jpg')}
            style={styles.photo}
            accessibilityLabel={texts.title}
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.title}>{texts.title}</Text>
          <Text style={styles.role}>{texts.role}</Text>
        </View>
        {texts.paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>
            {p}
          </Text>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', paddingBottom: 18, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.gold200 },
  // The photo is 254 x 198
  photo: { width: 176, height: 137, borderRadius: 6, borderWidth: 2, borderColor: colors.gold500, marginBottom: 14 },
  title: { fontSize: 22, color: colors.brand600, fontWeight: '600', textAlign: 'center', lineHeight: 30 },
  role: { color: colors.vermilion600, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  paragraph: { color: '#1f2937', fontSize: 16, lineHeight: 25, marginBottom: 14 },
});
