// Personal panchangam for a member: the panchangam for their city, the hora
// running now, their birth star and how today suits it (tara balam and chandra
// balam), the next good window, slokams, and the festivals ahead.
// Copy of the website's lib/personal-panchangam.ts; keep the two in sync.

import {
  HYDERABAD,
  NAKSHATRA_NAMES,
  RASHI_NAMES,
  computePanchangam,
  masaAt,
  moonPositionAt,
  panchangamAt,
  type Hora,
  type Observance,
  type Panchangam,
  type PanchangamLocation,
} from './panchangam';
import { findPlace } from './places';
import type { KshouraPanchangam, KshouraProfile } from './kshoura';

type Lang = 'en' | 'te';
interface Name {
  en: string;
  te: string;
}
const n = (en: string, te: string): Name => ({ en, te });

const DAY_MS = 86400000;

// The member fields this uses (as returned by /api/member/me)
export interface BirthDetails {
  birth_date?: string | null; // YYYY-MM-DD
  birth_time?: string | null; // HH:MM[:SS], India time
  birth_place?: string | null;
  birth_latitude?: number | null;
  birth_longitude?: number | null;
  city?: string | null;
  city_latitude?: number | null;
  city_longitude?: number | null;
  life_stage?: string | null;
  // Worked out by the server from the birth details (see birthChart); missing
  // when an older server or no connection didn't send them
  janma_nakshatra?: number | null;
  janma_masa?: number | null;
}

// ---------------------------------------------------------------------------
// Place and birth star
// ---------------------------------------------------------------------------

export function hasBirthDetails(m: BirthDetails | null | undefined): boolean {
  return !!m?.birth_date && !!m.birth_time && (m.birth_latitude != null || !!findPlace(m.birth_place));
}

// Where to work out the member's panchangam: their city, else their birth place, else Hyderabad
export function memberLocation(m: BirthDetails | null | undefined): PanchangamLocation {
  for (const [text, lat, lon] of [
    [m?.city, m?.city_latitude, m?.city_longitude],
    [m?.birth_place, m?.birth_latitude, m?.birth_longitude],
  ] as const) {
    const place = findPlace(text);
    if (place?.en === 'Hyderabad') return HYDERABAD;
    if (place) {
      return { latitude: place.latitude, longitude: place.longitude, name: n(`${place.en}, ${place.state.en}`, `${place.te}, ${place.state.te}`) };
    }
    if (text && lat != null && lon != null) return { latitude: lat, longitude: lon, name: n(text, text) };
  }
  return HYDERABAD;
}

export interface BirthStar {
  nakshatra: number; // 0 = Ashvini
  pada: number; // 1-4
  rashi: number; // 0 = Mesha
  nakshatraName: Name;
  rashiName: Name;
}

// The Moon's nakshatra at the moment of birth (birth time is India time)
export function birthStar(m: BirthDetails): BirthStar | null {
  if (!m.birth_date || !m.birth_time) return null;
  const moment = new Date(`${m.birth_date}T${m.birth_time.slice(0, 5)}:00+05:30`);
  if (Number.isNaN(moment.getTime())) return null;
  const pos = moonPositionAt(moment);
  return { ...pos, nakshatraName: NAKSHATRA_NAMES[pos.nakshatra], rashiName: RASHI_NAMES[pos.rashi] };
}

// The birth chart values the haircut card needs, counted from 1: the Moon's
// nakshatra at birth (Ashvini 1) and the amanta lunar month at birth (Chaitra 1).
// Without a birth time, a value is known only if it was the same all day; null
// means not known. The website's /api/member/me sends these with the profile.
export interface BirthChart {
  janma_nakshatra: number | null;
  janma_masa: number | null;
}

export function birthChart(m: BirthDetails | null | undefined): BirthChart {
  const none = { janma_nakshatra: null, janma_masa: null };
  if (!m?.birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(m.birth_date)) return none;
  const at = (hhmm: string) => new Date(`${m.birth_date}T${hhmm}:00+05:30`);
  if (m.birth_time) {
    const moment = at(m.birth_time.slice(0, 5));
    if (Number.isNaN(moment.getTime())) return none;
    return { janma_nakshatra: moonPositionAt(moment).nakshatra + 1, janma_masa: masaAt(moment).masa };
  }
  const start = at('00:00');
  if (Number.isNaN(start.getTime())) return none;
  const end = new Date(start.getTime() + DAY_MS - 60000);
  const [s1, s2] = [moonPositionAt(start).nakshatra, moonPositionAt(end).nakshatra];
  const [m1, m2] = [masaAt(start).masa, masaAt(end).masa];
  return { janma_nakshatra: s1 === s2 ? s1 + 1 : null, janma_masa: m1 === m2 ? m1 : null };
}

