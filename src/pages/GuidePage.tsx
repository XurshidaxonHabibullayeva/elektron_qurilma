import { type ReactNode, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { roleHomePath } from '@/utils/rolePaths'
import { cn } from '@/utils/cn'

type RoleTab = 'admin' | 'teacher' | 'student'

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Parolimni unutdim, nima qilaman?',
    a: "Tizim Supabase orqali kirishni qo'llab-quvvatlaydi. Kirish sahifasida «Parolni tiklash» (yoki shunga o'xshash) havolasi bo'lsa, elektron pochtangizga havola yuboriladi. Agar bunday imkoniyat ko'rinmasa, maktabingiz IT yoki loyiha administratoriga murojaat qiling.",
  },
  {
    q: 'Video ochilmasa nima qilish kerak?',
    a: "Havolani yangi brauzer yorlig'ida ochib ko'ring, internet aloqasini tekshiring. Ba'zi video xostinglari (masalan, YouTube) maktab tarmog'ida cheklanishi mumkin — o'qituvchi yoki administrator bilan maslahatlashgan ma'qul.",
  },
  {
    q: 'Testni qayta ishlash mumkinmi?',
    a: "Ha, o'quvchi dars sahifasidagi testni qayta topshirishi mumkin. Serverda ball qayta hisoblanadi va natijalar jadvalida yangilanadi (oxirgi urinish saqlanadi).",
  },
  {
    q: "O'quvchi boshqa sinf darslarini ko'ra oladimi?",
    a: "Yo'q. Har bir o'quvchi profilingizdagi sinfga (class_id) biriktiriladi va faqat o'sha sinf uchun chop etilgan darslarni ko'radi. Boshqa sinf materiallarini ko'rish huquqi bo'lmaydi.",
  },
  {
    q: "O'qituvchi natijalarni qayerdan ko'radi?",
    a: "O'qituvchi panelidagi «Natijalar» bo'limiga o'ting. U yerda har bir dars, o'quvchi identifikatori, ball va sana ustunlari bilan jadval ko'rinadi.",
  },
]

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconFlow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function IconHelp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  )
}

function StepBlock({
  n,
  title,
  children,
  accent,
}: {
  n: number
  title: string
  children: ReactNode
  accent: 'violet' | 'teal' | 'sky'
}) {
  const ring =
    accent === 'violet'
      ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200'
      : accent === 'teal'
        ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200'
        : 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200'

  return (
    <div className="flex gap-4">
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-sm',
          ring,
        )}
        aria-hidden
      >
        {n}
      </div>
      <div className="min-w-0 flex-1 border-b border-slate-100 pb-6 last:border-0 last:pb-0 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {children}
        </div>
      </div>
    </div>
  )
}

function AdminGuide() {
  const a = 'violet' as const
  return (
    <div className="space-y-6">
      <StepBlock n={1} title="Platformaga kirish" accent={a}>
        <p>
          Brauzer orqali tizim manziliga kiring, «Kirish» sahifasida ro'yxatdan o'tgan elektron pochta va
          parolingizni kiriting.
        </p>
      </StepBlock>
      <StepBlock n={2} title="Sinf qo'shish" accent={a}>
        <p>
          Administrator panelidagi «Sinflar» jadvalida «Sinf qo‘shish» tugmasini bosing. Masalan,{' '}
          <strong>5-sinf</strong> kabi sinf nomini kiriting va saqlang.
        </p>
      </StepBlock>
      <StepBlock n={3} title="Fan qo'shish" accent={a}>
        <p>
          «Fanlar» bo‘limida «Fan qo‘shish» tugmasi orqali fanlarni (masalan, Matematika, Ona tili)
          katalogga qo‘shing — o‘qituvchilar keyin dars yaratishda shu ro‘yxatdan foydalanadi.
        </p>
      </StepBlock>
      <StepBlock n={4} title="O'qituvchi va o'quvchilarni boshqarish" accent={a}>
        <p>
          Foydalanuvchi akkauntlari va rollari (admin, o'qituvchi, o'quvchi) Supabase Auth va{' '}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">profiles</code>{' '}
          jadvali orqali boshqariladi. O'quvchini ma'lum sinfga biriktirish uchun profilingizda{' '}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">class_id</code>{' '}
          maydoni to'g'ri sinf identifikatoriga o'rnatilishi kerak (bu amalni odatda administrator yoki
          SQL orqali bajaradi).
        </p>
      </StepBlock>
      <StepBlock n={5} title="Sinf va fanlarni tekshirish" accent={a}>
        <p>
          Asosiy sahifadagi jadvallarda barcha sinflar va fanlar ro'yxati, yaratilgan sana bilan
          ko'rinadi. Kamchilik bo'lsa, nomni qayta tahrirlash yoki yangi qator qo'shish mumkin.
        </p>
      </StepBlock>
    </div>
  )
}

