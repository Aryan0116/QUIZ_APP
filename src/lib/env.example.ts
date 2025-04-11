
// Rename this file to env.ts and fill in your Supabase credentials

// Your Supabase URL (from Project Settings > API)
export const SUPABASE_URL = 'your-supabase-url';

// Your Supabase anon key (from Project Settings > API)
export const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

// Example of how to validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials. Please check your env.ts file.');
}
