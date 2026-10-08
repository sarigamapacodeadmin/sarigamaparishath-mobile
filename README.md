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

## Building an APK / Play Store bundle

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview      # installable APK
npx eas-cli@latest build --platform android --profile production   # AAB for the Play Store
```

The Android package name is `com.sarigamaparishath.app` (in `app.json`).
