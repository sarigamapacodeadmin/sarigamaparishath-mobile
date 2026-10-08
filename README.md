# Parishath mobile app

Android app (iOS later) for the Sanatana Rishiproktha Gayatri Maha Parishath portal,
built with Expo and React Native. It talks to the same Supabase project and the same
API routes as the website (https://github.com/sarigamapacodeadmin/sarigamaparishath),
so logins, member profiles, donations and receipts are shared.

## Screens

- **Home**: logo, core values and the first activities, with Login/Profile and Donate buttons
- **Activities**: category filter (Veda, Gou, Gnana, Bhakthi) and a detail page per activity
- **Donate**: the website's four options (cow maintenance, Veda Pathashala, Gou Dattata with
  cow and period, donation of your choice), paid through Razorpay
- **Events**: upcoming first, search, status and category filters; detail page with
  registration (name, email, phone, number of people), as on the website
- **More**: login or profile, Gallery (category filter, full-screen photo view),
  Blog (search, categories, articles with related posts) and a link to the website
- **Profile**: view and edit the member profile, donation totals, logout; creates the
  member record if a login has none
- **Login**: email or 10-digit mobile number and password; members on the default
  password (123456) are sent to set their own email and password first

Every screen has the EN / తెలుగు switch in its header, and the choice is remembered.

## How it reuses the website

| Feature | How |
| --- | --- |
| Email login | Supabase `signInWithPassword` |
| Mobile-number login | `POST /api/auth/phone-login`, then `setSession` |
| First login | `POST /api/member/first-login` |
| Profile | `GET/POST /api/member/me`, updates via Supabase `members` |
| Activities | `GET /api/activities`, `GET /api/activities/:id` |
| Events | Supabase `events`; registration via `POST /api/events/:id/register` |
| Gallery, Blog | Supabase `gallery_photos`, `blog_posts` (published only) |
| Donations | `POST /api/razorpay/create-order`, Razorpay checkout, `POST /api/razorpay/verify-payment` |

Razorpay runs its standard web checkout inside a WebView
(`src/components/razorpay-checkout.tsx`), so it works in Expo Go and needs no native
Razorpay SDK. UPI app links are handed to Android.

Labels and donation rules that must match the website live in `src/shared/`, copied
from the web app's `lib/`. Change both together.

## Setup

```bash
npm install
cp .env.example .env   # fill in the Supabase URL, anon key and Razorpay key id (same as Vercel)
npx expo start         # scan the QR code with Expo Go on an Android phone
```

Checks: `npm run typecheck`.

## Installable APK (GitHub Actions)

`.github/workflows/android-apk.yml` builds an APK on every push to `main`, or by hand
from the Actions tab ("Android APK" > "Run workflow"). It needs three repository
secrets (Settings > Secrets and variables > Actions): `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY` and `EXPO_PUBLIC_RAZORPAY_KEY_ID`, the same values
as the website's `NEXT_PUBLIC_*` ones in Vercel. Download the APK from the run's
Artifacts and open it on the phone (allow installing from this source when asked).
It is signed with the standard debug key, which is fine for sharing directly; a Play
Store release needs its own key, below.

## Play Store bundle (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview      # installable APK
npx eas-cli@latest build --platform android --profile production   # AAB for the Play Store
```

The Android package name is `com.sarigamaparishath.app` (in `app.json`).
