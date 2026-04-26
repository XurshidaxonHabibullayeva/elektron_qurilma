import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!url) {
  throw new Error(
    'VITE_SUPABASE_URL topilmadi. Qiymatni .env.local fayliga qo‘shing (.env.example ga qarang).',
  )
}
if (!anonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY topilmadi. Qiymatni .env.local fayliga qo‘shing (.env.example ga qarang).',
  )
}

export const supabase = createClient(url, anonKey)
