import { useCallback, useEffect, useState, useMemo } from "react";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import {
  fetchTeacherResults,
  type TeacherResultRow,
} from "@/services/teacherStats.service";
import { fetchMyLessons } from "@/services/teacherLesson.service";
import type { TeacherLessonRow } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

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

export default function TeacherResultsPage() {
  const { user } = useAuth();
  const teacherId = user?.id;

  const [activeTab, setActiveTab] = useState<"results" | "analytics">(
    "results",
  );
  const [results, setResults] = useState<TeacherResultRow[]>([]);
  const [lessons, setLessons] = useState<TeacherLessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!teacherId) return;
    setError(null);
    setLoading(true);
    try {
      const [resData, lessonData] = await Promise.all([
        fetchTeacherResults(teacherId),
        fetchMyLessons(),
      ]);
      setResults(resData);
      setLessons(lessonData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ma’lumotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    if (results.length === 0) return { avg: 0, total: 0, successful: 0 };
    const avg = Math.round(
      results.reduce((acc, r) => acc + (r.score / r.total_questions) * 100, 0) /
        results.length,
    );
    const successful = results.filter(
      (r) => r.score / r.total_questions >= 0.6,
    ).length;
    return { avg, total: results.length, successful };
  }, [results]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Natijalar va Analitika"
        description="O‘quvchilarning o‘zlashtirishi va darslaringiz bo‘yicha batafsil statistik ma’lumotlar."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jami urinishlar"
          value={loading ? "…" : stats.total}
          hint="Barcha test topshirishlar"
        />
        <StatCard
          label="O‘rtacha natija"
          value={loading ? "…" : `${stats.avg}%`}
          hint="Barcha urinishlar o‘rtachasi"
        />
        <StatCard
          label="Muvaffaqiyatli"
          value={loading ? "…" : stats.successful}
          hint="60% dan yuqori ball olganlar"
        />
        <StatCard
          label="Jami darslar"
          value={loading ? "…" : lessons.length}
          hint="Siz yaratgan darslar soni"
        />
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("results")}
          className={cn(
            "px-6 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "results"
              ? "border-sky-600 text-sky-600 dark:border-teal-400 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300",
          )}
        >
          Natijalar jadvali
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={cn(
            "px-6 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "analytics"
              ? "border-sky-600 text-sky-600 dark:border-teal-400 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300",
          )}
        >
          Analitika va Hisobotlar
        </button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </Card>
      )}

      {activeTab === "results" && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 bg-slate-50/90 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    O‘quvchi
                  </th>
                  <th className="px-6 py-4 bg-slate-50/90 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    Dars / Fan
                  </th>
                  <th className="px-6 py-4 bg-slate-50/90 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    Urinish
                  </th>
                  <th className="px-6 py-4 bg-slate-50/90 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    Natija
                  </th>
                  <th className="px-6 py-4 bg-slate-50/90 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    Sana
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Hozircha natijalar yo‘q.
                    </td>
                  </tr>
                ) : (
                  results.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {r.student_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {r.class_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {r.lesson_title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {r.subject_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-800 dark:text-slate-200">
                        {r.attempt_number}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                            r.score / r.total_questions >= 0.8
                              ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                              : r.score / r.total_questions >= 0.6
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                          )}
                        >
                          {r.score} / {r.total_questions} (
                          {Math.round((r.score / r.total_questions) * 100)}%)
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatWhen(r.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "analytics" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Eng ko‘p ko‘rilgan darslar
            </h3>
            <div className="mt-4 space-y-4">
              {[...lessons]
                .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                .slice(0, 5)
                .map((l, i) => (
                  <div key={l.id} className="flex items-center gap-4">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {l.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {l.views_count || 0} marta ko‘rildi
                      </div>
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full bg-sky-500"
                        style={{
                          width: `${Math.min(100, ((l.views_count || 0) / (Math.max(...lessons.map((x) => x.views_count || 0)) || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              {lessons.length === 0 && (
                <p className="text-sm text-slate-500">Ma’lumot yo‘q</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              O‘zlashtirish reytingi (Top 5 o‘quvchi)
            </h3>
            <div className="mt-4 space-y-4">
              {Object.entries(
                results.reduce(
                  (acc, r) => {
                    if (!acc[r.student_name])
                      acc[r.student_name] = { score: 0, count: 0 };
                    acc[r.student_name].score +=
                      (r.score / r.total_questions) * 100;
                    acc[r.student_name].count += 1;
                    return acc;
                  },
                  {} as Record<string, { score: number; count: number }>,
                ),
              )
                .map(([name, data]) => ({ name, avg: data.score / data.count }))
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 5)
                .map((student, i) => (
                  <div key={student.name} className="flex items-center gap-4">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-600 dark:bg-amber-950/30">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {student.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        O‘rtacha natija: {Math.round(student.avg)}%
                      </div>
                    </div>
                    <div className="text-sm font-bold text-sky-600 dark:text-teal-400">
                      {Math.round(student.avg)}%
                    </div>
                  </div>
                ))}
              {results.length === 0 && (
                <p className="text-sm text-slate-500">Natijalar yo‘q</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
