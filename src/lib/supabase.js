import { createClient } from '@supabase/supabase-js';

// Rapikan nilai dari Environment Variables (hapus kutip, spasi, "/" dan "/rest/v1" di akhir).
const clean = (v) => String(v || '').trim().replace(/^["']|["']$/g, '');
const url = clean(import.meta.env.VITE_SUPABASE_URL).replace(/\/+$/, '').replace(/\/rest\/v1$/, '').replace(/\/+$/, '');
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabaseReady = Boolean(url && key);
export const supabase = supabaseReady ? createClient(url, key) : null;
