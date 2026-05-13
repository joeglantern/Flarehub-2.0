import { createClient } from '@supabase/supabase-js';
import { appConfig } from '../config/index.js';

export const supabaseAdmin = createClient(
  appConfig.supabase.url,
  appConfig.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  },
);
