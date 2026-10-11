// Daily Telugu panchangam (amanta, Lahiri ayanamsa) for Hyderabad, worked out
// from the Sun's and Moon's positions with astronomy-engine, so no API is needed.
// Values follow the usual Telugu calendar convention: the tithi, nakshatra, yoga
// and karana are the ones running at sunrise, with the time each one ends.
// Copy of the website's lib/panchangam.ts; keep the two in sync.

import * as Astronomy from 'astronomy-engine';

export type PanchangamLanguage = 'en' | 'te';

interface Name {
  en: string;
  te: string;
}

export interface PanchangamElement {
  name: Name;
  // When it gives way to the next one (null if it runs past tomorrow's sunrise)
  endsAt: Date | null;
  next: Name;
}

export interface Observance {
  name: Name;
  note?: Name;
}

export interface Panchangam {
  date: Date; // civil date (midnight IST)
  weekday: Name; // Tuesday / మంగళవారం
  vara: Name; // Mangala (Bhauma) / మంగళ (భౌమ)
  samvatsara: Name;
  ayana: Name;
  ritu: Name;
  masa: Name; // with "Adhika" when it applies
  isAdhikaMasa: boolean;
  paksha: Name;
  lunarDay: number; // 1-30 within the month, as Telugu calendars count it
  tithi: PanchangamElement;
  nakshatra: PanchangamElement;
  yoga: PanchangamElement;
  karana: PanchangamElement;
  sunrise: Date;
  sunset: Date;
  rahuKalam: [Date, Date];
  yamagandam: [Date, Date];
  gulikaKalam: [Date, Date];
  brahmaMuhurtam: [Date, Date];
  moon: { illumination: number; waxing: boolean };
  sankalpam: Name;
  observances: Observance[];
  location: Name;
}

export const HYDERABAD = {
  latitude: 17.385,
  longitude: 78.4867,
  name: { en: 'Hyderabad, Telangana', te: 'హైదరాబాద్, తెలంగాణ' },
};

const IST_MS = 330 * 60 * 1000;
const DAY_MS = 86400000;

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

const n = (en: string, te: string): Name => ({ en, te });

const SAMVATSARAS: Name[] = [
  n('Prabhava', 'ప్రభవ'), n('Vibhava', 'విభవ'), n('Shukla', 'శుక్ల'), n('Pramoduta', 'ప్రమోదూత'),
  n('Prajotpatti', 'ప్రజోత్పత్తి'), n('Angirasa', 'ఆంగీరస'), n('Shrimukha', 'శ్రీముఖ'), n('Bhava', 'భావ'),
  n('Yuva', 'యువ'), n('Dhatu', 'ధాత'), n('Ishvara', 'ఈశ్వర'), n('Bahudhanya', 'బహుధాన్య'),
  n('Pramathi', 'ప్రమాథి'), n('Vikrama', 'విక్రమ'), n('Vrisha', 'వృష'), n('Chitrabhanu', 'చిత్రభాను'),
  n('Svabhanu', 'స్వభాను'), n('Tarana', 'తారణ'), n('Parthiva', 'పార్థివ'), n('Vyaya', 'వ్యయ'),
  n('Sarvajit', 'సర్వజిత్'), n('Sarvadhari', 'సర్వధారి'), n('Virodhi', 'విరోధి'), n('Vikriti', 'వికృతి'),
  n('Khara', 'ఖర'), n('Nandana', 'నందన'), n('Vijaya', 'విజయ'), n('Jaya', 'జయ'),
  n('Manmatha', 'మన్మథ'), n('Durmukhi', 'దుర్ముఖి'), n('Hevilambi', 'హేవిళంబి'), n('Vilambi', 'విళంబి'),
  n('Vikari', 'వికారి'), n('Sharvari', 'శార్వరి'), n('Plava', 'ప్లవ'), n('Shubhakritu', 'శుభకృత్'),
  n('Shobhakritu', 'శోభకృత్'), n('Krodhi', 'క్రోధి'), n('Vishvavasu', 'విశ్వావసు'), n('Parabhava', 'పరాభవ'),
  n('Plavanga', 'ప్లవంగ'), n('Kilaka', 'కీలక'), n('Saumya', 'సౌమ్య'), n('Sadharana', 'సాధారణ'),
  n('Virodhikritu', 'విరోధికృత్'), n('Paridhavi', 'పరిధావి'), n('Pramadicha', 'ప్రమాదీచ'), n('Ananda', 'ఆనంద'),
  n('Rakshasa', 'రాక్షస'), n('Nala', 'నల'), n('Pingala', 'పింగళ'), n('Kalayukti', 'కాళయుక్తి'),
  n('Siddharthi', 'సిద్ధార్థి'), n('Raudri', 'రౌద్రి'), n('Durmati', 'దుర్మతి'), n('Dundubhi', 'దుందుభి'),
  n('Rudhirodgari', 'రుధిరోద్గారి'), n('Raktakshi', 'రక్తాక్షి'), n('Krodhana', 'క్రోధన'), n('Akshaya', 'అక్షయ'),
];