function TeacherGuide() {
  const a = 'teal' as const
  return (
    <div className="space-y-6">
      <StepBlock n={1} title="Platformaga kirish" accent={a}>
        <p>O'qituvchi sifatida berilgan login va parol bilan tizimga kiring.</p>
      </StepBlock>
      <StepBlock n={2} title="Kerakli sinf va fanni tanlash" accent={a}>
        <p>
          «Yangi dars» formasida avvalo <strong>Sinf</strong> va <strong>Fan</strong> ro‘yxatidan dars
          qaysi sinf va fanga tegishli ekanini tanlang. Agar ro‘yxat bo‘sh bo‘lsa, avval administrator
          katalogga sinf va fan qo‘shishini so‘rang.
        </p>
      </StepBlock>
      <StepBlock n={3} title="Yangi dars yaratish" accent={a}>
        <p>
          Dars nomini kiriting, «Darsni saqlash» tugmasi bilan saqlang. Dars sizning akkauntingizga
          bog‘lanadi va tanlangan sinf o‘quvchilari uchun ko‘rinadi.
        </p>
      </StepBlock>
      <StepBlock n={4} title="Dars nomi, tavsifi, video va material havolalari" accent={a}>
        <p>
          <strong>Dars nomi</strong>, <strong>tavsif</strong>, <strong>video havolasi</strong> va{' '}
          <strong>material havolasi</strong> maydonlarini to‘ldiring — uyda o‘rganish uchun video yoki
          PDF/slayd havolalari (to‘liq https manzil).
        </p>
      </StepBlock>
      <StepBlock n={5} title="Test savollarini qo'shish" accent={a}>
        <p>
          «Mening darslarim» ro‘yxasida tegishli dars yonidagi <strong>Testni tahrirlash</strong> tugmasini
          bosing. Har bir savol uchun matn va to‘rtta variant kiriting, to‘g‘ri javobni tanlang va
          saqlang. Bir darsda bir nechta savollar bo‘lishi mumkin.
        </p>
      </StepBlock>
      <StepBlock n={6} title="O'quvchilar natijasini ko'rish" accent={a}>
        <p>
          Chap menyudagi <strong>Natijalar</strong> bo'limiga o'ting: qaysi dars, qaysi o'quvchi, ball
          va vaqt ustunlari bilan barcha urinishlar jadval shaklida chiqadi.
        </p>
      </StepBlock>
    </div>
  )
}

