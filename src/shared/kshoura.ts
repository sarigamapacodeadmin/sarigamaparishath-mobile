// "Haircut today? (Kshoura)": whether this moment suits a haircut, from the
// Kshoura Karma Nirdeshavali chart. Rules only, no UI and no astronomy: it takes
// the panchangam values for this moment, the member's profile values and "now",
// and returns the verdict with its reasons in English and Telugu.
// Copy of the website's lib/kshoura.ts; keep the two in sync.

import { MASA_NAMES, NAKSHATRA_NAMES, TITHI_NAMES, YOGA_NAMES } from './panchangam';

export interface Text {
  en: string;
  te: string;
}
const t = (en: string, te: string): Text => ({ en, te });

export const LIFE_STAGES = ['married_with_sons', 'married_no_sons', 'unmarried', 'undisclosed'] as const;
export type LifeStage = (typeof LIFE_STAGES)[number];

export const LIFE_STAGE_LABELS: Record<LifeStage, Text> = {
  married_with_sons: t('Married, with sons', 'వివాహితులు, కుమారులు ఉన్నారు'),
  married_no_sons: t('Married, no sons', 'వివాహితులు, కుమారులు లేరు'),
  unmarried: t('Unmarried (brahmachari)', 'అవివాహితులు (బ్రహ్మచారి)'),
  undisclosed: t("Don't want to disclose", 'చెప్పదలచుకోలేదు'),
};

export function isLifeStage(v: unknown): v is LifeStage {
  return typeof v === 'string' && (LIFE_STAGES as readonly string[]).includes(v);
}

// The panchangam for this moment at the member's city
export interface KshouraPanchangam {
  weekday: number; // 0 = Sunday
  tithi: number; // 1-30: 1-15 Shukla (15 Purnima), 16-30 Krishna (30 Amavasya)
  nakshatra: number; // 1-27, Ashvini 1
  yoga: number; // 1-27, Vishkambha 1
  karana: Text; // name, e.g. Vishti
  masa: number; // amanta, 1-12, Chaitra 1 (Bhadrapada 6)
  adhika?: boolean; // an Adhika masa (Mahalaya paksham is only in the nija Bhadrapada)
  sankranti: boolean; // the Sun changes rasi between the previous sunset and this day's sunset
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
}

// undefined = the server did not send it (offline, loading, older server);
// null = not known from the profile
export interface KshouraProfile {
  lifeStage?: string | null;
  birthDetailsSaved: boolean; // a birth date is saved
  janmaNakshatra?: number | null; // 1-27
  janmaMasa?: number | null; // 1-12
}

export type RuleId =
  | 'weekday'
  | 'tithi'
  | 'nakshatra'
  | 'yoga'
  | 'karana'
  | 'sankranti'
  | 'pitru_paksham'
  | 'janma_nakshatra'
  | 'janma_masa'
  | 'time';

export type RuleStatus = 'pass' | 'fail' | 'skipped';

export interface RuleResult {
  id: RuleId;
  status: RuleStatus;
  // Why a rule was skipped: a gap in the profile (marked with *), or the server
  // didn't send the value (not the profile's fault)
  skipReason?: 'profile' | 'unavailable';
  text: Text;
}

export interface KshouraVerdict {
  ok: boolean;
  headline: Text;
  results: RuleResult[]; // every rule, in chart order
  shown: RuleResult[]; // under "Why": failures when red, passes when green, plus skipped lines
  weekdayEffect: Text | null; // green cards only
  profileIncomplete: boolean; // show the * note and the Fill in profile button
}

const WEEKDAYS: Text[] = [
  t('Sunday', 'ఆదివారం'), t('Monday', 'సోమవారం'), t('Tuesday', 'మంగళవారం'), t('Wednesday', 'బుధవారం'),
  t('Thursday', 'గురువారం'), t('Friday', 'శుక్రవారం'), t('Saturday', 'శనివారం'),
];

// Months of life gained (+) or lost (-) by a haircut on each weekday, Sunday first
export const WEEKDAY_EFFECT_MONTHS = [-1, 7, -8, 5, 10, 11, -7];

// Allowed nakshatras (Ashvini = 1)
export const ALLOWED_NAKSHATRAS = [1, 5, 7, 8, 13, 14, 15, 18, 22, 23, 24, 27];
// Tithi positions within a paksha that are not allowed (15 = Purnima / Amavasya, 11 = Ekadashi)
export const BAD_TITHI_POSITIONS = [1, 4, 6, 9, 11, 14, 15];
export const BAD_YOGAS = [17, 27]; // Vyatipata, Vaidhriti
const BHADRAPADA = 6;
export const SANDHYA_MS = 48 * 60000;

