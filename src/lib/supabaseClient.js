import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[ChefCloud] URL =', supabaseUrl)
console.log('[ChefCloud] KEY =', Boolean(supabaseAnonKey))

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[ChefCloud] Supabase environment variables are missing')
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

console.log('[ChefCloud] CLIENT =', Boolean(supabase))