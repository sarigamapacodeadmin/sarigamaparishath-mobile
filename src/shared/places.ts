// Places members can pick for their birth place and home city, with the
// coordinates the panchangam needs. All are in India (time zone Asia/Kolkata).
// Copy of the website's lib/places.ts; keep the two in sync.

export interface Place {
  en: string;
  te: string;
  state: { en: string; te: string };
  latitude: number;
  longitude: number;
  timeZone: string;
  aliases?: string[];
}

const IST = 'Asia/Kolkata';

const S = {
  ap: { en: 'Andhra Pradesh', te: 'ఆంధ్రప్రదేశ్' },
  tg: { en: 'Telangana', te: 'తెలంగాణ' },
  ka: { en: 'Karnataka', te: 'కర్ణాటక' },
  tn: { en: 'Tamil Nadu', te: 'తమిళనాడు' },
  mh: { en: 'Maharashtra', te: 'మహారాష్ట్ర' },
  dl: { en: 'Delhi', te: 'ఢిల్లీ' },
  wb: { en: 'West Bengal', te: 'పశ్చిమ బెంగాల్' },
  gj: { en: 'Gujarat', te: 'గుజరాత్' },
  up: { en: 'Uttar Pradesh', te: 'ఉత్తరప్రదేశ్' },
  od: { en: 'Odisha', te: 'ఒడిశా' },
  kl: { en: 'Kerala', te: 'కేరళ' },
  cg: { en: 'Chhattisgarh', te: 'ఛత్తీస్‌గఢ్' },
  rj: { en: 'Rajasthan', te: 'రాజస్థాన్' },
  uk: { en: 'Uttarakhand', te: 'ఉత్తరాఖండ్' },
  as: { en: 'Assam', te: 'అస్సాం' },
  br: { en: 'Bihar', te: 'బిహార్' },
  mp: { en: 'Madhya Pradesh', te: 'మధ్యప్రదేశ్' },
  ga: { en: 'Goa', te: 'గోవా' },
};

const p = (en: string, te: string, state: Place['state'], latitude: number, longitude: number, aliases?: string[]): Place => ({
  en,
  te,
  state,
  latitude,
  longitude,
  timeZone: IST,
  ...(aliases ? { aliases } : {}),
});

