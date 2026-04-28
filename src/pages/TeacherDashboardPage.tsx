import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DocumentViewer } from "@/components/DocumentViewer";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/hooks/useAuth";
import { fetchClasses, fetchSubjects } from "@/services/classSubject.service";
import {
  createLesson,
  deleteLesson,
  fetchMyLessons,
  updateLesson,
  uploadMaterial,
} from "@/services/teacherLesson.service";
import { fetchTeacherSubjectIds } from "@/services/teacherSubject.service";
import { fetchClassSubjectIds } from "@/services/classSubjectAssignment.service";
import type { ClassRow, SubjectRow, TeacherLessonRow } from "@/types";
import { cn } from "@/utils/cn";
import { getYouTubeEmbedUrl } from "@/utils/youtube";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("uz-UZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function selectClassName() {
  return "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400/20";
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const teacherId = user?.id;

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [lessons, setLessons] = useState<TeacherLessonRow[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjectRestrict, setSubjectRestrict] = useState<
    "pending" | "none" | "limited"
  >("pending");
  const [limitedSubjectIds, setLimitedSubjectIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [classSubjectIds, setClassSubjectIds] = useState<string[]>([]);
  const [csLoading, setCsLoading] = useState(false);
  const [quarter, setQuarter] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [viewingMaterialUrl, setViewingMaterialUrl] = useState<string | null>(
    null,
  );

  const [filterClassId, setFilterClassId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterQuarter, setFilterQuarter] = useState("");

  const classNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of classes) {
      m.set(c.id, c.name);
    }
    return m;
  }, [classes]);

  const subjectNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of subjects) {
      m.set(s.id, s.name);
    }
    return m;
  }, [subjects]);

  const subjectChoices = useMemo(() => {
    let list = subjects;
    if (subjectRestrict === "limited") {
      list = list.filter((s) => limitedSubjectIds.includes(s.id));
    }
    if (classSubjectIds.length > 0) {
      list = list.filter((s) => classSubjectIds.includes(s.id));
    }
    return list;
  }, [subjects, subjectRestrict, limitedSubjectIds, classSubjectIds]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      if (filterClassId && l.class_id !== filterClassId) return false;
      if (filterSubjectId && l.subject_id !== filterSubjectId) return false;
      if (filterQuarter && String(l.quarter) !== filterQuarter) return false;
      return true;
    });
  }, [lessons, filterClassId, filterSubjectId, filterQuarter]);

  const loadCatalog = useCallback(async () => {
    setListError(null);
    setCatalogLoading(true);
    try {
      const [c, s] = await Promise.all([fetchClasses(), fetchSubjects()]);
      setClasses(c);
      setSubjects(s);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Katalog yuklanmadi");
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadLessons = useCallback(async () => {
    setListError(null);
    setLessonsLoading(true);
    try {
      const rows = await fetchMyLessons();
      setLessons(rows);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Darslar yuklanmadi");
    } finally {
      setLessonsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
    void loadLessons();
  }, [loadCatalog, loadLessons]);

  useEffect(() => {
    if (!teacherId) return;
    void fetchTeacherSubjectIds(teacherId).then((ids) => {
      if (ids.length > 0) {
        setSubjectRestrict("limited");
        setLimitedSubjectIds(ids);
      } else {
        setSubjectRestrict("none");
      }
    });
  }, [teacherId]);

  useEffect(() => {
    if (!classId) {
      setClassSubjectIds([]);
      return;
    }
    setCsLoading(true);
    void fetchClassSubjectIds(classId)
      .then((ids) => setClassSubjectIds(ids))
      .finally(() => setCsLoading(false));
  }, [classId]);

  async function handleCreateLesson(ev: React.FormEvent) {
    ev.preventDefault();
    if (!teacherId) return;
    setSaving(true);
    setFormError(null);

    try {
      let finalMaterialUrl = materialUrl;
      if (materialFile) {
        finalMaterialUrl = await uploadMaterial(materialFile);
      }

      const lesson = await createLesson({
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId,
        title,
        description,
        video_url: videoUrl,
        material_url: finalMaterialUrl,
        quarter: quarter ? Number(quarter) : undefined,
      });

      setLessons([lesson, ...lessons]);
      cancelEdit();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Dars yaratilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateLesson(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editingLessonId) return;
    setSaving(true);
    setFormError(null);

    try {
      let finalMaterialUrl = materialUrl;
      if (materialFile) {
        finalMaterialUrl = await uploadMaterial(materialFile);
      }

      const updated = await updateLesson(editingLessonId, {
        class_id: classId,
        subject_id: subjectId,
        title,
        description,
        video_url: videoUrl,
        material_url: finalMaterialUrl,
        quarter: quarter ? Number(quarter) : undefined,
      });

      setLessons((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l)),
      );
      cancelEdit();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Dars yangilanmadi");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(lesson: TeacherLessonRow) {
    setEditingLessonId(lesson.id);
    setClassId(lesson.class_id);
    setSubjectId(lesson.subject_id);
    setTitle(lesson.title);
    setDescription(lesson.description || "");
    setVideoUrl(lesson.video_url || "");
    setMaterialUrl(lesson.material_url || "");
    setQuarter(lesson.quarter ? String(lesson.quarter) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingLessonId(null);
    setClassId("");
    setSubjectId("");
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setMaterialUrl("");
    setMaterialFile(null);
    setQuarter("");
  }

  async function handleDelete(lessonId: string) {
    if (
      !window.confirm("Haqiqatan ham ushbu darsni o‘chirib tashlamoqchimisiz?")
    )
      return;
    try {
      await deleteLesson(lessonId);
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "O‘chirishda xatolik yuz berdi",
      );
    }
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        title="O‘qituvchi boshqaruvi"
        description="Sinf va fanni tanlab, video va material havolalari bilan yangi dars yarating."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Mening darslarim"
          value={lessonsLoading ? "…" : lessons.length}
          hint="Jami yaratilgan darslar"
        />
        <StatCard
          label="Sinflar"
          value={catalogLoading ? "…" : classes.length}
          hint="Administrator katalogidan"
        />
        <StatCard
          label="Fanlar"
          value={
            catalogLoading || subjectRestrict === "pending"
              ? "…"
              : subjectRestrict === "limited"
                ? subjectChoices.length
                : subjects.length
          }
          hint={
            subjectRestrict === "limited"
              ? "Sizga biriktirilgan fanlar"
              : "Darsga biriktirish uchun"
          }
        />
      </div>

      {listError && (
        <Card className="border-red-200 bg-red-50 p-4 text-red-900">
          {listError}
        </Card>
      )}

      {subjectRestrict === "limited" &&
      !catalogLoading &&
      subjectChoices.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50 p-4 text-amber-950">
          Administrator sizga hali fan biriktirmagan. Dars yaratish uchun admin
          bilan bog‘laning.
        </Card>
      ) : null}

      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {editingLessonId ? "Darsni tahrirlash" : "Yangi dars"}
        </h2>
        <form
          className="mt-6 space-y-5"
          onSubmit={editingLessonId ? handleUpdateLesson : handleCreateLesson}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Sinf
              </label>
              <select
                className={selectClassName()}
                value={classId}
                onChange={(ev) => setClassId(ev.target.value)}
                required
                disabled={catalogLoading}
              >
                <option value="">Sinfni tanlang</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Fan
              </label>
              <select
                className={selectClassName()}
                value={subjectId}
                onChange={(ev) => setSubjectId(ev.target.value)}
                required
                disabled={catalogLoading || subjectRestrict === "pending"}
              >
                <option value="">
                  {csLoading ? "Yuklanmoqda..." : "Fanni tanlang"}
                </option>
                {subjectChoices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TextField
            label="Mavzu sarlavhasi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Masalan: Logarifmik tenglamalar"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tavsif (ixtiyoriy)
            </label>
            <textarea
              rows={3}
              className={selectClassName()}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mavzu haqida qisqacha ma’lumot..."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Video havola (YouTube)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Chorak
              </label>
              <select
                className={selectClassName()}
                value={quarter}
                onChange={(ev) => setQuarter(ev.target.value)}
              >
                <option value="">Tanlang</option>
                <option value="1">1-chorak</option>
                <option value="2">2-chorak</option>
                <option value="3">3-chorak</option>
                <option value="4">4-chorak</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <TextField
              label="Material havolasi"
              value={materialUrl}
              onChange={(e) => setMaterialUrl(e.target.value)}
              placeholder="https://example.com/file.pdf"
            />
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              <span className="text-xs font-medium text-slate-400">
                yoki fayl yuklang
              </span>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>
            <input
              type="file"
              className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
              onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
            />
          </div>

          {formError && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saqlanmoqda..."
                : editingLessonId
                  ? "O‘zgarishlarni saqlash"
                  : "Darsni yaratish"}
            </Button>
            {editingLessonId && (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                Bekor qilish
              </Button>
            )}
          </div>
        </form>
      </Card>

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Mening darslarim
          </h2>
          <div className="flex flex-wrap gap-3">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
            >
              <option value="">Barcha sinflar</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
            >
              <option value="">Barcha fanlar</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {lessonsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="h-48 animate-pulse bg-slate-50 dark:bg-slate-900/50"
              />
            ))}
          </div>
        ) : filteredLessons.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              Darslar topilmadi
            </h3>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="group relative flex flex-col overflow-hidden"
              >
                <div className="flex-1 p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/30 dark:text-sky-400">
                      {subjectNameById.get(lesson.subject_id) || "Fan"}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => startEdit(lesson)}
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <svg
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <svg
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="line-clamp-2 font-bold text-slate-900 dark:text-white">
                    {lesson.title}
                  </h3>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{classNameById.get(lesson.class_id) || "Sinf"}</span>
                    {lesson.quarter && <span>{lesson.quarter}-chorak</span>}
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      {lesson.video_url && (
                        <span className="text-[10px] text-red-600">Video</span>
                      )}
                      {lesson.material_url && (
                        <span className="text-[10px] text-sky-600">
                          Material
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formatWhen(lesson.created_at)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={!!viewingMaterialUrl}
        title="Materialni ko‘rish"
        onClose={() => setViewingMaterialUrl(null)}
        className="!max-w-[95vw] w-full"
      >
        {viewingMaterialUrl && <DocumentViewer url={viewingMaterialUrl} />}
      </Modal>
    </div>
  );
}