// Lunar months, Chaitra first
const MASAS: Name[] = [
  n('Chaitra', 'చైత్ర'), n('Vaishakha', 'వైశాఖ'), n('Jyeshtha', 'జ్యేష్ఠ'), n('Ashadha', 'ఆషాఢ'),
  n('Shravana', 'శ్రావణ'), n('Bhadrapada', 'భాద్రపద'), n('Ashvayuja', 'ఆశ్వయుజ'), n('Kartika', 'కార్తీక'),
  n('Margashira', 'మార్గశిర'), n('Pushya', 'పుష్య'), n('Magha', 'మాఘ'), n('Phalguna', 'ఫాల్గుణ'),
];

const RITUS: Name[] = [
  n('Vasanta', 'వసంత'), n('Grishma', 'గ్రీష్మ'), n('Varsha', 'వర్ష'),
  n('Sharad', 'శరత్'), n('Hemanta', 'హేమంత'), n('Shishira', 'శిశిర'),
];

// Sidereal signs, Mesha first
const RASHIS: Name[] = [
  n('Mesha', 'మేష'), n('Vrishabha', 'వృషభ'), n('Mithuna', 'మిథున'), n('Karkataka', 'కర్కాటక'),
  n('Simha', 'సింహ'), n('Kanya', 'కన్యా'), n('Tula', 'తులా'), n('Vrischika', 'వృశ్చిక'),
  n('Dhanus', 'ధనుస్'), n('Makara', 'మకర'), n('Kumbha', 'కుంభ'), n('Meena', 'మీన'),
];

// Tithis within a paksha, Pratipada first; index 14 is Purnima or Amavasya
const TITHIS: Name[] = [
  n('Pratipada', 'పాడ్యమి'), n('Dvitiya', 'విదియ'), n('Tritiya', 'తదియ'), n('Chaturthi', 'చవితి'),
  n('Panchami', 'పంచమి'), n('Shashthi', 'షష్ఠి'), n('Saptami', 'సప్తమి'), n('Ashtami', 'అష్టమి'),
  n('Navami', 'నవమి'), n('Dashami', 'దశమి'), n('Ekadashi', 'ఏకాదశి'), n('Dvadashi', 'ద్వాదశి'),
  n('Trayodashi', 'త్రయోదశి'), n('Chaturdashi', 'చతుర్దశి'),
];
// Sanskrit forms for the sankalpam
const SANKALPA_TITHIS: string[] = [
  'ప్రతిపత్', 'ద్వితీయా', 'తృతీయా', 'చతుర్థీ', 'పంచమీ', 'షష్ఠీ', 'సప్తమీ', 'అష్టమీ',
  'నవమీ', 'దశమీ', 'ఏకాదశీ', 'ద్వాదశీ', 'త్రయోదశీ', 'చతుర్దశీ', 'పూర్ణిమా', 'అమావాస్యా',
];
const PURNIMA = n('Purnima', 'పౌర్ణమి');
const AMAVASYA = n('Amavasya', 'అమావాస్య');

const NAKSHATRAS: Name[] = [
  n('Ashvini', 'అశ్వినీ'), n('Bharani', 'భరణీ'), n('Krittika', 'కృత్తికా'), n('Rohini', 'రోహిణీ'),
  n('Mrigashira', 'మృగశిరా'), n('Ardra', 'ఆర్ద్రా'), n('Punarvasu', 'పునర్వసూ'), n('Pushya', 'పుష్యమీ'),
  n('Ashlesha', 'ఆశ్లేషా'), n('Magha', 'మఘా'), n('Purva Phalguni', 'పూర్వఫల్గునీ'), n('Uttara Phalguni', 'ఉత్తరఫల్గునీ'),
  n('Hasta', 'హస్తా'), n('Chitra', 'చిత్రా'), n('Svati', 'స్వాతీ'), n('Vishakha', 'విశాఖా'),
  n('Anuradha', 'అనూరాధా'), n('Jyeshtha', 'జ్యేష్ఠా'), n('Mula', 'మూలా'), n('Purva Ashadha', 'పూర్వాషాఢా'),
  n('Uttara Ashadha', 'ఉత్తరాషాఢా'), n('Shravana', 'శ్రవణా'), n('Dhanishtha', 'ధనిష్ఠా'), n('Shatabhisha', 'శతభిషా'),
  n('Purva Bhadrapada', 'పూర్వాభాద్రా'), n('Uttara Bhadrapada', 'ఉత్తరాభాద్రా'), n('Revati', 'రేవతీ'),
];

