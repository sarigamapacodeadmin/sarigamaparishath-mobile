// Settings read from EXPO_PUBLIC_* variables (see .env.example). These are
// public values: the Supabase anon key and the Razorpay key id are already
// shipped to every browser by the web app.

// Secrets pasted into GitHub sometimes carry spaces, a newline or quotes
function clean(value: string | undefined): string {
  return (value || '').trim().replace(/^["']|["']$/g, '').trim();
}

export const API_URL = (clean(process.env.EXPO_PUBLIC_API_URL) || 'https://sarigamaparishath.vercel.app').replace(/\/$/, '');
export const SUPABASE_URL = clean(process.env.EXPO_PUBLIC_SUPABASE_URL).replace(/\/$/, '');
export const SUPABASE_ANON_KEY = clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
export const RAZORPAY_KEY_ID = clean(process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
