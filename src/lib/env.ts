
// Replace these with your actual Supabase credentials
export const SUPABASE_URL = 'https://gjhculqiipzmnezvbxeq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqaGN1bHFpaXB6bW5lenZieGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjI1NDQsImV4cCI6MjA1OTU5ODU0NH0.xpMxMH-0Y-ZrfBHOpKF5S6xrEfu7OMAP_pM1-52517U';

// Example of how to validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials. Please check your env.ts file.');
}