const YOGAS: Name[] = [
  n('Vishkambha', 'విష్కంభ'), n('Priti', 'ప్రీతి'), n('Ayushman', 'ఆయుష్మాన్'), n('Saubhagya', 'సౌభాగ్య'),
  n('Shobhana', 'శోభన'), n('Atiganda', 'అతిగండ'), n('Sukarma', 'సుకర్మ'), n('Dhriti', 'ధృతి'),
  n('Shula', 'శూల'), n('Ganda', 'గండ'), n('Vriddhi', 'వృద్ధి'), n('Dhruva', 'ధ్రువ'),
  n('Vyaghata', 'వ్యాఘాత'), n('Harshana', 'హర్షణ'), n('Vajra', 'వజ్ర'), n('Siddhi', 'సిద్ధి'),
  n('Vyatipata', 'వ్యతీపాత'), n('Variyan', 'వరీయాన్'), n('Parigha', 'పరిఘ'), n('Shiva', 'శివ'),
  n('Siddha', 'సిద్ధ'), n('Sadhya', 'సాధ్య'), n('Shubha', 'శుభ'), n('Shukla', 'శుక్ల'),
  n('Brahma', 'బ్రహ్మ'), n('Indra', 'ఐంద్ర'), n('Vaidhriti', 'వైధృతి'),
];

const MOVABLE_KARANAS: Name[] = [
  n('Bava', 'బవ'), n('Balava', 'బాలవ'), n('Kaulava', 'కౌలవ'), n('Taitila', 'తైతిల'),
  n('Garaja', 'గరజ'), n('Vanija', 'వణిజ'), n('Vishti', 'విష్టి'),
];

// Sunday first: day name, sankalpam name, presiding deity
const WEEKDAYS: Name[] = [
  n('Sunday', 'ఆదివారం'), n('Monday', 'సోమవారం'), n('Tuesday', 'మంగళవారం'), n('Wednesday', 'బుధవారం'),
  n('Thursday', 'గురువారం'), n('Friday', 'శుక్రవారం'), n('Saturday', 'శనివారం'),
];
const VARAS: Name[] = [
  n('Bhanu', 'భాను'), n('Soma (Indu)', 'సోమ (ఇందు)'), n('Mangala (Bhauma)', 'మంగళ (భౌమ)'),
  n('Budha (Saumya)', 'బుధ (సౌమ్య)'), n('Guru (Brihaspati)', 'గురు (బృహస్పతి)'),
  n('Shukra (Bhrigu)', 'శుక్ర (భృగు)'), n('Shani (Sthira)', 'శని (స్థిర)'),
];
const SANKALPA_VARAS: Name[] = [
  n('Bhanu', 'భాను'), n('Indu', 'ఇందు'), n('Bhauma', 'భౌమ'), n('Saumya', 'సౌమ్య'),
  n('Guru', 'గురు'), n('Bhrigu', 'భృగు'), n('Sthira', 'స్థిర'),
];
const DAY_DEVOTION: Name[] = [
  n('Surya Narayana puja', 'సూర్యనారాయణ ఆరాధన'),
  n('Lord Shiva puja (abhishekam)', 'శివారాధన (అభిషేకం)'),
  n('Hanuman and Subrahmanya puja', 'హనుమాన్, సుబ్రహ్మణ్య ఆరాధన'),
  n('Lord Ganesha puja', 'గణపతి ఆరాధన'),
  n('Guru and Dattatreya puja', 'గురు, దత్తాత్రేయ ఆరాధన'),
  n('Lakshmi and Devi puja', 'లక్ష్మీ, అమ్మవారి ఆరాధన'),
  n('Sri Venkateswara puja', 'శ్రీ వేంకటేశ్వర ఆరాధన'),
];

// Which eighth of the daytime (1-8) each period falls in, Sunday first
const RAHU_PART = [8, 2, 7, 5, 6, 4, 3];
const YAMA_PART = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_PART = [7, 6, 5, 4, 3, 2, 1];

// ---------------------------------------------------------------------------
// Astronomy
// ---------------------------------------------------------------------------

const norm = (deg: number) => ((deg % 360) + 360) % 360;

// Lahiri (Chitrapaksha) ayanamsa, good to a few arc-seconds this century
function ayanamsa(date: Date): number {
  const years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * DAY_MS);
  return 23.85306 + (50.2788 / 3600) * years;
}

function sunLongitude(date: Date): number {
  return Astronomy.SunPosition(date).elon;
}

function moonLongitude(date: Date): number {
  return Astronomy.EclipticGeoMoon(date).lon;
}

const elongation = (date: Date) => norm(moonLongitude(date) - sunLongitude(date));
const siderealSun = (date: Date) => norm(sunLongitude(date) - ayanamsa(date));
const siderealMoon = (date: Date) => norm(moonLongitude(date) - ayanamsa(date));
const yogaAngle = (date: Date) => norm(siderealSun(date) + siderealMoon(date));

// First moment after `start` when the steadily increasing angle `f` reaches
// `target` (degrees), searching at most `limitHours`.
function findCrossing(f: (d: Date) => number, target: number, start: Date, limitHours = 40): Date | null {
  const gap = (d: Date) => norm(target - f(d));
  let lo = start.getTime();
  let gapLo = gap(start);
  const step = 30 * 60 * 1000;
  for (let t = lo + step; t <= lo + limitHours * 3600000; t += step) {
    const g = gap(new Date(t));
    // Gap shrinks to zero then jumps back to ~360 once the target is passed
    if (g > gapLo + 180) {
      let a = t - step;
      let b = t;
      while (b - a > 20000) {
        const mid = (a + b) / 2;
        if (gap(new Date(mid)) > 180) b = mid;
        else a = mid;
      }
      return new Date(b);
    }
    gapLo = g;
    lo = t;
  }
  return null;
}

