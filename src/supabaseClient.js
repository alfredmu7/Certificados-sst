// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zvncdwhnphzmskyeizne.supabase.co';
const supabaseAnonKey = 'sb_publishable_9p-Ta0F3YrzTbmKGRMc6dg_cuNVDQKF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);