import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project details (see SETUP.md).'
  );
}

// AsyncStorage's web shim touches `window.localStorage` as soon as it's
// read, which crashes Expo Router's static export (it pre-renders pages in
// Node, where there is no `window`). A no-op storage on the server is fine:
// SSR output has no real session anyway, the browser re-checks auth after
// hydration.
const isServer = typeof window === 'undefined';
const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isServer ? noopStorage : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

/** Every Supabase call returns `{ data, error }` and every call site needs to
 * throw on `error` before using `data` - this collapses that pair into one
 * awaited expression. `T` is asserted by the caller (as the previous
 * `data as T` casts were) rather than inferred from the promise itself:
 * inferring it from the promise lets it leak into Supabase's own generic
 * builder methods (e.g. `.single()`), corrupting their result types. */
export async function unwrap<T>(
  promise: PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await promise;
  if (error) throw error;
  return data as T;
}