function riseSet(direction: 1 | -1, from: Date): Date {
  const observer = new Astronomy.Observer(HYDERABAD.latitude, HYDERABAD.longitude, 500);
  const t = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, direction, from, 1);
  // Hyderabad always has a sunrise and sunset; fall back to 6 AM / 6 PM just in case
  return t ? t.date : new Date(from.getTime() + (direction === 1 ? 6 : 18) * 3600000);
}

// ---------------------------------------------------------------------------
// Element names
// ---------------------------------------------------------------------------

function tithiName(index: number): Name {
  if (index === 14) return PURNIMA;
  if (index === 29) return AMAVASYA;
  return TITHIS[index % 15];
}

function tithiWithPaksha(index: number): Name {
  const t = tithiName(index);
  if (index === 14 || index === 29) return t;
  return index < 15 ? n(`Shukla ${t.en}`, `శుక్ల ${t.te}`) : n(`Krishna ${t.en}`, `కృష్ణ ${t.te}`);
}

function sankalpaTithi(index: number): Name {
  const en = index === 14 ? 'Purnima' : index === 29 ? 'Amavasya' : TITHIS[index % 15].en;
  const te = index === 14 ? SANKALPA_TITHIS[14] : index === 29 ? SANKALPA_TITHIS[15] : SANKALPA_TITHIS[index % 15];
  return { en, te };
}

function karanaName(index: number): Name {
  if (index === 0) return n('Kimstughna', 'కింస్తుఘ్న');
  if (index === 57) return n('Shakuni', 'శకుని');
  if (index === 58) return n('Chatushpada', 'చతుష్పాద');
  if (index === 59) return n('Naga', 'నాగ');
  return MOVABLE_KARANAS[(index - 1) % 7];
}

function element(
  f: (d: Date) => number,
  span: number,
  count: number,
  name: (i: number) => Name,
  sunrise: Date,
  nextSunrise: Date
): PanchangamElement {
  const index = Math.floor(f(sunrise) / span) % count;
  const next = (index + 1) % count;
  const endsAt = findCrossing(f, (next * span) % 360, sunrise);
  return {
    name: name(index),
    endsAt: endsAt && endsAt < nextSunrise ? endsAt : null,
    next: name(next),
  };
}

// ---------------------------------------------------------------------------
// Festivals and observances
// ---------------------------------------------------------------------------

// When in the day a festival's tithi must be running: sunrise for most,
// midday (Vinayaka Chavithi, Rama Navami), afternoon (Vijayadashami),
// dusk (Pradosham, Deepavali) or midnight (Janmashtami, Shivaratri)
type Kala = 'sunrise' | 'midday' | 'afternoon' | 'dusk' | 'midnight';

interface TithiRule {
  masa: number | null; // 0 = Chaitra; null for every month
  tithi: number; // 0-29, Shukla Pratipada first
  kala: Kala;
  name: Name;
  note?: Name;
}

const rule = (masa: number | null, tithi: number, kala: Kala, name: Name, note?: Name): TithiRule => ({
  masa,
  tithi,
  kala,
  name,
  note,
});

const UGADI = n('Ugadi – Telugu New Year', 'ఉగాది – తెలుగు సంవత్సరాది');