// The inputs of the haircut card (lib/kshoura.ts) for this moment at a place
export function kshouraPanchangam(now: Date, place: PanchangamLocation): KshouraPanchangam {
  const day = computePanchangam(now, place);
  const m = panchangamAt(now);
  return {
    weekday: day.weekdayIndex,
    tithi: m.tithi,
    nakshatra: m.nakshatra,
    yoga: m.yoga,
    karana: m.karana,
    masa: m.masa,
    adhika: m.adhika,
    sankranti: day.sankranti,
    sunrise: day.sunrise,
    sunset: day.sunset,
    nextSunrise: day.nextSunrise,
  };
}

export function kshouraProfile(m: BirthDetails): KshouraProfile {
  return {
    lifeStage: m.life_stage ?? null,
    birthDetailsSaved: !!m.birth_date,
    janmaNakshatra: m.janma_nakshatra,
    janmaMasa: m.janma_masa,
  };
}

// ---------------------------------------------------------------------------
// Today's assessment for the birth star
// ---------------------------------------------------------------------------

export type DayLevel = 'good' | 'mixed' | 'careful';

// The nine taras counted from the birth star; true where the tara is favourable
const TARAS: { name: Name; good: boolean | null; meaning: Name }[] = [
  { name: n('Janma', 'జన్మ'), good: null, meaning: n('your own star: keep things steady', 'మీ జన్మ తార: నిదానంగా ఉండండి') },
  { name: n('Sampat', 'సంపత్'), good: true, meaning: n('wealth and gains', 'సంపద, లాభం') },
  { name: n('Vipat', 'విపత్'), good: false, meaning: n('obstacles; avoid new ventures', 'ఆటంకాలు; కొత్త పనులు వద్దు') },
  { name: n('Kshema', 'క్షేమ'), good: true, meaning: n('well-being and safety', 'క్షేమం, శుభం') },
  { name: n('Pratyak', 'ప్రత్యక్'), good: false, meaning: n('opposition; be patient', 'వ్యతిరేకత; ఓపికగా ఉండండి') },
  { name: n('Sadhana', 'సాధన'), good: true, meaning: n('effort succeeds', 'ప్రయత్నం ఫలిస్తుంది') },
  { name: n('Naidhana', 'నైధన'), good: false, meaning: n('the most unfavourable tara; take care', 'అత్యంత అశుభ తార; జాగ్రత్త') },
  { name: n('Mitra', 'మిత్ర'), good: true, meaning: n('friendly and helpful', 'మిత్ర తార, సహాయకరం') },
  { name: n('Parama Mitra', 'పరమ మిత్ర'), good: true, meaning: n('very favourable', 'చాలా శుభం') },
];

export interface DayAssessment {
  level: DayLevel;
  tara: { number: number; name: Name; meaning: Name; good: boolean | null };
  chandra: { position: number; good: boolean | null; chandrashtama: boolean };
  todayNakshatra: Name;
  todayRashi: Name;
}

// Tara balam (today's nakshatra counted from the birth star) together with
// chandra balam (the Moon's sign counted from the birth sign: 1, 3, 6, 7, 10
// and 11 are good; 4, 8 and 12 are not; the 8th is chandrashtamam).
export function assessDay(star: BirthStar, p: Panchangam): DayAssessment {
  const count = (p.nakshatraIndex - star.nakshatra + 27) % 27;
  const taraIndex = count % 9;
  const tara = TARAS[taraIndex];
  const position = ((p.moonRashiIndex - star.rashi + 12) % 12) + 1;
  const chandraGood = [1, 3, 6, 7, 10, 11].includes(position) ? true : [4, 8, 12].includes(position) ? false : null;
  const chandrashtama = position === 8;

  let score = tara.good === true ? 1 : tara.good === false ? -1 : 0;
  score += chandraGood === true ? 1 : chandraGood === false ? -1 : 0;
  if (taraIndex === 6) score -= 1; // Naidhana
  const level: DayLevel = chandrashtama || score <= -1 ? 'careful' : score >= 2 ? 'good' : 'mixed';

  return {
    level,
    tara: { number: taraIndex + 1, name: tara.name, meaning: tara.meaning, good: tara.good },
    chandra: { position, good: chandraGood, chandrashtama },
    todayNakshatra: NAKSHATRA_NAMES[p.nakshatraIndex],
    todayRashi: RASHI_NAMES[p.moonRashiIndex],
  };
}

