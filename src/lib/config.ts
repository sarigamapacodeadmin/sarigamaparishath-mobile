// Settings read from EXPO_PUBLIC_* variables (see .env.example). These are
// public values: the Supabase anon key and the Razorpay key id are already
// shipped to every browser by the web app.

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://sarigamaparishath.vercel.app').replace(/\/$/, '');
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