const FESTIVALS: TithiRule[] = [
  rule(0, 0, 'sunrise', UGADI),
  rule(0, 8, 'midday', n('Sri Rama Navami', 'శ్రీరామ నవమి')),
  rule(1, 2, 'sunrise', n('Akshaya Tritiya', 'అక్షయ తృతీయ')),
  rule(1, 4, 'sunrise', n('Adi Shankaracharya Jayanti', 'శ్రీ ఆది శంకరాచార్య జయంతి')),
  rule(1, 13, 'dusk', n('Sri Narasimha Jayanti', 'శ్రీ నృసింహ జయంతి')),
  rule(1, 24, 'sunrise', n('Hanuman Jayanti', 'హనుమాన్ జయంతి')),
  rule(3, 10, 'sunrise', n('Tholi Ekadashi (Shayana Ekadashi)', 'తొలి ఏకాదశి (శయన ఏకాదశి)')),
  rule(3, 14, 'sunrise', n('Guru Purnima (Vyasa Purnima)', 'గురు పౌర్ణమి (వ్యాస పౌర్ణమి)')),
  rule(4, 4, 'sunrise', n('Naga Panchami', 'నాగ పంచమి')),
  rule(4, 14, 'sunrise', n('Shravana Purnima – Yajur Upakarma, Raksha Bandhan', 'శ్రావణ పౌర్ణమి – యజుర్ ఉపాకర్మ, రాఖీ పౌర్ణమి')),
  rule(4, 15, 'sunrise', n('Gayatri Japam', 'గాయత్రీ జపం')),
  rule(4, 22, 'midnight', n('Sri Krishna Janmashtami', 'శ్రీ కృష్ణ జన్మాష్టమి')),
  rule(5, 3, 'midday', n('Vinayaka Chavithi', 'వినాయక చవితి')),
  rule(5, 13, 'sunrise', n('Ananta Chaturdashi', 'అనంత చతుర్దశి')),
  rule(5, 29, 'sunrise', n('Mahalaya Amavasya', 'మహాలయ అమావాస్య')),
  rule(6, 0, 'sunrise', n('Devi Navaratri begins, Bathukamma', 'దేవీ నవరాత్రులు ప్రారంభం, బతుకమ్మ')),
  rule(6, 7, 'sunrise', n('Durgashtami', 'దుర్గాష్టమి')),
  rule(6, 8, 'sunrise', n('Maharnavami', 'మహర్నవమి')),
  rule(6, 9, 'afternoon', n('Vijayadashami (Dasara)', 'విజయదశమి (దసరా)')),
  rule(6, 28, 'sunrise', n('Naraka Chaturdashi', 'నరక చతుర్దశి')),
  rule(6, 29, 'dusk', n('Deepavali', 'దీపావళి')),
  rule(7, 0, 'sunrise', n('Kartika Masam begins', 'కార్తీక మాసం ప్రారంభం')),
  rule(7, 11, 'sunrise', n('Kshirabdi Dvadashi', 'క్షీరాబ్ది ద్వాదశి')),
  rule(7, 14, 'dusk', n('Kartika Purnima', 'కార్తీక పౌర్ణమి')),
  rule(8, 5, 'sunrise', n('Subrahmanya Shashthi', 'సుబ్రహ్మణ్య షష్ఠి')),
  rule(8, 10, 'sunrise', n('Gita Jayanti', 'గీతా జయంతి')),
  rule(8, 14, 'dusk', n('Sri Dattatreya Jayanti', 'శ్రీ దత్తాత్రేయ జయంతి')),
  rule(10, 4, 'sunrise', n('Vasanta Panchami (Sri Panchami)', 'వసంత పంచమి (శ్రీ పంచమి)')),
  rule(10, 6, 'sunrise', n('Ratha Saptami', 'రథ సప్తమి')),
  rule(10, 7, 'midday', n('Bhishma Ashtami', 'భీష్మాష్టమి')),
  rule(10, 28, 'midnight', n('Maha Shivaratri', 'మహా శివరాత్రి')),
  rule(11, 14, 'dusk', n('Holi (Kamuni Punnami)', 'హోళీ (కాముని పున్నమి)')),
];

// Observed every month
const MONTHLY: TithiRule[] = [
  rule(null, 3, 'midday', n('Vinayaka Chaturthi', 'వినాయక చతుర్థి')),
  rule(null, 18, 'dusk', n('Sankashti Chaturthi', 'సంకష్టహర చతుర్థి')),
  rule(null, 5, 'sunrise', n('Skanda Shashthi', 'స్కంద షష్ఠి')),
  ...[10, 25].map((t) =>
    rule(null, t, 'sunrise', n('Ekadashi – upavasam (fasting)', 'ఏకాదశి – ఉపవాసం'), n('Vishnu puja and Vishnu Sahasranama parayanam', 'విష్ణు పూజ, విష్ణు సహస్రనామ పారాయణం'))
  ),
  ...[12, 27].map((t) => rule(null, t, 'dusk', n('Pradosham', 'ప్రదోషం'), n('Shiva puja at dusk', 'సాయంకాలం శివారాధన'))),
  rule(null, 28, 'midnight', n('Masa Shivaratri', 'మాస శివరాత్రి')),
  rule(null, 14, 'sunrise', n('Purnima', 'పౌర్ణమి'), n('Satyanarayana vratam', 'సత్యనారాయణ వ్రతం')),
  rule(null, 29, 'sunrise', n('Amavasya', 'అమావాస్య'), n('Pitru tarpanam', 'పితృ తర్పణం')),
];

const tithiAt = (date: Date) => Math.floor(elongation(date) / 12);

interface DayTimes {
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
}

function kalaTime(kala: Kala, t: DayTimes): Date {
  const day = t.sunset.getTime() - t.sunrise.getTime();
  const night = t.nextSunrise.getTime() - t.sunset.getTime();
  switch (kala) {
    case 'sunrise':
      return t.sunrise;
    case 'midday':
      return new Date(t.sunrise.getTime() + day / 2);
    case 'afternoon':
      return new Date(t.sunrise.getTime() + day * 0.7);
    case 'dusk':
      return new Date(t.sunset.getTime() + 60 * 60000);
    case 'midnight':
      return new Date(t.sunset.getTime() + night / 2);
  }
}

// Whether a festival's tithi falls on this day: running at its time of day
// (and not already yesterday at that time). A tithi that is never running at
// that time of day (it starts and ends in between) is kept on the day whose
// sunrise it covers, or else on the day it begins.
function tithiFallsToday(tithi: number, kala: Kala, t: DayTimes): boolean {
  const at = kalaTime(kala, t);
  const before = (tithi + 29) % 30;
  const after = (tithi + 1) % 30;
  const now = tithiAt(at);
  const yesterday = tithiAt(new Date(at.getTime() - DAY_MS));
  if (now === tithi) return yesterday !== tithi;
  if (now === after && yesterday === before) return tithiAt(t.sunrise) === tithi && t.sunrise < at;
  if (now === before && tithiAt(new Date(at.getTime() + DAY_MS)) === after) {
    return !(tithiAt(t.nextSunrise) === tithi && t.nextSunrise.getTime() < at.getTime() + DAY_MS);
  }
  return false;
}

