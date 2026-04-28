import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  fetchMyResultsForLesson,
  fetchStudentQuizQuestions,
  submitLessonQuiz,
} from "@/services/quiz.service";
import type {
  QuizQuestionStudentView,
  QuizResultRow,
  QuizSubmitRpcResult,
} from "@/types";
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

type LessonQuizSectionProps = {
  lessonId: string;
};

export function LessonQuizSection({ lessonId }: LessonQuizSectionProps) {
  const [questions, setQuestions] = useState<QuizQuestionStudentView[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState<QuizResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmit, setLastSubmit] = useState<QuizSubmitRpcResult | null>(
    null,
  );

  const reload = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [qs, res] = await Promise.all([
        fetchStudentQuizQuestions(lessonId),
        fetchMyResultsForLesson(lessonId),
      ]);
      setQuestions(qs);
      setAttempts(res);
      setAnswers({});
      setLastSubmit(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Test yuklanmadi");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(t);
  }, [reload]);

  function setAnswer(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (attempts.length >= 2) {
      setSubmitError("Faqat 2 marta test topshirish mumkin");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await submitLessonQuiz(lessonId, answers);
      setLastSubmit(result);
      const updated = await fetchMyResultsForLesson(lessonId);
      setAttempts(updated);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Yuborish muvaffaqiyatsiz",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Test yuklanmoqda…
        </p>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="border-amber-200 bg-amber-50/60 p-6 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        {loadError}
      </Card>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-6 p-6 sm:p-8">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Test
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Har bir savol uchun bitta javob belgilang va yuboring. Ball serverda
          hisoblanadi va natijalar bo‘limiga yoziladi.
        </p>
      </div>

      {attempts.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200">
          <p className="font-medium">Avvalgi urinishlar:</p>
          <ol className="mt-2 space-y-2">
            {attempts.map((attempt) => (
              <li
                key={attempt.id}
                className="rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-slate-950/70"
              >
                <span className="font-semibold">
                  {attempt.attempt_number}-urinish:
                </span>{" "}
                {attempt.score} / {attempt.total_questions} —{" "}
                {formatWhen(attempt.created_at)}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {attempts.length >= 2
              ? "Siz testni 2 marta topshirdingiz. Yana yuborish mumkin emas."
              : `Sizda ${2 - attempts.length} ta urinish qoldi.`}
          </p>
        </div>
      ) : null}

      {lastSubmit ? (
        <p
          className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100"
          role="status"
        >
          Oxirgi natija. Ball:{" "}
          <span className="font-semibold">
            {lastSubmit.score} / {lastSubmit.total_questions}
          </span>
          {lastSubmit.attempt_number
            ? ` — ${lastSubmit.attempt_number}-urinish`
            : ""}
          .
        </p>
      ) : null}

      <form className="space-y-8" onSubmit={handleSubmit}>
        {questions.map((q, index) => (
          <fieldset
            key={q.id}
            className="space-y-3 border-b border-slate-100 pb-8 last:border-0 dark:border-slate-700/80"
          >
            <legend className="text-base font-medium text-slate-900 dark:text-white">
              {index + 1}. {q.prompt}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[q.option_1, q.option_2, q.option_3, q.option_4].map(
                (label, i) => {
                  const value = i + 1;
                  const id = `${q.id}-${value}`;
                  return (
                    <label
                      key={id}
                      htmlFor={id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors shadow-sm",
                        answers[q.id] === value
                          ? "border-sky-600 bg-sky-50 dark:border-sky-500 dark:bg-sky-950/50"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500",
                      )}
                    >
                      <input
                        id={id}
                        type="radio"
                        name={`q-${q.id}`}
                        value={value}
                        checked={answers[q.id] === value}
                        onChange={() => setAnswer(q.id, value)}
                        className="mt-0.5"
                      />
                      <span className="text-slate-800 dark:text-slate-200">
                        {label}
                      </span>
                    </label>
                  );
                },
              )}
            </div>
          </fieldset>
        ))}

        {submitError ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting || attempts.length >= 2}>
            {attempts.length >= 2
              ? "Barcha urinishlar qilingan"
              : submitting
                ? "Yuborilmoqda…"
                : "Javoblarni yuborish"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={() => {
              void reload();
            }}
          >
            Formani tiklash
          </Button>
        </div>
      </form>
    </Card>
  );
}
