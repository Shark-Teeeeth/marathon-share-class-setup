import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SavedBuild {
  id: string;
  title: string;
  author: string;
  shell_id: string;
  weapon_id: string;
  mods: Record<string, string>;
  comment: string;
  likes: number;
  created_at: string;
}