interface ObservanceContext extends DayTimes {
  masa: number;
  adhika: boolean;
  tithi: number; // at sunrise
  weekday: number;
  sunRashi: number; // at sunrise
}

function observancesFor(c: ObservanceContext): Observance[] {
  const out: Observance[] = [];
  const add = (name: Name, note?: Name) => out.push(note ? { name, note } : { name });

  // Festivals are not kept in an Adhika month
  const festivalTithis = new Set<number>();
  for (const f of c.adhika ? MONTHLY : [...FESTIVALS, ...MONTHLY]) {
    // Vinayaka Chavithi and Maha Shivaratri replace the monthly Chaturthi and Shivaratri
    if (f.masa === null && (f.tithi === 3 || f.tithi === 28) && festivalTithis.has(f.tithi)) continue;
    // An early tithi that falls today while sunrise is still at the month's end belongs to the next month
    const masa = f.tithi + 15 < c.tithi ? (c.masa + 1) % 12 : c.masa;
    if (f.masa !== null && f.masa !== masa) continue;
    if (!tithiFallsToday(f.tithi, f.kala, c)) continue;
    if (f.masa !== null) festivalTithis.add(f.tithi);
    add(f.name, f.note);
  }

  // The Sun entering a new sign; one that happens after sunset is kept the next day
  const rashiAtSunset = (d: Date) => Math.floor(siderealSun(d) / 30);
  const before = rashiAtSunset(new Date(c.sunset.getTime() - DAY_MS));
  const after = rashiAtSunset(c.sunset);
  if (before !== after) {
    const r = RASHIS[after];
    if (after === 9) add(n('Makara Sankranti', 'మకర సంక్రాంతి'));
    else add(n(`${r.en} Sankranti`, `${r.te} సంక్రమణం`));
  }

  // Vaikuntha (Mukkoti) Ekadashi is the Shukla Ekadashi while the Sun is in Dhanus
  if (c.sunRashi === 8 && tithiFallsToday(10, 'sunrise', c)) {
    add(n('Vaikuntha Ekadashi (Mukkoti Ekadashi)', 'వైకుంఠ ఏకాదశి (ముక్కోటి ఏకాదశి)'));
  }

  if (!c.adhika) {
    if (c.masa === 5 && c.tithi >= 15 && c.tithi < 29) {
      add(n('Mahalaya Paksham', 'మహాలయ పక్షం'), n('Pitru tarpanam for ancestors', 'పితృదేవతలకు తర్పణం'));
    }
    if (c.masa === 7 && c.weekday === 1) add(n('Kartika Somavaram', 'కార్తీక సోమవారం'));
    if (c.masa === 4 && c.weekday === 5) {
      // Varalakshmi Vratam is the Friday just before Shravana Purnima
      if (c.tithi >= 7 && c.tithi <= 13) add(n('Varalakshmi Vratam', 'వరలక్ష్మీ వ్రతం'));
      else add(n('Shravana Shukravaram', 'శ్రావణ శుక్రవారం'));
    }
    if (c.masa === 4 && c.weekday === 2) add(n('Mangala Gauri Vratam', 'మంగళ గౌరీ వ్రతం'));
  }
  if (c.sunRashi === 8) add(n('Dhanurmasam – Tiruppavai', 'ధనుర్మాసం – తిరుప్పావై'));

  add(n('Sandhyavandanam and Gayatri japam', 'సంధ్యావందనం, గాయత్రీ జపం'));
  add(DAY_DEVOTION[c.weekday]);
  return out;
}

// ---------------------------------------------------------------------------
// Sankalpam
// ---------------------------------------------------------------------------

