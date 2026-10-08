import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

// The same Supabase project as the web app. The session is kept on the phone,
// so a member stays logged in between launches.
export const supabase = createClient(
  // createClient throws on an empty URL; the app shows a setup message instead (see isSupabaseConfigured)
  isSupabaseConfigured ? SUPABASE_URL : 'https://not-configured.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'not-configured',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Refresh tokens only while the app is in the foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
