import { createClient } from '@supabase/supabase-js';
import type { Spot, Review, Profile, Report, RateLimit } from './types';

export type Database = {
  public: {
    Tables: {
      spots: { Row: Spot };
      reviews: { Row: Review };
      profiles: { Row: Profile };
      reports: { Row: Report };
      rate_limits: { Row: RateLimit };
    };
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 