function sankalpam(p: {
  samvatsara: Name;
  ayana: Name;
  ritu: Name;
  masa: Name;
  paksha: Name;
  tithi: Name;
  vara: Name;
  nakshatra: Name;
  yoga: Name;
  karana: Name;
  uttarayana: boolean;
}): Name {
  const te = [
    'జంబూ ద్వీపే, భరత వర్షే, భరత ఖండే, మేరోః దక్షిణ దిగ్భాగే,',
    'శ్రీశైలస్య వాయవ్య ప్రదేశే, కృష్ణా గోదావర్యోః మధ్య ప్రదేశే,',
    `ప్రభవాది షష్టి సంవత్సరాణాం మధ్యే, శ్రీ ${p.samvatsara.te} నామ సంవత్సరే,`,
    `${p.uttarayana ? 'ఉత్తరాయణే' : 'దక్షిణాయనే'}, ${p.ritu.te} ఋతౌ, ${p.masa.te} మాసే, ${p.paksha.te} పక్షే,`,
    `${p.tithi.te} తిథౌ, ${p.vara.te} వాసరే, ${p.nakshatra.te} నక్షత్రే,`,
    `${p.yoga.te} యోగే, ${p.karana.te} కరణే,`,
    'ఏవంగుణ విశేషణ విశిష్టాయాం శుభ తిథౌ...',
  ].join(' ');
  const en = [
    "Jambudvipe, Bharata varshe, Bharata khande, Meroh dakshina digbhage,",
    'Srishailasya vayavya pradeshe, Krishna Godavaryoh madhya pradeshe,',
    `Prabhavadi shashti samvatsaranam madhye, Sri ${p.samvatsara.en} nama samvatsare,`,
    `${p.uttarayana ? 'Uttarayane' : 'Dakshinayane'}, ${p.ritu.en} ritau, ${p.masa.en} mase, ${p.paksha.en} pakshe,`,
    `${p.tithi.en} tithau, ${p.vara.en} vasare, ${p.nakshatra.en} nakshatre,`,
    `${p.yoga.en} yoge, ${p.karana.en} karane,`,
    'evamguna visheshana vishishtayam shubha tithau...',
  ].join(' ');
  return { en, te };
}

// ---------------------------------------------------------------------------
// The day's panchangam
// ---------------------------------------------------------------------------

// Year, month (0-11) and day of `now` in India
export function istDateOf(now: Date): { year: number; month: number; day: number } {
  const ist = new Date(now.getTime() + IST_MS);
  return { year: ist.getUTCFullYear(), month: ist.getUTCMonth(), day: ist.getUTCDate() };
}

export function computePanchangam(now: Date = new Date()): Panchangam {
  const { year, month, day } = istDateOf(now);
  const midnight = new Date(Date.UTC(year, month, day) - IST_MS);
  const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();

  const sunrise = riseSet(1, midnight);
  const sunset = riseSet(-1, sunrise);
  const nextSunrise = riseSet(1, new Date(midnight.getTime() + DAY_MS));

  // Lunar month: named from the Sun's sign at the new moon that began it (amanta);
  // a month with no sankranti in it is Adhika
  const prevNewMoon = Astronomy.SearchMoonPhase(0, sunrise, -35)!.date;
  const nextNewMoon = Astronomy.SearchMoonPhase(0, sunrise, 35)!.date;
  const rashiAtStart = Math.floor(siderealSun(prevNewMoon) / 30);
  const rashiAtEnd = Math.floor(siderealSun(nextNewMoon) / 30);
  const masaIndex = (rashiAtStart + 1) % 12;
  const adhika = rashiAtStart === rashiAtEnd;

  const tithiIndex = Math.floor(elongation(sunrise) / 12);
  const shukla = tithiIndex < 15;

  const sunSid = siderealSun(sunrise);
  const uttarayana = sunSid >= 270 || sunSid < 90;
  const sunRashi = Math.floor(sunSid / 30);

  const observances = observancesFor({
    masa: masaIndex,
    adhika,
    tithi: tithiIndex,
    weekday,
    sunRashi,
    sunrise,
    sunset,
    nextSunrise,
  });

  // Shaka year changes at Ugadi; Magha and Phalguna in early-year months belong to the old year
  const isUgadi = observances.some((o) => o.name === UGADI);
  const shaka = !isUgadi && (month < 2 || (month < 5 && masaIndex >= 10)) ? year - 79 : year - 78;
  const samvatsara = SAMVATSARAS[(shaka + 11) % 60];


  const masa = adhika ? n(`Adhika ${MASAS[masaIndex].en}`, `అధిక ${MASAS[masaIndex].te}`) : MASAS[masaIndex];
  const ritu = RITUS[Math.floor(masaIndex / 2)];
  const paksha = shukla ? n('Shukla', 'శుక్ల') : n('Krishna', 'కృష్ణ');
  const ayana = uttarayana ? n('Uttarayana', 'ఉత్తరాయణం') : n('Dakshinayana', 'దక్షిణాయనం');

  const tithi = element(elongation, 12, 30, tithiWithPaksha, sunrise, nextSunrise);
  const nakshatra = element(siderealMoon, 360 / 27, 27, (i) => NAKSHATRAS[i], sunrise, nextSunrise);
  const yoga = element(yogaAngle, 360 / 27, 27, (i) => YOGAS[i], sunrise, nextSunrise);
  const karana = element(elongation, 6, 60, karanaName, sunrise, nextSunrise);

  // Daytime split into eight parts for Rahu kalam, Yamagandam and Gulika
  const part = (sunset.getTime() - sunrise.getTime()) / 8;
  const slot = (k: number): [Date, Date] => [
    new Date(sunrise.getTime() + (k - 1) * part),
    new Date(sunrise.getTime() + k * part),
  ];

  const phase = Astronomy.MoonPhase(sunrise);
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, sunrise).phase_fraction;

  return {
    date: midnight,
    weekday: WEEKDAYS[weekday],
    vara: VARAS[weekday],
    samvatsara,
    ayana,
    ritu,
    masa,
    isAdhikaMasa: adhika,
    paksha,
    lunarDay: tithiIndex + 1,
    tithi,
    nakshatra,
    yoga,
    karana,
    sunrise,
    sunset,
    rahuKalam: slot(RAHU_PART[weekday]),
    yamagandam: slot(YAMA_PART[weekday]),
    gulikaKalam: slot(GULIKA_PART[weekday]),
    brahmaMuhurtam: [new Date(sunrise.getTime() - 96 * 60000), new Date(sunrise.getTime() - 48 * 60000)],
    moon: { illumination, waxing: phase < 180 },
    sankalpam: sankalpam({
      samvatsara,
      ayana,
      ritu,
      masa,
      paksha,
      tithi: sankalpaTithi(tithiIndex),
      vara: SANKALPA_VARAS[weekday],
      nakshatra: nakshatra.name,
      yoga: yoga.name,
      karana: karana.name,
      uttarayana,
    }),
    observances,
    location: HYDERABAD.name,
  };
}