export const PLACES: Place[] = [
  // Telangana
  p('Hyderabad', 'హైదరాబాద్', S.tg, 17.385, 78.4867),
  p('Secunderabad', 'సికింద్రాబాద్', S.tg, 17.4399, 78.4983),
  p('Warangal', 'వరంగల్', S.tg, 17.9689, 79.5941, ['Hanamkonda']),
  p('Karimnagar', 'కరీంనగర్', S.tg, 18.4386, 79.1288),
  p('Nizamabad', 'నిజామాబాద్', S.tg, 18.6725, 78.0941),
  p('Khammam', 'ఖమ్మం', S.tg, 17.2473, 80.1514),
  p('Mahbubnagar', 'మహబూబ్‌నగర్', S.tg, 16.7375, 77.9855, ['Mahabubnagar', 'Palamuru']),
  p('Nalgonda', 'నల్గొండ', S.tg, 17.0575, 79.2671),
  p('Adilabad', 'ఆదిలాబాద్', S.tg, 19.6641, 78.532),
  p('Nirmal', 'నిర్మల్', S.tg, 19.0964, 78.3428),
  p('Siddipet', 'సిద్దిపేట', S.tg, 18.1018, 78.852),
  p('Suryapet', 'సూర్యాపేట', S.tg, 17.1405, 79.6236),
  p('Ramagundam', 'రామగుండం', S.tg, 18.755, 79.474),
  p('Bhadrachalam', 'భద్రాచలం', S.tg, 17.6688, 80.8936),
  p('Medak', 'మెదక్', S.tg, 18.0453, 78.2608),
  p('Sangareddy', 'సంగారెడ్డి', S.tg, 17.614, 78.0816),
  // Andhra Pradesh
  p('Visakhapatnam', 'విశాఖపట్నం', S.ap, 17.6868, 83.2185, ['Vizag', 'Vishakhapatnam', 'Waltair']),
  p('Vijayawada', 'విజయవాడ', S.ap, 16.5062, 80.648, ['Bezawada']),
  p('Guntur', 'గుంటూరు', S.ap, 16.3067, 80.4365),
  p('Amaravati', 'అమరావతి', S.ap, 16.573, 80.3575),
  p('Tenali', 'తెనాలి', S.ap, 16.243, 80.64),
  p('Narasaraopet', 'నరసరావుపేట', S.ap, 16.2349, 80.0493),
  p('Nellore', 'నెల్లూరు', S.ap, 14.4426, 79.9865),
  p('Ongole', 'ఒంగోలు', S.ap, 15.5057, 80.0499),
  p('Tirupati', 'తిరుపతి', S.ap, 13.6288, 79.4192, ['Tirumala']),
  p('Chittoor', 'చిత్తూరు', S.ap, 13.2172, 79.1003),
  p('Kurnool', 'కర్నూలు', S.ap, 15.8281, 78.0373),
  p('Nandyal', 'నంద్యాల', S.ap, 15.4786, 78.4836),
  p('Srisailam', 'శ్రీశైలం', S.ap, 16.0726, 78.8687),
  p('Kadapa', 'కడప', S.ap, 14.4673, 78.8242, ['Cuddapah']),
  p('Proddatur', 'ప్రొద్దుటూరు', S.ap, 14.7502, 78.5481),
  p('Anantapur', 'అనంతపురం', S.ap, 14.6819, 77.6006, ['Anantapuram', 'Ananthapur']),
  p('Hindupur', 'హిందూపురం', S.ap, 13.829, 77.4911),
  p('Kakinada', 'కాకినాడ', S.ap, 16.9891, 82.2475),
  p('Rajamahendravaram', 'రాజమహేంద్రవరం', S.ap, 17.0005, 81.804, ['Rajahmundry', 'Rajamundry']),
  p('Amalapuram', 'అమలాపురం', S.ap, 16.5787, 82.0061),
  p('Eluru', 'ఏలూరు', S.ap, 16.7107, 81.0952),
  p('Bhimavaram', 'భీమవరం', S.ap, 16.5449, 81.5212),
  p('Tadepalligudem', 'తాడేపల్లిగూడెం', S.ap, 16.8138, 81.5212),
  p('Machilipatnam', 'మచిలీపట్నం', S.ap, 16.1875, 81.1389, ['Bandar', 'Masulipatnam']),
  p('Srikakulam', 'శ్రీకాకుళం', S.ap, 18.2949, 83.8938),
  p('Vizianagaram', 'విజయనగరం', S.ap, 18.1067, 83.3956),
  // Rest of India
  p('Bengaluru', 'బెంగళూరు', S.ka, 12.9716, 77.5946, ['Bangalore']),
  p('Mysuru', 'మైసూరు', S.ka, 12.2958, 76.6394, ['Mysore']),
  p('Ballari', 'బళ్లారి', S.ka, 15.1394, 76.9214, ['Bellary']),
  p('Sringeri', 'శృంగేరి', S.ka, 13.4198, 75.2567),
  p('Chennai', 'చెన్నై', S.tn, 13.0827, 80.2707, ['Madras']),
  p('Kanchipuram', 'కాంచీపురం', S.tn, 12.8342, 79.7036, ['Kanchi']),
  p('Hosur', 'హోసూరు', S.tn, 12.7409, 77.8253),
  p('Coimbatore', 'కోయంబత్తూరు', S.tn, 11.0168, 76.9558),
  p('Madurai', 'మదురై', S.tn, 9.9252, 78.1198),
  p('Rameswaram', 'రామేశ్వరం', S.tn, 9.2876, 79.3129),
  p('Mumbai', 'ముంబై', S.mh, 19.076, 72.8777, ['Bombay']),
  p('Pune', 'పుణె', S.mh, 18.5204, 73.8567, ['Poona']),
  p('Nagpur', 'నాగ్‌పూర్', S.mh, 21.1458, 79.0882),
  p('Delhi', 'ఢిల్లీ', S.dl, 28.6139, 77.209, ['New Delhi']),
  p('Kolkata', 'కోల్‌కతా', S.wb, 22.5726, 88.3639, ['Calcutta']),
  p('Ahmedabad', 'అహ్మదాబాద్', S.gj, 23.0225, 72.5714),
  p('Varanasi', 'వారణాసి', S.up, 25.3176, 82.9739, ['Kashi', 'Benares']),
  p('Prayagraj', 'ప్రయాగ్‌రాజ్', S.up, 25.4358, 81.8463, ['Allahabad']),
  p('Lucknow', 'లక్నో', S.up, 26.8467, 80.9462),
  p('Bhubaneswar', 'భువనేశ్వర్', S.od, 20.2961, 85.8245),
  p('Kochi', 'కొచ్చి', S.kl, 9.9312, 76.2673, ['Cochin']),
  p('Thiruvananthapuram', 'తిరువనంతపురం', S.kl, 8.5241, 76.9366, ['Trivandrum']),
  p('Raipur', 'రాయ్‌పూర్', S.cg, 21.2514, 81.6296),
  p('Jaipur', 'జైపూర్', S.rj, 26.9124, 75.7873),
  p('Haridwar', 'హరిద్వార్', S.uk, 29.9457, 78.1642),
  p('Guwahati', 'గువాహటి', S.as, 26.1445, 91.7362),
  p('Patna', 'పాట్నా', S.br, 25.5941, 85.1376),
  p('Bhopal', 'భోపాల్', S.mp, 23.2599, 77.4126),
  p('Ujjain', 'ఉజ్జయిని', S.mp, 23.1765, 75.7885),
  p('Panaji', 'పణజి', S.ga, 15.4909, 73.8278, ['Goa', 'Panjim']),
];

// "Vijayawada, Andhra Pradesh"
export function placeLabel(place: Place, language: 'en' | 'te' = 'en'): string {
  return language === 'te' ? `${place.te}, ${place.state.te}` : `${place.en}, ${place.state.en}`;
}

const key = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{M}\p{N}]/gu, '');

// The listed place a typed name refers to ("Rajahmundry", "విజయవాడ, ఆంధ్రప్రదేశ్"), or null
export function findPlace(text: string | null | undefined): Place | null {
  if (!text) return null;
  const first = key(text.split(',')[0]);
  if (!first) return null;
  return (
    PLACES.find((pl) => [pl.en, pl.te, ...(pl.aliases ?? [])].some((name) => key(name) === first)) ?? null
  );
}

// Places whose name starts with (or, failing that, contains) what was typed
export function suggestPlaces(text: string, limit = 6): Place[] {
  const q = key(text);
  if (!q) return [];
  const names = (pl: Place) => [pl.en, pl.te, ...(pl.aliases ?? [])].map(key);
  const starts = PLACES.filter((pl) => names(pl).some((nm) => nm.startsWith(q)));
  const contains = PLACES.filter((pl) => !starts.includes(pl) && names(pl).some((nm) => nm.includes(q)));
  return [...starts, ...contains].slice(0, limit);
}