const IST_MS = 330 * 60000;
function istTime(date: Date): string {
  const ist = new Date(date.getTime() + IST_MS);
  const h = ist.getUTCHours();
  const m = ist.getUTCMinutes().toString().padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

const nameOf = (list: Text[], number: number, fallback: string): Text =>
  list[number - 1] ?? t(`${fallback} ${number}`, `${fallback} ${number}`);

export function weekdayEffect(weekday: number): Text {
  const months = WEEKDAY_EFFECT_MONTHS[weekday];
  const day = WEEKDAYS[weekday];
  const abs = Math.abs(months);
  const en = `${day.en}: ${months > 0 ? 'adds' : 'takes away'} ${abs} month${abs === 1 ? '' : 's'} ${months > 0 ? 'to' : 'of'} life.`;
  const te = `${day.te}: ఆయుష్షు ${abs} ${abs === 1 ? 'నెల' : 'నెలలు'} ${months > 0 ? 'పెరుగుతుంది' : 'తగ్గుతుంది'}.`;
  return { en, te };
}

function weekdayRule(weekday: number, lifeStage: string | null | undefined): RuleResult {
  const day = WEEKDAYS[weekday];
  const id = 'weekday' as const;
  if ([0, 2, 6].includes(weekday)) {
    return { id, status: 'fail', text: t(`${day.en}: a haircut is never done on this day`, `${day.te}: ఈ రోజు క్షౌరం నిషిద్ధం`) };
  }
  if (weekday === 1 || weekday === 4) {
    const stage = isLifeStage(lifeStage) ? lifeStage : 'undisclosed';
    if (stage === 'undisclosed') {
      return {
        id,
        status: 'skipped',
        skipReason: 'profile',
        text: t(
          `${day.en}: allowed or not depends on your marital status*`,
          `${day.te}: మీ వైవాహిక స్థితిని బట్టి అనుకూలం లేదా కాదు*`
        ),
      };
    }
    if (weekday === 1 && stage === 'married_with_sons') {
      return { id, status: 'fail', text: t('Monday: not for a married man with sons', 'సోమవారం: కుమారులు ఉన్న వివాహితులకు నిషిద్ధం') };
    }
    if (weekday === 4 && stage === 'unmarried') {
      return { id, status: 'fail', text: t('Thursday: not for the unmarried (brahmachari)', 'గురువారం: అవివాహితులకు (బ్రహ్మచారులకు) నిషిద్ధం') };
    }
  }
  return { id, status: 'pass', text: t(`${day.en} is an allowed day`, `${day.te} క్షౌరానికి అనుకూలమైన రోజు`) };
}

function timeRule(now: Date, p: KshouraPanchangam): RuleResult {
  const id = 'time' as const;
  const sandhya = new Date(p.sunset.getTime() - SANDHYA_MS);
  if (now < p.sunrise) {
    return { id, status: 'fail', text: t(`Before sunrise (sunrise at ${istTime(p.sunrise)})`, `సూర్యోదయానికి ముందు (సూర్యోదయం ${istTime(p.sunrise)})`) };
  }
  if (now >= p.sunset) {
    return {
      id,
      status: 'fail',
      text: t(`After sunset: not until sunrise (${istTime(p.nextSunrise)})`, `సూర్యాస్తమయం తర్వాత: సూర్యోదయం (${istTime(p.nextSunrise)}) వరకు నిషిద్ధం`),
    };
  }
  if (now >= sandhya) {
    return {
      id,
      status: 'fail',
      text: t(
        `Sandhya: the 48 minutes before sunset (${istTime(sandhya)} – ${istTime(p.sunset)})`,
        `సంధ్యా సమయం: సూర్యాస్తమయానికి ముందు 48 నిమిషాలు (${istTime(sandhya)} – ${istTime(p.sunset)})`
      ),
    };
  }
  return { id, status: 'pass', text: t(`Daytime, before Sandhya (until ${istTime(sandhya)})`, `పగటి సమయం, సంధ్యకు ముందు (${istTime(sandhya)} వరకు)`) };
}

const UNAVAILABLE = t('could not be checked right now; pull down to refresh', 'ఇప్పుడు పరిశీలించలేకపోయాము; రిఫ్రెష్ చేయడానికి కిందికి లాగండి');

// A rule on a birth chart value: unknown in the profile is a gap; saved but not
// sent by the server is "could not be checked"
function birthRule(
  id: 'janma_nakshatra' | 'janma_masa',
  birthDetailsSaved: boolean,
  value: number | null | undefined,
  today: number,
  label: Text,
  names: Text[],
  fallback: string
): RuleResult {
  if (birthDetailsSaved && value === undefined) {
    return { id, status: 'skipped', skipReason: 'unavailable', text: t(`${label.en}: ${UNAVAILABLE.en}`, `${label.te}: ${UNAVAILABLE.te}`) };
  }
  if (value == null) {
    return { id, status: 'skipped', skipReason: 'profile', text: t(`${label.en} not known*`, `${label.te} తెలియదు*`) };
  }
  const own = nameOf(names, value, fallback);
  if (value === today) {
    return { id, status: 'fail', text: t(`Today is ${own.en}, your ${label.en.toLowerCase()}`, `ఈ రోజు ${own.te}, మీ ${label.te}`) };
  }
  return { id, status: 'pass', text: t(`Not your ${label.en.toLowerCase()} (${own.en})`, `మీ ${label.te} (${own.te}) కాదు`) };
}

export function kshouraVerdict(p: KshouraPanchangam, profile: KshouraProfile, now: Date): KshouraVerdict {
  const results: RuleResult[] = [];

  results.push(weekdayRule(p.weekday, profile.lifeStage));

  const tithiName = nameOf(TITHI_NAMES, p.tithi, 'Tithi');
  const position = ((p.tithi - 1) % 15) + 1;
  results.push(
    BAD_TITHI_POSITIONS.includes(position)
      ? { id: 'tithi', status: 'fail', text: t(`${tithiName.en} tithi: not allowed`, `${tithiName.te} తిథి: క్షౌరానికి నిషిద్ధం`) }
      : { id: 'tithi', status: 'pass', text: t(`${tithiName.en} tithi is allowed`, `${tithiName.te} తిథి అనుకూలం`) }
  );

  const star = nameOf(NAKSHATRA_NAMES, p.nakshatra, 'Nakshatra');
  results.push(
    ALLOWED_NAKSHATRAS.includes(p.nakshatra)
      ? { id: 'nakshatra', status: 'pass', text: t(`${star.en} nakshatra is allowed`, `${star.te} నక్షత్రం అనుకూలం`) }
      : { id: 'nakshatra', status: 'fail', text: t(`${star.en} nakshatra: not one of the allowed stars`, `${star.te} నక్షత్రం: అనుకూల నక్షత్రాలలో లేదు`) }
  );

  const yoga = nameOf(YOGA_NAMES, p.yoga, 'Yoga');
  results.push(
    BAD_YOGAS.includes(p.yoga)
      ? { id: 'yoga', status: 'fail', text: t(`${yoga.en} yoga: not allowed`, `${yoga.te} యోగం: నిషిద్ధం`) }
      : { id: 'yoga', status: 'pass', text: t(`${yoga.en} yoga: no blemish`, `${yoga.te} యోగం: దోషం లేదు`) }
  );

  results.push(
    /vishti|bhadra/i.test(p.karana.en)
      ? { id: 'karana', status: 'fail', text: t('Vishti (Bhadra) karana is running', 'విష్టి (భద్ర) కరణం నడుస్తోంది') }
      : { id: 'karana', status: 'pass', text: t(`${p.karana.en} karana, not Vishti`, `${p.karana.te} కరణం, విష్టి కాదు`) }
  );

  results.push(
    p.sankranti
      ? { id: 'sankranti', status: 'fail', text: t('Sankranti: the Sun changes rasi today', 'సంక్రాంతి: ఈ రోజు సూర్యుడు రాశి మారుతున్నాడు') }
      : { id: 'sankranti', status: 'pass', text: t('Not a Sankranti day', 'సంక్రాంతి రోజు కాదు') }
  );

  results.push(
    p.masa === BHADRAPADA && !p.adhika && p.tithi > 15
      ? { id: 'pitru_paksham', status: 'fail', text: t('Pitru (Mahalaya) paksham: Bhadrapada Krishna paksha', 'పితృ (మహాలయ) పక్షం: భాద్రపద కృష్ణ పక్షం') }
      : { id: 'pitru_paksham', status: 'pass', text: t('Not Pitru paksham', 'పితృ పక్షం కాదు') }
  );

  results.push(
    birthRule('janma_nakshatra', profile.birthDetailsSaved, profile.janmaNakshatra, p.nakshatra, t('Birth star', 'జన్మ నక్షత్రం'), NAKSHATRA_NAMES, 'Nakshatra')
  );
  results.push(
    birthRule('janma_masa', profile.birthDetailsSaved, profile.janmaMasa, p.masa, t('Birth month', 'జన్మ మాసం'), MASA_NAMES, 'Masa')
  );

  results.push(timeRule(now, p));

  const ok = !results.some((r) => r.status === 'fail');
  const skipped = results.filter((r) => r.status === 'skipped');
  return {
    ok,
    headline: ok ? t('Good time for a haircut', 'క్షౌరానికి అనుకూలం') : t('Not a good time for a haircut', 'క్షౌరానికి అనుకూలం కాదు'),
    results,
    shown: [...results.filter((r) => r.status === (ok ? 'pass' : 'fail')), ...skipped],
    weekdayEffect: ok ? weekdayEffect(p.weekday) : null,
    profileIncomplete: skipped.some((r) => r.skipReason === 'profile'),
  };
}

export const KSHOURA_LABELS = {
  en: {
    title: 'Haircut today? (Kshoura)',
    why: 'Why',
    alsoRemember: 'Also remember',
    note: '* Some rules were skipped because your profile is incomplete. For a better and more accurate result, fill in all your profile information.',
    fillProfile: 'Fill in profile',
    footer: 'From the Kshoura Karma Nirdeshavali chart. Checked for this moment at your city.',
    lifeStageLabel: 'Marital status (for the haircut day card)',
    lifeStageNotSaved: 'Marital status could not be saved yet (the database needs an update). Everything else was saved.',
  },
  te: {
    title: 'ఈ రోజు క్షౌరం? (క్షౌర కర్మ)',
    why: 'కారణాలు',
    alsoRemember: 'ఇవి కూడా గుర్తుంచుకోండి',
    note: '* మీ ప్రొఫైల్ పూర్తిగా లేనందున కొన్ని నియమాలు పరిగణించబడలేదు. మరింత ఖచ్చితమైన ఫలితం కోసం మీ ప్రొఫైల్ వివరాలన్నీ నింపండి.',
    fillProfile: 'ప్రొఫైల్ నింపండి',
    footer: 'క్షౌర కర్మ నిర్దేశావళి పట్టిక ఆధారంగా. మీ నగరానికి ఈ క్షణానికి పరిశీలించబడింది.',
    lifeStageLabel: 'వైవాహిక స్థితి (క్షౌర దిన కార్డు కోసం)',
    lifeStageNotSaved: 'వైవాహిక స్థితి ఇంకా సేవ్ కాలేదు (డేటాబేస్ నవీకరణ కావాలి). మిగతా వివరాలన్నీ సేవ్ అయ్యాయి.',
  },
};

// The rules the app can't check
export const KSHOURA_ALSO_REMEMBER: Text[] = [
  t('Not on a shraddha day, or when the wife is pregnant.', 'శ్రాద్ధ దినాన, భార్య గర్భవతిగా ఉన్నప్పుడు చేయించుకోరాదు.'),
  t('Not on an oil-bath day, and not after eating.', 'తైలాభ్యంగన (నూనె స్నానం) రోజున, భోజనం తర్వాత చేయించుకోరాదు.'),
  t('Not just before a journey.', 'ప్రయాణానికి ముందు చేయించుకోరాదు.'),
  t('Father and son, or brothers, not on the same day.', 'తండ్రీ కొడుకులు, అన్నదమ్ములు ఒకే రోజు చేయించుకోరాదు.'),
  t('Never cut your own hair or shave yourself; a barber should do it.', 'స్వయంగా క్షౌరం చేసుకోరాదు; క్షురకుని చేతనే చేయించుకోవాలి.'),
  t('Bathe right after.', 'క్షౌరం అయిన వెంటనే స్నానం చేయాలి.'),
  t('Wear the yajnopaveetam as niveeta (like a mala).', 'యజ్ఞోపవీతాన్ని నివీతంగా (మాల వలె) ధరించాలి.'),
  t(
    'Order: right beard, left beard, moustache, armpits, head, nails last, always right side first.',
    'క్రమం: కుడి గడ్డం, ఎడమ గడ్డం, మీసం, చంకలు, తల, చివరగా గోళ్లు; ఎల్లప్పుడూ కుడి వైపు ముందు.'
  ),
  t("No nail cutting on a day that isn't good for a haircut.", 'క్షౌరానికి అనుకూలం కాని రోజున గోళ్లు కూడా కత్తిరించరాదు.'),
];
