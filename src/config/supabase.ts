import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;

if (!supabaseUrl || !supabaseKey) {
   logger.error('Missing Supabase URL or API key');
}

// Create a Supabase client with the anon key for client-side operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Create a Supabase admin client with the service key for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

logger.info('Supabase clients initialized'); 