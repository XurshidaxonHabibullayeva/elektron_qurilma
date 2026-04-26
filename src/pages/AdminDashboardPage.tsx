import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/hooks/useAuth'
import {
  adminAssignStudentClass,
  fetchStudentsForAdmin,
  type StudentProfileRow,
} from '@/services/adminStudent.service'
import {
  createClass,
  createSubject,
  fetchClasses,
  fetchSubjects,
} from '@/services/classSubject.service'
import type { ClassRow, SubjectRow } from '@/types'

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function AdminDashboardPage() {
  const { profile } = useAuth()

  const [classes, setClasses] = useState<ClassRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [classModalOpen, setClassModalOpen] = useState(false)
  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [classNameInput, setClassNameInput] = useState('')
  const [subjectNameInput, setSubjectNameInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [students, setStudents] = useState<StudentProfileRow[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [rowDraft, setRowDraft] = useState<Record<string, string>>({})
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setListError(null)
    setListLoading(true)
    try {
      const [c, s] = await Promise.all([fetchClasses(), fetchSubjects()])
      setClasses(c)
      setSubjects(s)
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Ma'lumotlar yuklanmadi")
    } finally {
      setListLoading(false)
    }
  }, [])

  const loadStudents = useCallback(async () => {
    setStudentsError(null)
    setStudentsLoading(true)
    try {
      const rows = await fetchStudentsForAdmin()
      setStudents(rows)
      setRowDraft({})
    } catch (e) {
      setStudentsError(e instanceof Error ? e.message : 'O‘quvchilar ro‘yxati yuklanmadi')
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadAll()
      void loadStudents()
    }, 0)
    return () => {
      window.clearTimeout(t)
    }
  }, [loadAll, loadStudents])

  function closeClassModal() {
    setClassModalOpen(false)
    setClassNameInput('')
    setFormError(null)
  }

  function closeSubjectModal() {
    setSubjectModalOpen(false)
    setSubjectNameInput('')
    setFormError(null)
  }

  async function handleAddClass(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const row = await createClass(classNameInput)
      setClasses((prev) => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)))
      closeClassModal()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sinf qo‘shilmadi')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAssignClass(studentId: string, currentClassId: string | null) {
    const raw =
      rowDraft[studentId] !== undefined ? rowDraft[studentId] : (currentClassId ?? '')
    const nextClassId = raw.trim() === '' ? null : raw.trim()
    setAssigningId(studentId)
    setStudentsError(null)
    try {
      await adminAssignStudentClass(studentId, nextClassId)
      setRowDraft((d) => {
        const next = { ...d }
        delete next[studentId]
        return next
      })
      await loadStudents()
    } catch (e) {
      setStudentsError(e instanceof Error ? e.message : 'Sinf biriktirilmadi')
    } finally {
      setAssigningId(null)
    }
  }

  async function handleAddSubject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const row = await createSubject(subjectNameInput)
      setSubjects((prev) => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)))
      closeSubjectModal()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fan qo‘shilmadi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        title="Sinflar va fanlar"
        description={
          <>
            Maktab sinflari (masalan, 5-sinf) va fanlar (masalan, Matematika) ro‘yxatini boshqaring.
            Ma’lumotlar Supabase jadvalida saqlanadi:{' '}
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              classes
            </code>{' '}
            va{' '}
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              subjects
            </code>
            .
          </>
        }
      />

      {profile?.id ? (
        <p className="-mt-4 text-xs text-slate-500 dark:text-slate-400 sm:-mt-6">
          Administrator sessiyasi: <span className="font-mono">{profile.id}</span>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Sinflar"
          value={listLoading ? '…' : classes.length}
          hint="Katalogdagi sinflar soni"
        />
        <StatCard
          label="Fanlar"
          value={listLoading ? '…' : subjects.length}
          hint="O‘qituvchilar biriktirishi mumkin bo‘lgan fanlar"
        />
        <StatCard
          label="Katalog holati"
          value={
            listLoading ? '…' : classes.length > 0 && subjects.length > 0 ? 'Tayyor' : 'Sozlash'
          }
          hint={
            listLoading
              ? undefined
              : !classes.length || !subjects.length
                ? 'Kamida bitta sinf va bitta fan qo‘shing'
                : 'O‘qituvchilar dars yaratishi mumkin'
          }
        />
      </div>

      {listError ? (
        <Card className="border-red-200 bg-red-50/60 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
          {listError}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700/80">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Sinflar</h2>
            <Button
              type="button"
              onClick={() => {
                setFormError(null)
                setClassNameInput('')
                setClassModalOpen(true)
              }}
            >
              Sinf qo‘shish
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Nomi</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Yaratilgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {listLoading ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                      Yuklanmoqda…
                    </td>
                  </tr>
                ) : classes.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                      Hozircha sinf yo‘q. Yuqoridagi tugma orqali qo‘shing.
                    </td>
                  </tr>
                ) : (
                  classes.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {row.name}
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 dark:text-slate-400 sm:table-cell">
                        {formatDate(row.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700/80">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Fanlar</h2>
            <Button
              type="button"
              onClick={() => {
                setFormError(null)
                setSubjectNameInput('')
                setSubjectModalOpen(true)
              }}
            >
              Fan qo‘shish
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Nomi</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Yaratilgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {listLoading ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                      Yuklanmoqda…
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                      Hozircha fan yo‘q. Yuqoridagi tugma orqali qo‘shing.
                    </td>
                  </tr>
                ) : (
                  subjects.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {row.name}
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 dark:text-slate-400 sm:table-cell">
                        {formatDate(row.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/80">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              O‘quvchilarni sinfga biriktirish
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              O‘quvchi panelidagi darslar uchun{' '}
              <code className="rounded bg-slate-100 px-1 font-mono text-[11px] dark:bg-slate-800">
                profiles.class_id
              </code>{' '}
              shu yerda belgilanadi. Avval yuqorida sinf yarating.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={studentsLoading || !!assigningId}
            onClick={() => {
              void loadStudents()
            }}
          >
            Ro‘yxatni yangilash
          </Button>
        </div>
        {studentsError ? (
          <div className="border-b border-red-100 bg-red-50/60 px-5 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/40 dark:text-red-100">
            {studentsError}
            <p className="mt-2 text-xs opacity-90">
              Agar xato «policy» yoki «function» haqida bo‘lsa, SQL Editor’da{' '}
              <code className="font-mono">20260426120000_admin_student_class.sql</code> yoki{' '}
              <code className="font-mono">REMOTE_SETUP.sql</code> oxirgi qismini qayta ishga tushiring.
            </p>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">O‘quvchi</th>
                <th className="px-5 py-3">Sinf</th>
                <th className="px-5 py-3">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
              {studentsLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    Hozircha <code className="font-mono text-xs">role = student</code> profillar yo‘q.
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const selectValue =
                    rowDraft[st.id] !== undefined ? rowDraft[st.id] : (st.class_id ?? '')
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {st.full_name?.trim() ? st.full_name : 'Ismsiz'}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                          {st.id}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          id={`class-for-${st.id}`}
                          className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                          value={selectValue}
                          disabled={!!assigningId}
                          onChange={(ev) =>
                            setRowDraft((d) => ({ ...d, [st.id]: ev.target.value }))
                          }
                        >
                          <option value="">— Sinf tanlanmagan —</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          type="button"
                          disabled={!!assigningId}
                          onClick={() => {
                            void handleAssignClass(st.id, st.class_id)
                          }}
                        >
                          {assigningId === st.id ? 'Saqlanmoqda…' : 'Saqlash'}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={classModalOpen}
        title="Yangi sinf"
        onClose={() => {
          if (!submitting) closeClassModal()
        }}
      >
        <form className="space-y-4" onSubmit={handleAddClass}>
          <TextField
            id="new-class-name"
            label="Sinf nomi"
            name="className"
            value={classNameInput}
            onChange={(ev) => setClassNameInput(ev.target.value)}
            placeholder="Masalan: 5-sinf"
            autoComplete="off"
            required
          />
          {formError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={closeClassModal}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saqlanmoqda…' : 'Saqlash'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={subjectModalOpen}
        title="Yangi fan"
        onClose={() => {
          if (!submitting) closeSubjectModal()
        }}
      >
        <form className="space-y-4" onSubmit={handleAddSubject}>
          <TextField
            id="new-subject-name"
            label="Fan nomi"
            name="subjectName"
            value={subjectNameInput}
            onChange={(ev) => setSubjectNameInput(ev.target.value)}
            placeholder="Masalan: Matematika"
            autoComplete="off"
            required
          />
          {formError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={closeSubjectModal}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saqlanmoqda…' : 'Saqlash'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
