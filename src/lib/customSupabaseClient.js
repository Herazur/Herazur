import { createClient } from '@supabase/supabase-js';

const readEnv = (key) => {
  const viteValue = import.meta.env?.[key];
  if (viteValue) return viteValue;
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  return '';
};

const supabaseUrl = readEnv('VITE_SUPABASE_URL') || readEnv('SUPABASE_URL');
const supabaseAnonKey =
  readEnv('VITE_SUPABASE_ANON_KEY') || readEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseConfig = {
  url: supabaseUrl,
  projectRef: supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '',
};

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