function StudentGuide() {
  const a = 'sky' as const
  return (
    <div className="space-y-6">
      <StepBlock n={1} title="Platformaga kirish" accent={a}>
        <p>O'quvchi akkauntingiz bilan kirish sahifasidan tizimga kiring.</p>
      </StepBlock>
      <StepBlock n={2} title="O'z sinfi va fanlar" accent={a}>
        <p>
          Administrator profilingizga sinf biriktirgach, bosh sahifada <strong>o'z sinfingiz nomi</strong>{' '}
          va shu sinf uchun mavjud <strong>fanlar tugmalari</strong> ko'rinadi. Avvalo kerakli fanni
          tanlang — shu fan bo'yicha darslar ro'yxati ochiladi.
        </p>
      </StepBlock>
      <StepBlock n={3} title="Keyingi dars materialini ochish" accent={a}>
        <p>
          Ro‘yxatdan kerakli darsni tanlab, <strong>Darsni ochish</strong> tugmasi bilan to‘liq sahifaga
          o‘ting. U yerda tavsif, video va qo‘shimcha material havolalari joylashgan.
        </p>
      </StepBlock>
      <StepBlock n={4} title="Video ko'rish yoki materialni o'qish" accent={a}>
        <p>
          Uy sharoitida videoni tomosha qiling yoki berilgan havola orqali hujjat/slayd bilan tanishing.
          Savollaringizni darsda o'qituvchiga berish uchun qayd qilib boring.
        </p>
      </StepBlock>
      <StepBlock n={5} title="Test ishlash" accent={a}>
        <p>
          Dars sahifasining pastki qismidagi test bo'limida har bir savolga bitta javob belgilang va
          javoblarni yuboring. Ball avtomatik hisoblanadi.
        </p>
      </StepBlock>
      <StepBlock n={6} title="Natijani ko'rish" accent={a}>
        <p>
          Testdan keyin darhol natija ko'rinadi. Qo'shimcha ravishda <strong>Natijalar</strong> menyusida
          barcha darslar bo'yicha saqlangan balllaringiz jadvalini ko'rishingiz mumkin.
        </p>
      </StepBlock>
      <StepBlock n={7} title="Darsga tayyor holda kelish" accent={a}>
        <p>
          Maqsad — auditoriyada asosiy vaqtni mustahkamlash va mashqga sarflash. Material bilan oldindan
          tanishganingizdan keyin darsga faol qatnashing.
        </p>
      </StepBlock>
    </div>
  )
}

