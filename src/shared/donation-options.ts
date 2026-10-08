// The Parishath's donation options, as on the web app's donations page
// (sarigamaparishath/app/donations/page.tsx). Keep the two in sync.

export interface DonationOption {
  id: string;
  kind: 'fixed' | 'dattata' | 'choice';
  amount?: number; // fixed cards only
  purpose: string;
  title_en: string;
  title_te: string;
  impact_en: string;
  impact_te: string;
  icon: string;
}

export const DONATION_OPTIONS: DonationOption[] = [
  {
    id: 'cow-month',
    kind: 'fixed',
    amount: 2500,
    purpose: 'cows',
    title_en: 'Cow Maintenance',
    title_te: 'గో పోషణ',
    impact_en: 'One cow’s upkeep for one month',
    impact_te: 'ఒక గోవు ఒక నెల పోషణ',
    icon: '🐄',
  },
  {
    id: 'pathashala',
    kind: 'fixed',
    amount: 5000,
    purpose: 'vedapathashala',
    title_en: 'Veda Pathashala',
    title_te: 'వేద పాఠశాల',
    impact_en: 'Groceries for the Veda Pathashala for one month',
    impact_te: 'వేద పాఠశాలకు ఒక నెల కిరాణా సామగ్రి',
    icon: '📚',
  },
  {
    id: 'gou-dattata',
    kind: 'dattata',
    purpose: 'gou_dattata',
    title_en: 'Gou Dattata',
    title_te: 'గో దత్తత',
    impact_en: 'Adopt the cow of your choice for 3, 6 or 12 months',
    impact_te: 'మీకు నచ్చిన గోవును 3, 6 లేదా 12 నెలలు దత్తత తీసుకోండి',
    icon: '🐮',
  },
  {
    id: 'your-choice',
    kind: 'choice',
    purpose: 'gou_grasam',
    title_en: 'Donation of Your Choice',
    title_te: 'మీకు నచ్చిన విరాళం',
    impact_en: 'Any amount for Gou Grasam or protecting Sanatana Dharma',
    impact_te: 'గో గ్రాసం లేదా సనాతన ధర్మ పరిరక్షణకు మీకు నచ్చిన మొత్తం',
    icon: '🕉️',
  },
];

// Gou Dattata periods and their amounts.
export const DATTATA_PLANS = [
  { amount: 7500, months: 3 },
  { amount: 15000, months: 6 },
  { amount: 30000, months: 12 },
];

// What a "donation of your choice" can go to.
export const CHOICE_PURPOSES = ['gou_grasam', 'sanatana'];

export const DONATION_PURPOSES = [
  { value: 'cows', label_en: 'Gou Samrakshana (Srigovardhani Go Shala)', label_te: 'గో సంరక్షణ (శ్రీగోవర్ధని గో శాల)' },
  { value: 'gou_dattata', label_en: 'Gou Dattata (adopt a cow)', label_te: 'గో దత్తత' },
  { value: 'gou_grasam', label_en: 'Gou Grasam (cow feed)', label_te: 'గో గ్రాసం' },
  { value: 'vedapathashala', label_en: 'Veda Pathashala groceries', label_te: 'వేద పాఠశాల కిరాణా సామగ్రి' },
  { value: 'vedic', label_en: 'Veda Parirakshana', label_te: 'వేద పరిరక్షణ' },
  { value: 'sanatana', label_en: 'Protecting Sanatana Dharma', label_te: 'సనాతన ధర్మ పరిరక్షణ' },
  { value: 'spiritual', label_en: 'Gnana and Bhakthi programmes', label_te: 'జ్ఞాన, భక్తి కార్యక్రమాలు' },
  { value: 'general', label_en: 'General (where most needed)', label_te: 'సాధారణ (అవసరమైన చోట)' },
];

export function purposeName(key: string, language: 'en' | 'te') {
  const p = DONATION_PURPOSES.find((d) => d.value === key);
  return p ? (language === 'en' ? p.label_en : p.label_te) : key;
}

export const PARISHATH_NAME = 'Sanatana Rishiproktha Gayatri Maha Parishath';
