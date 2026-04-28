import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { fetchResultsDashboard } from "@/services/quiz.service";
import type { ResultDashboardRow } from "@/types";

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

export default function StudentResultsPage() {
  const [rows, setRows] = useState<ResultDashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchResultsDashboard();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Natijalar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const avgRatio =
    rows.length === 0
      ? null
      : rows.reduce(
          (acc, r) =>
            acc + (r.total_questions ? r.score / r.total_questions : 0),
          0,
        ) / rows.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mening natijalarim"
        description="Har bir dars bo‘yicha topshirgan testlaringizdan 2 ta urinish saqlanadi va har biri alohida ko‘rinadi."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Yakunlangan darslar"
          value={
            loading
              ? "…"
              : new Set(rows.map((r) => r.lesson_id).filter(Boolean)).size
          }
          hint="Natijasi bor turli darslar soni"
        />
        <StatCard
          label="O‘rtacha ball (%)"
          value={
            loading || rows.length === 0
              ? loading
                ? "…"
                : "—"
              : `${Math.round(avgRatio! * 100)}%`
          }
          hint="Ko‘rsatilgan barcha urinishlar bo‘yicha"
        />
        <StatCard
          label="Jami qatorlar"
          value={loading ? "…" : rows.length}
          hint="Hisobingiz uchun qaytarilgan yozuvlar"
        />
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50/60 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700/80">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Test tarixi
          </h2>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              void load();
            }}
          >
            Yangilash
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-5 py-3 bg-slate-50/90 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Dars
                </th>
                <th className="px-5 py-3 bg-slate-50/90 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Urinish
                </th>
                <th className="px-5 py-3 bg-slate-50/90 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Ball
                </th>
                <th className="px-5 py-3 bg-slate-50/90 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Sana
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    Hozircha natija yo‘q. Dars sahifasidan test topshirgach,
                    balllaringiz shu yerda ko‘rinadi.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {r.lesson?.title ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-800 dark:text-slate-200">
                      {r.attempt_number}
                    </td>
                    <td className="px-5 py-3 text-slate-800 dark:text-slate-200">
                      {r.score} / {r.total_questions}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                      {formatWhen(r.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