export default function GuidePage() {
  const [tab, setTab] = useState<RoleTab>('admin')
  const { session, profile, bootstrapping } = useAuth()
  const navigate = useNavigate()

  const startHref = useMemo(() => {
    if (!session || !profile) {
      return '/login'
    }
    return roleHomePath(profile.role)
  }, [session, profile])

  function handleBoshlash() {
    navigate(startHref)
  }

  const tabs: { id: RoleTab; label: string }[] = [
    { id: 'admin', label: 'Administrator' },
    { id: 'teacher', label: "O'qituvchi" },
    { id: 'student', label: "O'quvchi" },
  ]

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:max-w-6xl">
          <Link
            to={
              bootstrapping
                ? '/guide'
                : session && profile
                  ? roleHomePath(profile.role)
                  : '/login'
            }
            className="text-sm font-semibold text-slate-900 dark:text-white"
          >
            ←{' '}
            {bootstrapping ? 'Kutilmoqda' : session && profile ? 'Bosh sahifa' : 'Kirish'}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:max-w-6xl lg:py-12">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            Elektron qo'llanma
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Foydalanish bo'yicha yo'riqnoma
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Aylana sinf (flipped classroom) yondashuvi bo'yicha qadamba-qadam ko'rsatmalar
          </p>
        </div>

        {/* 1. Platforma haqida */}
        <Card className="mt-10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              <IconBook className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                1. Platforma haqida qisqacha
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
                Ushbu platforma <strong>aylana sinf</strong> modelini qo'llab-quvvatlaydi: o'quvchilar
                yangi mavzuni <strong>auditoriyaga kelishidan oldin</strong> uyda video va materiallar
                orqali o'rganadi. Dars vaqtida o'qituvchi esa bilimni{' '}
                <strong>mashq, muhokama va mustahkamlash</strong>ga sarflash uchun sinfda bo'ladi.
                Shunday qilib, uy va maktab vaqti samarali taqsimlanadi.
              </p>
            </div>
          </div>
        </Card>

        {/* 2–4 Role tabs */}
        <section className="mt-10" aria-labelledby="role-guides-heading">
          <h2 id="role-guides-heading" className="sr-only">
            Rollar bo'yicha yo'riqnomalar
          </h2>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-md dark:border-slate-700 dark:bg-slate-900/70 sm:inline-flex">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none',
                  tab === t.id
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Card className="mt-4 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl',
                  tab === 'admin' && 'bg-violet-100 text-violet-700 dark:bg-violet-900/50',
                  tab === 'teacher' && 'bg-teal-100 text-teal-700 dark:bg-teal-900/50',
                  tab === 'student' && 'bg-sky-100 text-sky-700 dark:bg-sky-900/50',
                )}
              >
                <IconUsers className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                {tab === 'admin' ? "2. Administrator uchun yo'riqnoma" : null}
                {tab === 'teacher' ? "3. O'qituvchi uchun yo'riqnoma" : null}
                {tab === 'student' ? "4. O'quvchi uchun yo'riqnoma" : null}
              </h3>
            </div>
            {tab === 'admin' ? <AdminGuide /> : null}
            {tab === 'teacher' ? <TeacherGuide /> : null}
            {tab === 'student' ? <StudentGuide /> : null}
          </Card>
        </section>

        {/* 5. Jarayon */}
        <Card className="mt-10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <IconFlow className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                5. Platformadan foydalanish jarayoni
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Quyidagi ketma-ketlik butun o'quv yilida tizimdan foydalanishning mantiqiy yo'lini
                ko'rsatadi.
              </p>
              <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    role: 'Administrator',
                    text: "Maktab katalogida sinf va fanlarni qo'shadi; foydalanuvchilarni sinflarga tayinlash bilan ta'minlaydi.",
                  },
                  {
                    role: "O'qituvchi",
                    text: "Tanlangan sinf va fan uchun dars matni, video, material va test savollarini joylaydi.",
                  },
                  {
                    role: "O'quvchi",
                    text: "Darsdan oldin materialni o'qiydi, videoni ko'radi va testni topshiradi.",
                  },
                  {
                    role: "O'qituvchi (sinfda)",
                    text: "Auditoriyada bilimni mustahkamlaydi, savollarga javob beradi va mashqlar o'tkazadi.",
                  },
                ].map((item, i) => (
                  <li
                    key={item.role}
                    className="relative rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/40"
                  >
                    <span className="absolute -left-1 -top-2 flex size-8 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-md dark:bg-violet-500">
                      {i + 1}
                    </span>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                      {item.role}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-center text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                Administrator → sinf/fan qo'shadi → O'qituvchi → dars/material/test qo'shadi → O'quvchi →
                darsdan oldin tayyorlanadi → O'qituvchi → darsda bilimni mustahkamlaydi
              </p>
            </div>
          </div>
        </Card>

        {/* 6. FAQ */}
        <section className="mt-10" aria-labelledby="faq-heading">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              <IconHelp className="size-5" />
            </div>
            <h2 id="faq-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
              6. Tez-tez beriladigan savollar (FAQ)
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200/90 bg-white shadow-md open:ring-2 open:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900/70 dark:open:ring-violet-400/20"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left font-medium text-slate-900 marker:content-none dark:text-white [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition group-open:rotate-180 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    aria-hidden
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* 7. Boshlash */}
        <Card className="mt-10 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tayyormisiz?</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {bootstrapping
                ? 'Profil tekshirilmoqda…'
                : session && profile
                  ? `«Boshlash» tugmasi sizni ${
                      profile.role === 'admin'
                        ? 'administrator'
                        : profile.role === 'teacher'
                          ? 'o‘qituvchi'
                          : 'o‘quvchi'
                    } boshqaruviga olib boradi.`
                  : "Tizimga kirmagan bo'lsangiz, avvalo kirish sahifasiga yo'naltirilasiz."}
            </p>
          </div>
          <Button
            type="button"
            className="min-w-[160px] shrink-0 px-8 shadow-md"
            disabled={bootstrapping}
            onClick={handleBoshlash}
          >
            Boshlash
          </Button>
        </Card>

        {!session ? (
          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
            <Link to="/login" className="underline-offset-2 hover:underline">
              Kirish
            </Link>
            {' · '}
            <Link to="/register" className="underline-offset-2 hover:underline">
              Ro'yxatdan o'tish
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  )
}
