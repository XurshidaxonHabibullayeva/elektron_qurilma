import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/hooks/useAuth'
import { adminAssignStudentClass } from '@/services/adminStudent.service'
import {
  adminSetProfileRole,
  fetchRegisteredUsersForAdmin,
  type RegisteredUserRow,
} from '@/services/adminUsers.service'
import {
  adminSetTeacherSubjects,
  fetchTeacherSubjectIds,
} from '@/services/teacherSubject.service'
import {
  adminSetStudentSubjects,
  fetchStudentSubjectIds,
} from '@/services/studentSubject.service'

import {
  createClass,
  createSubject,
  deleteClass,
  deleteSubject,
  fetchClasses,
  fetchSubjects,
  updateClass,
  updateSubject,
} from '@/services/classSubject.service'
import type { ClassRow, SubjectRow } from '@/types'
import { cn } from '@/utils/cn'


function displayUserClassColumn(u: RegisteredUserRow): string {
  if (u.role === 'admin') {
    return '—'
  }
  if (u.role === 'student') {
    const s = u.student_class_name?.trim()
    return s || '—'
  }
  const t = u.teacher_classes_summary?.trim()
  return t || '—'
}

function displayUserSubjectsColumn(u: RegisteredUserRow): string {
  if (u.role !== 'teacher') {
    return '—'
  }
  const s = u.teacher_assigned_subjects_summary?.trim()
  return s || '—'
}

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
  const [catalogActionError, setCatalogActionError] = useState<string | null>(null)

  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [classEditDraft, setClassEditDraft] = useState('')
  const [classBusyId, setClassBusyId] = useState<string | null>(null)

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [subjectEditDraft, setSubjectEditDraft] = useState('')
  const [subjectBusyId, setSubjectBusyId] = useState<string | null>(null)

  const [classModalOpen, setClassModalOpen] = useState(false)
  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [classNameInput, setClassNameInput] = useState('')
  const [subjectNameInput, setSubjectNameInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserRow[]>([])
  const [userListUsedFallback, setUserListUsedFallback] = useState(false)
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersLoadError, setUsersLoadError] = useState<string | null>(null)
  const [assignClassError, setAssignClassError] = useState<string | null>(null)
  const [saveRoleError, setSaveRoleError] = useState<string | null>(null)
  const [rowDraft, setRowDraft] = useState<Record<string, string>>({})
  const [roleDraft, setRoleDraft] = useState<Record<string, 'student' | 'teacher'>>({})
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null)

  const [tsTeacherId, setTsTeacherId] = useState('')
  const [tsSubjectIds, setTsSubjectIds] = useState<string[]>([])
  const [tsLoading, setTsLoading] = useState(false)
  const [tsSaving, setTsSaving] = useState(false)
  const [tsError, setTsError] = useState<string | null>(null)

  const [ssStudentId, setSsStudentId] = useState('')
  const [ssSubjectIds, setSsSubjectIds] = useState<string[]>([])
  const [ssLoading, setSsLoading] = useState(false)
  const [ssSaving, setSsSaving] = useState(false)
  const [ssError, setSsError] = useState<string | null>(null)


  const loadAll = useCallback(async () => {
    setListError(null)
    setCatalogActionError(null)
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

  const loadRegisteredUsers = useCallback(async () => {
    setUsersLoadError(null)
    setUsersLoading(true)
    try {
      const { rows, usedProfileFallback } = await fetchRegisteredUsersForAdmin()
      setRegisteredUsers(rows)
      setUserListUsedFallback(usedProfileFallback)
      setRowDraft({})
      setRoleDraft({})
      setSaveRoleError(null)
    } catch (e) {
      setUsersLoadError(e instanceof Error ? e.message : 'Foydalanuvchilar ro‘yxati yuklanmadi')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadAll()
      void loadRegisteredUsers()
    }, 0)
    return () => {
      window.clearTimeout(t)
    }
  }, [loadAll, loadRegisteredUsers])

  useEffect(() => {
    if (!tsTeacherId) {
      setTsSubjectIds([])
      setTsError(null)
      setTsLoading(false)
      return
    }
    let cancelled = false
    setTsLoading(true)
    setTsError(null)
    void fetchTeacherSubjectIds(tsTeacherId)
      .then((ids) => {
        if (!cancelled) {
          setTsSubjectIds(ids)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setTsSubjectIds([])
          setTsError(err instanceof Error ? err.message : 'Fanlar yuklanmadi')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [tsTeacherId])

  useEffect(() => {
    if (!ssStudentId) {
      setSsSubjectIds([])
      setSsError(null)
      setSsLoading(false)
      return
    }
    let cancelled = false
    setSsLoading(true)
    setSsError(null)
    void fetchStudentSubjectIds(ssStudentId)
      .then((ids) => {
        if (!cancelled) {
          setSsSubjectIds(ids)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSsSubjectIds([])
          setSsError(err instanceof Error ? err.message : 'Fanlar yuklanmadi')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [ssStudentId])


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
    setAssignClassError(null)
    try {
      await adminAssignStudentClass(studentId, nextClassId)
      setRowDraft((d) => {
        const next = { ...d }
        delete next[studentId]
        return next
      })
      await loadRegisteredUsers()
    } catch (e) {
      setAssignClassError(e instanceof Error ? e.message : 'Sinf biriktirilmadi')
    } finally {
      setAssigningId(null)
    }
  }

  function toggleTeacherSubject(subjectId: string) {
    setTsSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((x) => x !== subjectId) : [...prev, subjectId],
    )
  }

  async function handleSaveTeacherSubjects() {
    if (!tsTeacherId) {
      return
    }
    setTsSaving(true)
    setTsError(null)
    try {
      await adminSetTeacherSubjects(tsTeacherId, tsSubjectIds)
      await loadRegisteredUsers()
    } catch (e) {
      setTsError(e instanceof Error ? e.message : 'Fanlar saqlanmadi')
    } finally {
      setTsSaving(false)
    }
  }

  function toggleStudentSubject(subjectId: string) {
    setSsSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((x) => x !== subjectId) : [...prev, subjectId],
    )
  }

  async function handleSaveStudentSubjects() {
    if (!ssStudentId) {
      return
    }
    setSsSaving(true)
    setSsError(null)
    try {
      await adminSetStudentSubjects(ssStudentId, ssSubjectIds)
      await loadRegisteredUsers()
    } catch (e) {
      setSsError(e instanceof Error ? e.message : 'Fanlar saqlanmadi')
    } finally {
      setSsSaving(false)
    }
  }


  async function handleSaveRole(row: RegisteredUserRow) {
    if (row.role === 'admin' || row.id === profile?.id) {
      return
    }
    const want = roleDraft[row.id] ?? row.role
    if (want !== 'student' && want !== 'teacher') {
      return
    }
    if (want === row.role) {
      return
    }
    setRoleSavingId(row.id)
    setSaveRoleError(null)
    try {
      await adminSetProfileRole(row.id, want)
      setRoleDraft((d) => {
        const next = { ...d }
        delete next[row.id]
        return next
      })
      await loadRegisteredUsers()
    } catch (e) {
      setSaveRoleError(e instanceof Error ? e.message : 'Rol saqlanmadi')
    } finally {
      setRoleSavingId(null)
    }
  }

  const studentRows = [...registeredUsers.filter((u) => u.role === 'student')].sort((a, b) => {
    const an = (a.full_name ?? '').trim() || a.email
    const bn = (b.full_name ?? '').trim() || b.email
    return an.localeCompare(bn, 'uz')
  })

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

  function beginEditClass(row: ClassRow) {
    setCatalogActionError(null)
    setEditingSubjectId(null)
    setSubjectEditDraft('')
    setEditingClassId(row.id)
    setClassEditDraft(row.name)
  }

  function cancelEditClass() {
    setEditingClassId(null)
    setClassEditDraft('')
  }

  async function commitEditClass() {
    if (!editingClassId) {
      return
    }
    setClassBusyId(editingClassId)
    setCatalogActionError(null)
    try {
      const updated = await updateClass(editingClassId, classEditDraft)
      setClasses((prev) =>
        [...prev.map((c) => (c.id === updated.id ? updated : c))].sort((a, b) =>
          a.name.localeCompare(b.name, 'uz'),
        ),
      )
      cancelEditClass()
    } catch (e) {
      setCatalogActionError(e instanceof Error ? e.message : 'Sinf saqlanmadi')
    } finally {
      setClassBusyId(null)
    }
  }

  async function removeClass(row: ClassRow) {
    if (
      !window.confirm(
        `«${row.name}» sinfini o‘chirishni tasdiqlaysizmi? Shu sinfga bog‘langan darslar bo‘lsa, o‘chirish rad etiladi.`,
      )
    ) {
      return
    }
    setClassBusyId(row.id)
    setCatalogActionError(null)
    try {
      await deleteClass(row.id)
      if (editingClassId === row.id) {
        cancelEditClass()
      }
      await loadAll()
      await loadRegisteredUsers()
    } catch (e) {
      setCatalogActionError(e instanceof Error ? e.message : 'Sinf o‘chirilmadi')
    } finally {
      setClassBusyId(null)
    }
  }

  function beginEditSubject(row: SubjectRow) {
    setCatalogActionError(null)
    setEditingClassId(null)
    setClassEditDraft('')
    setEditingSubjectId(row.id)
    setSubjectEditDraft(row.name)
  }

  function cancelEditSubject() {
    setEditingSubjectId(null)
    setSubjectEditDraft('')
  }

  async function commitEditSubject() {
    if (!editingSubjectId) {
      return
    }
    setSubjectBusyId(editingSubjectId)
    setCatalogActionError(null)
    try {
      const updated = await updateSubject(editingSubjectId, subjectEditDraft)
      setSubjects((prev) =>
        [...prev.map((s) => (s.id === updated.id ? updated : s))].sort((a, b) =>
          a.name.localeCompare(b.name, 'uz'),
        ),
      )
      cancelEditSubject()
    } catch (e) {
      setCatalogActionError(e instanceof Error ? e.message : 'Fan saqlanmadi')
    } finally {
      setSubjectBusyId(null)
    }
  }

  async function removeSubject(row: SubjectRow) {
    if (
      !window.confirm(
        `«${row.name}» fanini o‘chirishni tasdiqlaysizmi? Shu fanga bog‘langan darslar bo‘lsa, o‘chirish rad etiladi.`,
      )
    ) {
      return
    }
    setSubjectBusyId(row.id)
    setCatalogActionError(null)
    try {
      await deleteSubject(row.id)
      if (editingSubjectId === row.id) {
        cancelEditSubject()
      }
      await loadAll()
    } catch (e) {
      setCatalogActionError(e instanceof Error ? e.message : 'Fan o‘chirilmadi')
    } finally {
      setSubjectBusyId(null)
    }
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        title="Sinflar va fanlar"
        description={
          <>
            Maktab sinflari (masalan, 5-sinf) va fanlar (masalan, Matematika) — qo‘shish, tahrirlash va o‘chirish.
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <StatCard
          label="Ro‘yxatdan o‘tganlar"
          value={usersLoading ? '…' : registeredUsers.length}
          hint="Auth + profil (barcha rollar)"
        />
      </div>

      {listError ? (
        <Card className="border-red-200 bg-red-50/60 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
          {listError}
        </Card>
      ) : null}

      {catalogActionError ? (
        <Card className="border-red-200 bg-red-50/60 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
          {catalogActionError}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700/80">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Sinflar</h2>
            <Button
              type="button"
              disabled={!!classBusyId || !!subjectBusyId || !!editingClassId || !!editingSubjectId}
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
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Nomi</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Yaratilgan</th>
                  <th className="px-5 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {listLoading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                      Yuklanmoqda…
                    </td>
                  </tr>
                ) : classes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                      Hozircha sinf yo‘q. Yuqoridagi tugma orqali qo‘shing.
                    </td>
                  </tr>
                ) : (
                  classes.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      {editingClassId === row.id ? (
                        <>
                          <td className="px-5 py-3">
                            <input
                              type="text"
                              value={classEditDraft}
                              onChange={(ev) => setClassEditDraft(ev.target.value)}
                              className="w-full min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                              aria-label="Sinf nomi"
                              autoFocus
                            />
                          </td>
                          <td className="hidden px-5 py-3 text-slate-600 dark:text-slate-400 sm:table-cell">
                            {formatDate(row.created_at)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={classBusyId === row.id}
                                onClick={() => {
                                  cancelEditClass()
                                }}
                              >
                                Bekor
                              </Button>
                              <Button
                                type="button"
                                disabled={classBusyId === row.id}
                                onClick={() => {
                                  void commitEditClass()
                                }}
                              >
                                {classBusyId === row.id ? 'Saqlanmoqda…' : 'Saqlash'}
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                            {row.name}
                          </td>
                          <td className="hidden px-5 py-3 text-slate-600 dark:text-slate-400 sm:table-cell">
                            {formatDate(row.created_at)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                className="px-3 py-2"
                                disabled={
                                  !!classBusyId ||
                                  !!subjectBusyId ||
                                  (!!editingClassId && editingClassId !== row.id) ||
                                  !!editingSubjectId
                                }
                                onClick={() => {
                                  beginEditClass(row)
                                }}
                              >
                                Tahrirlash
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="px-3 py-2 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                                disabled={
                                  !!classBusyId ||
                                  !!subjectBusyId ||
                                  !!editingClassId ||
                                  !!editingSubjectId
                                }
                                onClick={() => {
                                  void removeClass(row)
                                }}
                              >
                                {classBusyId === row.id ? '…' : 'O‘chirish'}
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
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
              disabled={!!classBusyId || !!subjectBusyId || !!editingClassId || !!editingSubjectId}
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
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Nomi</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Yaratilgan</th>
                  <th className="px-5 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {listLoading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                      Yuklanmoqda…
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                      Hozircha fan yo‘q. Yuqoridagi tugma orqali qo‘shing.
                    </td>
                  </tr>
                ) : (
                  subjects.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      {editingSubjectId === row.id ? (
                        <>
                          <td className="px-5 py-3">
                            <input
                              type="text"
                              value={subjectEditDraft}
                              onChange={(ev) => setSubjectEditDraft(ev.target.value)}
                              className="w-full min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                              aria-label="Fan nomi"
                              autoFocus
                            />
                          </td>
                          <td className="hidden px-5 py-3 text-slate-600 dark:text-slate-400 sm:table-cell">
                            {formatDate(row.created_at)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={subjectBusyId === row.id}
                                onClick={() => {
                                  cancelEditSubject()
                                }}
                              >
                                Bekor
                              </Button>
                              <Button
                                type="button"
                                disabled={subjectBusyId === row.id}
                                onClick={() => {
                                  void commitEditSubject()
                                }}
                              >
                                {subjectBusyId === row.id ? 'Saqlanmoqda…' : 'Saqlash'}
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                            {row.name}
                          </td>
                          <td className="hidden px-5 py-3 text-slate-600 dark:text-slate-400 sm:table-cell">
                            {formatDate(row.created_at)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                className="px-3 py-2"
                                disabled={
                                  !!classBusyId ||
                                  !!subjectBusyId ||
                                  (!!editingSubjectId && editingSubjectId !== row.id) ||
                                  !!editingClassId
                                }
                                onClick={() => {
                                  beginEditSubject(row)
                                }}
                              >
                                Tahrirlash
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="px-3 py-2 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                                disabled={
                                  !!classBusyId ||
                                  !!subjectBusyId ||
                                  !!editingClassId ||
                                  !!editingSubjectId
                                }
                                onClick={() => {
                                  void removeSubject(row)
                                }}
                              >
                                {subjectBusyId === row.id ? '…' : 'O‘chirish'}
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          O‘qituvchilarga fan biriktirish
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Tanlangan fanlar o‘qituvchi panelida dars yaratishda ko‘rinadi. Hech biri tanlanmasa — barcha
          katalog fanlari ochiq (oldingi tartib). Jadval yo‘q bo‘lsa:{' '}
          <code className="font-mono text-[11px]">20260430100000_teacher_subjects.sql</code>.
        </p>
        {tsError ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
            {tsError}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="ts-teacher"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              O‘qituvchi
            </label>
            <select
              id="ts-teacher"
              className="mt-1.5 block w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              value={tsTeacherId}
              disabled={usersLoading || !!classBusyId || !!subjectBusyId}
              onChange={(ev) => {
                setTsTeacherId(ev.target.value)
              }}
            >
              <option value="">— Tanlang —</option>
              {registeredUsers
                .filter((u) => u.role === 'teacher')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {(t.email || t.full_name?.trim() || t.id).slice(0, 72)}
                  </option>
                ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={
              !tsTeacherId ||
              tsSaving ||
              tsLoading ||
              usersLoading ||
              !!classBusyId ||
              !!subjectBusyId
            }
            onClick={() => {
              void handleSaveTeacherSubjects()
            }}
          >
            {tsSaving ? 'Saqlanmoqda…' : 'Fanlarni saqlash'}
          </Button>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Fanlar
          </p>
          {!tsTeacherId ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Avvalo o‘qituvchini tanlang.</p>
          ) : tsLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Fanlar yuklanmoqda…</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Katalogda fan yo‘q. Yuqoridan fan qo‘shing.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800/40">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-slate-300 text-slate-900"
                      checked={tsSubjectIds.includes(s.id)}
                      disabled={tsSaving}
                      onChange={() => {
                        toggleTeacherSubject(s.id)
                      }}
                    />
                    <span className="text-slate-800 dark:text-slate-200">{s.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/80">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Ro‘yxatdan o‘tganlar va rollar
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Har bir foydalanuvchini <strong>o‘quvchi</strong> yoki <strong>o‘qituvchi</strong> qilib
              belgilang. Administratorlarni bu yerda o‘zgartirib bo‘lmaydi (SQL orqali).
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={usersLoading || !!roleSavingId || !!assigningId}
            onClick={() => {
              void loadRegisteredUsers()
            }}
          >
            Ro‘yxatni yangilash
          </Button>
        </div>
        {usersLoadError ? (
          <div className="border-b border-red-100 bg-red-50/60 px-5 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/40 dark:text-red-100">
            {usersLoadError}
            <p className="mt-2 text-xs opacity-90">
              Agar «function does not exist» bo‘lsa, SQL Editor’da ketma-ket:{' '}
              <code className="font-mono">20260428100000_admin_list_and_set_role.sql</code>,{' '}
              <code className="font-mono">20260429120000_admin_list_users_class_columns.sql</code>
            </p>
          </div>
        ) : null}
        {saveRoleError ? (
          <div className="border-b border-red-100 bg-red-50/60 px-5 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/40 dark:text-red-100">
            <span className="font-semibold">Rol saqlanmadi. </span>
            {saveRoleError}
            <p className="mt-2 text-xs opacity-90">
              Agar xabar funksiya haqida bo‘lsa, shu faylda <code className="font-mono">admin_set_profile_role</code>{' '}
              ham borligini tekshiring (bir marta butun migratsiyani ishga tushiring).
            </p>
          </div>
        ) : null}
        {!usersLoadError && userListUsedFallback && registeredUsers.length > 0 ? (
          <div className="border-b border-amber-200 bg-amber-50/70 px-5 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/35 dark:text-amber-100">
            <strong>Eslatma:</strong> ro‘yxat vaqtincha <code className="rounded bg-white/70 px-1 font-mono text-xs dark:bg-slate-900/60">profiles</code> dan yuklanmoqda (email ko‘rinmaydi). Rolni o‘zgartirish ham shu SQL funksiyasiga bog‘liq — Dashboard → SQL Editor’da{' '}
            <code className="font-mono text-xs">20260428100000_admin_list_and_set_role.sql</code> va{' '}
            <code className="font-mono text-xs">20260429120000_admin_list_users_class_columns.sql</code> ni
            ishga tushiring, so‘ng <strong>Ro‘yxatni yangilash</strong>.
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Ism</th>
                <th className="px-5 py-3">Rol</th>
                <th
                  className="max-w-[240px] px-5 py-3"
                  title="O‘quvchi: biriktirilgan sinf. O‘qituvchi: dars joylashtirilgan sinflar."
                >
                  Sinf
                </th>
                <th
                  className="max-w-[220px] px-5 py-3"
                  title="Faqat o‘qituvchi: admin biriktirgan fanlar."
                >
                  Fanlar
                </th>
                <th className="hidden px-5 py-3 md:table-cell">Ro‘yxatdan o‘tgan</th>
                <th className="px-5 py-3">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : registeredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    Hozircha foydalanuvchi yo‘q.
                  </td>
                </tr>
              ) : (
                registeredUsers.map((u) => {
                  const isAdmin = u.role === 'admin'
                  const selectValue = (roleDraft[u.id] ?? (u.role === 'teacher' ? 'teacher' : 'student')) as
                    | 'student'
                    | 'teacher'
                  const roleDirty = !isAdmin && selectValue !== u.role

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                          {u.email || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {u.full_name?.trim() ? u.full_name : 'Ismsiz'}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                          {u.id}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {isAdmin ? (
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
                            Administrator
                          </span>
                        ) : (
                          <select
                            className="max-w-[200px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                            value={selectValue}
                            disabled={
                              userListUsedFallback || !!roleSavingId || !!assigningId
                            }
                            onChange={(ev) => {
                              const v = ev.target.value === 'teacher' ? 'teacher' : 'student'
                              setRoleDraft((d) => ({ ...d, [u.id]: v }))
                            }}
                          >
                            <option value="student">O‘quvchi</option>
                            <option value="teacher">O‘qituvchi</option>
                          </select>
                        )}
                      </td>
                      <td
                        className="max-w-[240px] px-5 py-3 align-top text-sm text-slate-700 dark:text-slate-300"
                        title={displayUserClassColumn(u)}
                      >
                        <span className="line-clamp-3 wrap-break-word">{displayUserClassColumn(u)}</span>
                      </td>
                      <td
                        className="max-w-[220px] px-5 py-3 align-top text-sm text-slate-700 dark:text-slate-300"
                        title={displayUserSubjectsColumn(u)}
                      >
                        <span className="line-clamp-3 wrap-break-word">{displayUserSubjectsColumn(u)}</span>
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 dark:text-slate-400 md:table-cell">
                        {formatDate(u.registered_at)}
                      </td>
                      <td className="px-5 py-3">
                        {isAdmin ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        ) : (
                          <Button
                            type="button"
                            disabled={
                              userListUsedFallback ||
                              !!roleSavingId ||
                              !!assigningId ||
                              !roleDirty ||
                              roleSavingId === u.id
                            }
                            onClick={() => {
                              void handleSaveRole(u)
                            }}
                          >
                            {roleSavingId === u.id ? 'Saqlanmoqda…' : 'Rolni saqlash'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
            disabled={usersLoading || !!assigningId || !!roleSavingId}
            onClick={() => {
              void loadRegisteredUsers()
            }}
          >
            Ro‘yxatni yangilash
          </Button>
        </div>
        {assignClassError ? (
          <div className="border-b border-red-100 bg-red-50/60 px-5 py-3 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-950/40 dark:text-red-100">
            <span className="font-semibold">Sinf biriktirilmadi. </span>
            {assignClassError}
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
              {usersLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : studentRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    Hozircha <code className="font-mono text-xs">role = student</code> profillar yo‘q.
                    Yuqoridagi jadvaldan foydalanuvchini o‘quvchi qilib belgilang.
                  </td>
                </tr>
              ) : (
                studentRows.map((st) => {
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
      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          O‘quvchilarga fan biriktirish
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Agar o‘quvchiga fanlar biriktirilsa, u faqat shu fanlarni ko‘radi. Hech narsa
          tanlanmasa — o‘z sinfidagi barcha darslar mavjud fanlar ko‘rinadi.
        </p>
        {ssError ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
            {ssError}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="ss-student"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              O‘quvchi
            </label>
            <select
              id="ss-student"
              className="mt-1.5 block w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              value={ssStudentId}
              disabled={usersLoading || !!classBusyId || !!subjectBusyId}
              onChange={(ev) => {
                setSsStudentId(ev.target.value)
              }}
            >
              <option value="">— Tanlang —</option>
              {registeredUsers
                .filter((u) => u.role === 'student')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {(s.email || s.full_name?.trim() || s.id).slice(0, 72)}
                  </option>
                ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={
              !ssStudentId ||
              ssSaving ||
              ssLoading ||
              usersLoading ||
              !!classBusyId ||
              !!subjectBusyId
            }
            onClick={() => {
              void handleSaveStudentSubjects()
            }}
          >
            {ssSaving ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
        </div>

        {ssStudentId && (
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800/60">
            <h3 className="mb-3 text-sm font-medium text-slate-900 dark:text-white">
              Fanlarni tanlang:
            </h3>
            {ssLoading ? (
              <p className="text-xs text-slate-500">Yuklanmoqda…</p>
            ) : subjects.length === 0 ? (
              <p className="text-xs text-slate-500">Katalogda fanlar yo‘q.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => {
                  const isActive = ssSubjectIds.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={ssSaving}
                      onClick={() => toggleStudentSubject(s.id)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        isActive
                          ? 'border-sky-600 bg-sky-600 text-white dark:border-sky-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
                      )}
                    >
                      {s.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>

  )
}
