import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// 由 `keyrun -- npx expo start` 注入（見 .keyrc）；沒設定時 App 以純本機模式運作
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// 網頁在伺服器端渲染時沒有 window，不建立 client
const canRun = Platform.OS !== 'web' || typeof window !== 'undefined';

export const supabase: SupabaseClient | null =
  url && key && canRun
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// App 在前景時才自動更新 token
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** 確保有登入（匿名帳號，每台裝置一個），回傳 user id */
export async function ensureSignedIn() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signed.user?.id ?? null;
}
