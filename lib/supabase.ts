import { createClient } from '@supabase/supabase-js';

const supabaseKEY = process.env.sb_publishable_rfkVGAuh3AYp9-4uicDnhw_otSJB_Hf;
const supabaseURL = process.env.https://nizazerelnajaxfmigex.supabase.co;

export const supabase = createClient(supabaseURL, supabaseKEY);