// ---------------------------------------------------------------------------
// Horas and slokams
// ---------------------------------------------------------------------------

export interface Slokam {
  title: Name;
  te: string; // in Telugu script
  en: string; // transliterated
  meaning: Name;
}

export interface HoraPlanet {
  name: Name;
  deity: Name;
  slokam: Slokam;
}

// Indexed as Hora.planet: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn.
// Slokams from the Navagraha Stotram (Vyasa).
export const HORA_PLANETS: HoraPlanet[] = [
  {
    name: n('Surya (Sun)', 'సూర్య (రవి)'),
    deity: n('Surya Narayana', 'సూర్యనారాయణుడు'),
    slokam: {
      title: n('Navagraha Stotram – Surya', 'నవగ్రహ స్తోత్రం – సూర్యుడు'),
      te: 'జపాకుసుమ సంకాశం కాశ్యపేయం మహాద్యుతిమ్ ।\nతమోఽరిం సర్వపాపఘ్నం ప్రణతోఽస్మి దివాకరమ్ ॥',
      en: 'japākusuma saṅkāśaṁ kāśyapeyaṁ mahādyutim |\ntamo’riṁ sarvapāpaghnaṁ praṇato’smi divākaram ||',
      meaning: n(
        'I bow to the Sun, son of Kashyapa, red as the hibiscus flower, of great radiance, the enemy of darkness who destroys all sins.',
        'మందార పువ్వు వంటి ఎర్రని కాంతి గలవాడు, కశ్యప పుత్రుడు, మహాతేజస్వి, చీకటికి శత్రువు, సర్వ పాపాలను నశింపజేసే సూర్యునికి నమస్కరిస్తున్నాను.'
      ),
    },
  },
  {
    name: n('Chandra (Moon)', 'చంద్ర'),
    deity: n('Gauri (Parvati)', 'గౌరీ (పార్వతీ దేవి)'),
    slokam: {
      title: n('Navagraha Stotram – Chandra', 'నవగ్రహ స్తోత్రం – చంద్రుడు'),
      te: 'దధిశంఖ తుషారాభం క్షీరోదార్ణవ సంభవమ్ ।\nనమామి శశినం సోమం శంభోర్ముకుట భూషణమ్ ॥',
      en: 'dadhiśaṅkha tuṣārābhaṁ kṣīrodārṇava sambhavam |\nnamāmi śaśinaṁ somaṁ śambhor mukuṭa bhūṣaṇam ||',
      meaning: n(
        'I bow to the Moon, white as curd, the conch and snow, born of the ocean of milk, the jewel on the crown of Shiva.',
        'పెరుగు, శంఖం, మంచు వంటి తెల్లని కాంతి గలవాడు, పాలసముద్రంలో పుట్టినవాడు, శివుని కిరీటానికి అలంకారమైన చంద్రునికి నమస్కరిస్తున్నాను.'
      ),
    },
  },
  {
    name: n('Kuja (Mars)', 'కుజ (అంగారక)'),
    deity: n('Subrahmanya', 'సుబ్రహ్మణ్య స్వామి'),
    slokam: {
      title: n('Navagraha Stotram – Angaraka', 'నవగ్రహ స్తోత్రం – అంగారకుడు'),
      te: 'ధరణీగర్భ సంభూతం విద్యుత్కాంతి సమప్రభమ్ ।\nకుమారం శక్తిహస్తం తం మంగళం ప్రణమామ్యహమ్ ॥',
      en: 'dharaṇīgarbha sambhūtaṁ vidyutkānti samaprabham |\nkumāraṁ śaktihastaṁ taṁ maṅgalaṁ praṇamāmyaham ||',
      meaning: n(
        'I bow to Mangala, born of the Earth, shining like lightning, youthful, holding the spear in his hand.',
        'భూదేవి గర్భాన పుట్టినవాడు, మెరుపు వంటి కాంతి గలవాడు, కుమారుడు, శక్తి ఆయుధం ధరించిన మంగళునికి నమస్కరిస్తున్నాను.'
      ),
    },
  },
  {
    name: n('Budha (Mercury)', 'బుధ'),
    deity: n('Maha Vishnu', 'మహావిష్ణువు'),
    slokam: {
      title: n('Navagraha Stotram – Budha', 'నవగ్రహ స్తోత్రం – బుధుడు'),
      te: 'ప్రియంగు కలికాశ్యామం రూపేణాప్రతిమం బుధమ్ ।\nసౌమ్యం సౌమ్యగుణోపేతం తం బుధం ప్రణమామ్యహమ్ ॥',
      en: 'priyaṅgu kalikāśyāmaṁ rūpeṇāpratimaṁ budham |\nsaumyaṁ saumyaguṇopetaṁ taṁ budhaṁ praṇamāmyaham ||',
      meaning: n(
        'I bow to Budha, dark like the priyangu bud, of matchless form, gentle and full of gentle virtues.',
        'ప్రియంగు మొగ్గ వంటి శ్యామల వర్ణం గలవాడు, సాటిలేని రూపం గలవాడు, సౌమ్యుడు, సౌమ్య గుణాలు గల బుధునికి నమస్కరిస్తున్నాను.'
      ),
    },
  },
  {
    name: n('Guru (Jupiter)', 'గురు (బృహస్పతి)'),
    deity: n('Dakshinamurthy', 'దక్షిణామూర్తి'),
    slokam: {
      title: n('Navagraha Stotram – Brihaspati', 'నవగ్రహ స్తోత్రం – బృహస్పతి'),
      te: 'దేవానాం చ ఋషీణాం చ గురుం కాంచన సన్నిభమ్ ।\nబుద్ధిభూతం త్రిలోకేశం తం నమామి బృహస్పతిమ్ ॥',
      en: 'devānāṁ ca ṛṣīṇāṁ ca guruṁ kāñcana sannibham |\nbuddhibhūtaṁ trilokeśaṁ taṁ namāmi bṛhaspatim ||',
      meaning: n(
        'I bow to Brihaspati, teacher of the gods and the sages, golden in colour, wisdom itself, lord of the three worlds.',
        'దేవతలకు, ఋషులకు గురువు, బంగారు వర్ణం గలవాడు, బుద్ధి స్వరూపుడు, ముల్లోకాలకు ప్రభువైన బృహస్పతికి నమస్కరిస్తున్నాను.'
      ),
    },
  },
  {
    name: n('Shukra (Venus)', 'శుక్ర'),
    deity: n('Mahalakshmi', 'మహాలక్ష్మి'),
    slokam: {
      title: n('Navagraha Stotram – Shukra', 'నవగ్రహ స్తోత్రం – శుక్రుడు'),
      te: 'హిమకుంద మృణాలాభం దైత్యానాం పరమం గురుమ్ ।\nసర్వశాస్త్ర ప్రవక్తారం భార్గవం ప్రణమామ్యహమ్ ॥',
      en: 'himakunda mṛṇālābhaṁ daityānāṁ paramaṁ gurum |\nsarvaśāstra pravaktāraṁ bhārgavaṁ praṇamāmyaham ||',
      meaning: n(
        'I bow to Shukra of the Bhrigu line, white as snow, jasmine and lotus fibre, the great teacher of the daityas, expounder of all the shastras.',
        'మంచు, మల్లె, తామర తూడు వంటి తెల్లని కాంతి గలవాడు, దైత్యులకు పరమ గురువు, సర్వ శాస్త్రాలు బోధించే భార్గవునికి నమస్కరిస్తున్నాను.'
      ),
    },
  },
  {
    name: n('Shani (Saturn)', 'శని'),
    deity: n('Sri Venkateswara', 'శ్రీ వేంకటేశ్వర స్వామి'),
    slokam: {
      title: n('Navagraha Stotram – Shani', 'నవగ్రహ స్తోత్రం – శని'),
      te: 'నీలాంజన సమాభాసం రవిపుత్రం యమాగ్రజమ్ ।\nఛాయామార్తాండ సంభూతం తం నమామి శనైశ్చరమ్ ॥',
      en: 'nīlāñjana samābhāsaṁ raviputraṁ yamāgrajam |\nchāyāmārtāṇḍa sambhūtaṁ taṁ namāmi śanaiścaram ||',
      meaning: n(
        'I bow to Shanaishchara, dark as blue collyrium, son of the Sun and elder brother of Yama, born of Chhaya and Surya.',
        'నల్లని కాటుక వంటి కాంతి గలవాడు, సూర్య పుత్రుడు, యముని అన్న, ఛాయా సూర్యులకు జన్మించిన శనైశ్చరునికి నమస్కరిస్తున్నాను.'
      ),
    },
  },
];