// "6:12 AM" in India time, whatever the device's time zone
export function formatIstTime(date: Date): string {
  const ist = new Date(date.getTime() + IST_MS);
  let h = ist.getUTCHours();
  const m = ist.getUTCMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_TE = ['జన', 'ఫిబ్ర', 'మార్చి', 'ఏప్రి', 'మే', 'జూన్', 'జూలై', 'ఆగ', 'సెప్టెం', 'అక్టో', 'నవం', 'డిసెం'];

export function shortMonth(date: Date, language: PanchangamLanguage): string {
  const { month } = istDateOf(date);
  return language === 'en' ? MONTHS_EN[month] : MONTHS_TE[month];
}

export function formatIstRange([a, b]: [Date, Date]): string {
  return `${formatIstTime(a)} – ${formatIstTime(b)}`;
}

// Labels for the panchangam card on the website and in the app
export const PANCHANGAM_LABELS = {
  en: {
    title: 'Sankalpam',
    today: "Today's Panchangam",
    samvatsara: 'Samvatsaram',
    ayana: 'Ayanam',
    ritu: 'Ruthuvu',
    masa: 'Masam',
    paksha: 'Paksham',
    tithi: 'Tithi',
    nakshatra: 'Nakshatram',
    yoga: 'Yogam',
    karana: 'Karanam',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    rahu: 'Rahu kalam',
    yama: 'Yamagandam',
    gulika: 'Gulika kalam',
    brahma: 'Brahma muhurtam',
    observances: 'Observances and sadhana for today',
    till: 'till',
    nextDay: '(next day)',
    allDay: 'all day',
    more: 'Read full sankalpam',
    less: 'Show less',
    info:
      'A sankalpam is the resolve recited before a puja, homam or japam. It names the place and the exact moment in the Hindu calendar: year, ayana, season, month, fortnight, tithi, weekday, nakshatra, yoga and karana.',
    method: 'Calculated for sunrise at Hyderabad (Lahiri ayanamsa, amanta months).',
  },
  te: {
    title: 'సంకల్పం',
    today: 'నేటి పంచాంగం',
    samvatsara: 'సంవత్సరం',
    ayana: 'అయనం',
    ritu: 'ఋతువు',
    masa: 'మాసం',
    paksha: 'పక్షం',
    tithi: 'తిథి',
    nakshatra: 'నక్షత్రం',
    yoga: 'యోగం',
    karana: 'కరణం',
    sunrise: 'సూర్యోదయం',
    sunset: 'సూర్యాస్తమయం',
    rahu: 'రాహుకాలం',
    yama: 'యమగండం',
    gulika: 'గుళిక కాలం',
    brahma: 'బ్రహ్మ ముహూర్తం',
    observances: 'నేటి పర్వదినాలు, సాధన',
    till: '',
    nextDay: '(మరుసటి రోజు)',
    allDay: 'రోజంతా',
    more: 'పూర్తి సంకల్పం చూడండి',
    less: 'తక్కువ చూపించు',
    info:
      'పూజ, హోమం లేదా జపం ప్రారంభంలో చెప్పుకునే సంకల్ప వాక్యమే సంకల్పం. ఇది ప్రదేశాన్ని, హిందూ కాలమానం ప్రకారం సంవత్సరం, అయనం, ఋతువు, మాసం, పక్షం, తిథి, వారం, నక్షత్రం, యోగం, కరణాలను తెలియజేస్తుంది.',
    method: 'హైదరాబాద్ సూర్యోదయం ఆధారంగా లెక్కించబడింది (లాహిరి అయనాంశ, అమాంత మాసాలు).',
  },
};

// "till 9:31 PM" / "9:31 PM వరకు", marking times after midnight
export function untilText(el: PanchangamElement, p: Panchangam, language: PanchangamLanguage): string {
  const L = PANCHANGAM_LABELS[language];
  if (!el.endsAt) return L.allDay;
  const time = formatIstTime(el.endsAt);
  const nextDay = el.endsAt.getTime() >= p.date.getTime() + 86400000 ? ` ${L.nextDay}` : '';
  return language === 'en' ? `${L.till} ${time}${nextDay}` : `${time}${nextDay} వరకు`;
}
