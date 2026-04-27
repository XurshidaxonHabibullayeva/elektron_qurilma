import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function missingVarMessage(varName: string): string {
  return (
    `${varName} topilmadi. Loyiha ildizida .env yoki .env.local yarating: ` +
    `.env.example ni nusxalang, so‘ng Supabase → Project Settings → API dan ` +
    `Project URL va anon yoki Publishable kalitni kiriting. ` +
    `O‘zgarishdan keyin dev serverni qayta ishga tushiring (Vite faqat ishga tushganda o‘qiydi).`
  )
}

if (!url) {
  throw new Error(missingVarMessage('VITE_SUPABASE_URL'))
}
if (!anonKey) {
  throw new Error(missingVarMessage('VITE_SUPABASE_ANON_KEY'))
}

const isPlaceholderEnv =
  url.includes('your-project.supabase.co') ||
  url.includes('YOUR_PROJECT_REF') ||
  anonKey.includes('paste_publishable_or_legacy_anon_here')

if (isPlaceholderEnv) {
  throw new Error(
    'Supabase URL yoki kalit hali .env.example dagi namuna. ' +
    '.env.local (yoki .env) ichidagi VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY ni ' +
    'o‘z loyihangizning haqiqiy API qiymatlari bilan almashtiring.',
  )
}

export const supabase = createClient(url, anonKey)