// A slokam for each weekday, Sunday first, to the day's deity
export const DAY_SLOKAMS: Slokam[] = [
  {
    title: n('Surya Namaskara', 'సూర్య నమస్కారం'),
    te: 'నమః సవిత్రే జగదేక చక్షుషే జగత్ప్రసూతి స్థితి నాశ హేతవే ।\nత్రయీమయాయ త్రిగుణాత్మ ధారిణే విరించి నారాయణ శంకరాత్మనే ॥',
    en: 'namaḥ savitre jagadeka cakṣuṣe jagatprasūti sthiti nāśa hetave |\ntrayīmayāya triguṇātma dhāriṇe viriñci nārāyaṇa śaṅkarātmane ||',
    meaning: n(
      'Salutations to Savitr, the one eye of the world, the cause of its creation, sustenance and dissolution, made of the three Vedas, bearing the three gunas, who is Brahma, Narayana and Shankara.',
      'జగత్తుకు ఏకైక నేత్రమై, సృష్టి స్థితి లయాలకు కారణమై, వేదత్రయ స్వరూపుడై, త్రిగుణాలను ధరించి, బ్రహ్మ విష్ణు శివ స్వరూపుడైన సవితకు నమస్కారం.'
    ),
  },
  {
    title: n('Shiva Dhyanam', 'శివ ధ్యానం'),
    te: 'కర్పూరగౌరం కరుణావతారం సంసారసారం భుజగేంద్రహారమ్ ।\nసదా వసంతం హృదయారవిందే భవం భవానీసహితం నమామి ॥',
    en: 'karpūragauraṁ karuṇāvatāraṁ saṁsārasāraṁ bhujagendrahāram |\nsadā vasantaṁ hṛdayāravinde bhavaṁ bhavānīsahitaṁ namāmi ||',
    meaning: n(
      'I bow to Shiva with Bhavani, white as camphor, compassion incarnate, the essence of the world, garlanded with the king of serpents, ever dwelling in the lotus of the heart.',
      'కర్పూరం వలె తెల్లనివాడు, కరుణకు అవతారం, సంసారానికి సారం, సర్పరాజును హారంగా ధరించినవాడు, హృదయ కమలంలో ఎల్లప్పుడూ నివసించే భవానీ సహిత శివునికి నమస్కరిస్తున్నాను.'
    ),
  },
  {
    title: n('Hanuman Dhyanam', 'హనుమాన్ ధ్యానం'),
    te: 'మనోజవం మారుతతుల్యవేగం జితేంద్రియం బుద్ధిమతాం వరిష్ఠమ్ ।\nవాతాత్మజం వానరయూథముఖ్యం శ్రీరామదూతం శరణం ప్రపద్యే ॥',
    en: 'manojavaṁ mārutatulyavegaṁ jitendriyaṁ buddhimatāṁ variṣṭham |\nvātātmajaṁ vānarayūthamukhyaṁ śrīrāmadūtaṁ śaraṇaṁ prapadye ||',
    meaning: n(
      'I take refuge in the messenger of Sri Rama, swift as the mind and the wind, master of the senses, foremost of the wise, son of Vayu, chief of the vanara host.',
      'మనోవేగం, వాయువేగం గలవాడు, ఇంద్రియాలను జయించినవాడు, బుద్ధిమంతులలో శ్రేష్ఠుడు, వాయుపుత్రుడు, వానర సేనానాయకుడైన శ్రీరామదూతను శరణు వేడుతున్నాను.'
    ),
  },
  {
    title: n('Ganesha Prarthana', 'గణపతి ప్రార్థన'),
    te: 'వక్రతుండ మహాకాయ సూర్యకోటి సమప్రభ ।\nనిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥',
    en: 'vakratuṇḍa mahākāya sūryakoṭi samaprabha |\nnirvighnaṁ kuru me deva sarvakāryeṣu sarvadā ||',
    meaning: n(
      'O Lord with the curved trunk and mighty body, radiant as a crore suns, always remove the obstacles from all my undertakings.',
      'వంకర తొండం, మహా శరీరం, కోటి సూర్యుల కాంతి గల దేవా, నా అన్ని పనులలో ఎల్లప్పుడూ విఘ్నాలు లేకుండా చేయి.'
    ),
  },
  {
    title: n('Guru Vandanam', 'గురు వందనం'),
    te: 'గురుర్బ్రహ్మా గురుర్విష్ణుః గురుర్దేవో మహేశ్వరః ।\nగురుః సాక్షాత్ పరబ్రహ్మ తస్మై శ్రీగురవే నమః ॥',
    en: 'gururbrahmā gururviṣṇuḥ gururdevo maheśvaraḥ |\nguruḥ sākṣāt parabrahma tasmai śrīgurave namaḥ ||',
    meaning: n(
      'The Guru is Brahma, the Guru is Vishnu, the Guru is Lord Maheshvara; the Guru is the Supreme Brahman itself. Salutations to that Guru.',
      'గురువే బ్రహ్మ, గురువే విష్ణువు, గురువే మహేశ్వరుడు; గురువే సాక్షాత్ పరబ్రహ్మ. అటువంటి శ్రీగురువుకు నమస్కారం.'
    ),
  },
  {
    title: n('Devi Prarthana', 'దేవీ ప్రార్థన'),
    te: 'సర్వమంగళ మాంగల్యే శివే సర్వార్థ సాధికే ।\nశరణ్యే త్ర్యంబకే గౌరి నారాయణి నమోఽస్తు తే ॥',
    en: 'sarvamaṅgala māṅgalye śive sarvārtha sādhike |\nśaraṇye tryambake gauri nārāyaṇi namo’stu te ||',
    meaning: n(
      'O auspiciousness of all that is auspicious, O Shive who fulfils every aim, O refuge, three-eyed Gauri, Narayani, salutations to you.',
      'సర్వ మంగళాలకు మంగళ స్వరూపిణీ, సర్వ కార్యాలను సిద్ధింపజేసే శివే, శరణు ఇచ్చే త్రినేత్రీ గౌరీ, నారాయణీ, నీకు నమస్కారం.'
    ),
  },
  {
    title: n('Srinivasa Mangalam', 'శ్రీనివాస మంగళం'),
    te: 'శ్రియః కాంతాయ కల్యాణనిధయే నిధయేఽర్థినామ్ ।\nశ్రీవేంకటనివాసాయ శ్రీనివాసాయ మంగళమ్ ॥',
    en: 'śriyaḥ kāntāya kalyāṇanidhaye nidhaye’rthinām |\nśrīveṅkaṭanivāsāya śrīnivāsāya maṅgalam ||',
    meaning: n(
      'Auspiciousness to Srinivasa who dwells on Venkata hill, beloved of Lakshmi, treasure of all good, the wealth of those who seek him.',
      'లక్ష్మీదేవికి ప్రియుడు, కల్యాణ గుణాలకు నిధి, కోరినవారికి నిధి, వేంకటాచల నివాసుడైన శ్రీనివాసునికి మంగళం.'
    ),
  },
];

// The panchangam for the Hindu day `now` falls in (a day runs sunrise to sunrise)
export function hinduDay(now: Date, place: PanchangamLocation): Panchangam {
  const p = computePanchangam(now, place);
  return now < p.sunrise ? computePanchangam(new Date(now.getTime() - DAY_MS), place) : p;
}

export function currentHora(p: Panchangam, now: Date): { hora: Hora; next: Hora | null; index: number } | null {
  const index = p.horas.findIndex((h) => now >= h.start && now < h.end);
  if (index < 0) return null;
  return { hora: p.horas[index], next: p.horas[index + 1] ?? null, index };
}

// ---------------------------------------------------------------------------
// Good window
// ---------------------------------------------------------------------------

export interface GoodWindow {
  start: Date;
  end: Date;
  label: Name;
}

const MIN_WINDOW_MS = 24 * 60000;
// Benefic horas for starting something important: Jupiter, Venus, Mercury, Moon
const SHUBHA_HORAS = [4, 5, 3, 1];

// Daytime windows from Abhijit muhurtam and the benefic horas, with Rahu
// kalam, Yamagandam, Gulika kalam and Durmuhurtam taken out. Windows shorter
// than one ghati (24 min) are dropped.
export function goodWindows(p: Panchangam): GoodWindow[] {
  const bad: [Date, Date][] = [p.rahuKalam, p.yamagandam, p.gulikaKalam, ...p.durmuhurtam];
  const candidates: GoodWindow[] = [];
  if (p.weekdayIndex !== 3) {
    candidates.push({ start: p.abhijit[0], end: p.abhijit[1], label: n('Abhijit muhurtam', 'అభిజిత్ ముహూర్తం') });
  }
  for (const h of p.horas) {
    if (h.night || !SHUBHA_HORAS.includes(h.planet)) continue;
    const planet = HORA_PLANETS[h.planet].name;
    candidates.push({ start: h.start, end: h.end, label: n(`${planet.en.split(' ')[0]} hora`, `${planet.te.split(' ')[0]} హోర`) });
  }

  const out: GoodWindow[] = [];
  for (const c of candidates) {
    let pieces: [number, number][] = [[c.start.getTime(), c.end.getTime()]];
    for (const [bs, be] of bad) {
      pieces = pieces.flatMap(([s, e]): [number, number][] => {
        if (be.getTime() <= s || bs.getTime() >= e) return [[s, e]];
        const left: [number, number][] = bs.getTime() > s ? [[s, bs.getTime()]] : [];
        const right: [number, number][] = be.getTime() < e ? [[be.getTime(), e]] : [];
        return [...left, ...right];
      });
    }
    for (const [s, e] of pieces) {
      if (e - s >= MIN_WINDOW_MS) out.push({ start: new Date(s), end: new Date(e), label: c.label });
    }
  }
  // Abhijit overlaps a hora: keep Abhijit and trim nothing else, but drop exact duplicates
  return out
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .filter((w, i, all) => i === 0 || w.start.getTime() !== all[i - 1].start.getTime());
}

// The good window running now or coming next, today or tomorrow
export function nextGoodWindow(now: Date, place: PanchangamLocation): { window: GoodWindow; current: boolean } | null {
  for (let d = 0; d < 3; d++) {
    const p = hinduDay(new Date(now.getTime() + d * DAY_MS), place);
    const w = goodWindows(p).find((x) => x.end.getTime() - Math.max(now.getTime(), x.start.getTime()) >= 10 * 60000);
    if (w) return { window: w, current: w.start <= now };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Festivals ahead
// ---------------------------------------------------------------------------

export interface DatedObservance {
  date: Date; // civil date (midnight IST)
  observance: Observance;
}

// Festivals, vratas and monthly observances from today for `days` days, worked
// out for the member's city by the Telugu (Smarta) rules in panchangam.ts
export function observancesAhead(from: Date, place: PanchangamLocation, days: number): DatedObservance[] {
  const out: DatedObservance[] = [];
  let yesterday = new Set<string>();
  for (let i = 0; i < days; i++) {
    const p = computePanchangam(new Date(from.getTime() + i * DAY_MS), place);
    const today = new Set<string>();
    for (const o of p.observances) {
      if (o.kind === 'daily') continue;
      today.add(o.name.en);
      // A period such as Dhanurmasam or Mahalaya Paksham is listed on its first day only
      if (o.kind === 'vrata' && yesterday.has(o.name.en)) continue;
      out.push({ date: p.date, observance: o });
    }
    yesterday = today;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const PERSONAL_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    heading: 'For you today',
    hora: 'Hora now',
    deity: 'Deity',
    until: 'until',
    nextHora: 'Next',
    slokams: 'Slokams',
    horaSlokam: 'Slokam for this hora',
    daySlokam: "Today's slokam",
    tapToRead: 'Tap to read the full verse and meaning',
    close: 'Close',
    meaning: 'Meaning',
    goodWindow: 'Good time to begin',
    goodNow: 'Now, until',
    goodNext: 'Next',
    goodNote: 'Abhijit and the benefic horas, avoiding Rahu kalam, Yamagandam, Gulika and Durmuhurtam.',
    birthStar: 'Your birth star',
    pada: 'pada',
    rashi: 'Rashi',
    good: 'A good day',
    mixed: 'A mixed day',
    careful: 'A day to be careful',
    tara: 'Tara',
    chandra: 'Moon from your rashi',
    chandrashtama: 'Chandrashtamam: avoid starting important work',
    todayStar: "Today's nakshatra",
    upcoming: 'Coming up',
    festivals: 'Festivals and vratas',
    festivalsNote: 'Telugu Smarta calendar, worked out for your city.',
    ekadashi: 'Ekadashi',
    purnima: 'Purnima',
    amavasya: 'Amavasya',
    panchangam: 'Panchangam',
    kalas: 'Kalas',
    abhijit: 'Abhijit muhurtam',
    durmuhurtam: 'Durmuhurtam',
    horas: 'Horas',
    day: 'Day',
    night: 'Night',
    now: 'now',
    addDetails: 'Add your date, time and place of birth to see your birth star, hora and a panchangam for your city.',
    addDetailsButton: 'Add birth details',
    wednesday: 'Abhijit is not used on Wednesdays',
  },
  te: {
    heading: 'ఈ రోజు మీ కోసం',
    hora: 'ప్రస్తుత హోర',
    deity: 'దేవత',
    until: 'వరకు',
    nextHora: 'తదుపరి',
    slokams: 'శ్లోకాలు',
    horaSlokam: 'ఈ హోర శ్లోకం',
    daySlokam: 'నేటి శ్లోకం',
    tapToRead: 'పూర్తి శ్లోకం, అర్థం కోసం నొక్కండి',
    close: 'మూసివేయి',
    meaning: 'అర్థం',
    goodWindow: 'పని ప్రారంభానికి మంచి సమయం',
    goodNow: 'ఇప్పుడు,',
    goodNext: 'తదుపరి',
    goodNote: 'అభిజిత్, శుభ హోరలు; రాహుకాలం, యమగండం, గుళిక, దుర్ముహూర్తం మినహాయించి.',
    birthStar: 'మీ జన్మ నక్షత్రం',
    pada: 'పాదం',
    rashi: 'రాశి',
    good: 'శుభ దినం',
    mixed: 'మిశ్రమ దినం',
    careful: 'జాగ్రత్తగా ఉండవలసిన రోజు',
    tara: 'తార',
    chandra: 'మీ రాశి నుండి చంద్రుడు',
    chandrashtama: 'చంద్రాష్టమం: ముఖ్యమైన పనులు ప్రారంభించవద్దు',
    todayStar: 'నేటి నక్షత్రం',
    upcoming: 'రాబోయే పర్వదినాలు',
    festivals: 'పండుగలు, వ్రతాలు',
    festivalsNote: 'తెలుగు స్మార్త పంచాంగం, మీ నగరానికి లెక్కించబడింది.',
    ekadashi: 'ఏకాదశి',
    purnima: 'పౌర్ణమి',
    amavasya: 'అమావాస్య',
    panchangam: 'పంచాంగం',
    kalas: 'కాలాలు',
    abhijit: 'అభిజిత్ ముహూర్తం',
    durmuhurtam: 'దుర్ముహూర్తం',
    horas: 'హోరలు',
    day: 'పగలు',
    night: 'రాత్రి',
    now: 'ఇప్పుడు',
    addDetails: 'మీ జన్మ నక్షత్రం, హోర, మీ నగర పంచాంగం చూడటానికి మీ పుట్టిన తేదీ, సమయం, ఊరు నమోదు చేయండి.',
    addDetailsButton: 'జన్మ వివరాలు నమోదు చేయండి',
    wednesday: 'బుధవారం అభిజిత్ ఉపయోగించరు',
  },
};

export function ordinalPosition(position: number, language: Lang): string {
  if (language === 'te') return `${position}వ స్థానం`;
  const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
  return `${position}${suffix}`;
}
