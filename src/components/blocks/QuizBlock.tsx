"use client";

import { learnerStore, useLearnerState } from "@/hooks/stores";
import type { QuizQuestion } from "@/content/schema";
import { IconCheck, IconX } from "@/components/icons";
import { useLesson } from "@/components/lesson/LessonContext";
import { recordQuizAnswer, resetQuiz } from "@/lib/progress";

export function QuizBlock({ questions }: { questions: QuizQuestion[] }) {
  const { slug, ui } = useLesson();
  const state = useLearnerState();
  const answers = state.lessons[slug]?.quizAnswers ?? {};
  const answered = questions.filter((q) => answers[q.id]);
  const correct = answered.filter((q) => answers[q.id] === q.correctOptionId).length;

  return (
    <div className="space-y-5" data-testid="quiz">
      {questions.map((question, qi) => {
        const chosen = answers[question.id];
        const chosenOption = question.options.find((o) => o.id === chosen);
        const isCorrect = chosen === question.correctOptionId;
        return (
          <fieldset key={question.id} className="rounded-2xl border border-line bg-surface p-4" data-testid={`quiz-${question.id}`}>
            <legend className="sr-only">{ui.quiz.question(qi + 1, questions.length)}</legend>
            <p className="text-[0.8em] font-medium uppercase tracking-wide text-ink-3" aria-hidden="true">
              {ui.quiz.question(qi + 1, questions.length)}
            </p>
            <p className="mt-1 font-medium">{question.prompt}</p>
            <div className="mt-3 space-y-2">
              {question.options.map((option) => {
                const selected = chosen === option.id;
                const showRight = !!chosen && option.id === question.correctOptionId;
                const showWrong = selected && !isCorrect;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => learnerStore.set((s) => recordQuizAnswer(s, slug, question.id, option.id))}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-[0.95em] transition-colors ${
                      showRight
                        ? "border-ok bg-ok-soft"
                        : showWrong
                          ? "border-bad bg-bad-soft"
                          : "border-line active:bg-surface-2"
                    }`}
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-xs font-semibold uppercase text-ink-2">
                      {showRight ? <IconCheck size={14} /> : showWrong ? <IconX size={14} /> : option.id}
                    </span>
                    <span>{option.text}</span>
                  </button>
                );
              })}
            </div>
            <div aria-live="polite">
              {chosenOption ? (
                <p
                  className={`mt-3 flex gap-2 rounded-xl px-3 py-2 text-[0.92em] ${isCorrect ? "bg-ok-soft" : "bg-bad-soft"}`}
                  data-testid="quiz-feedback"
                >
                  {/* The feedback text carries its own wording; the verdict is an icon + SR text. */}
                  <span className={`mt-[0.2em] shrink-0 ${isCorrect ? "text-ok" : "text-bad"}`} aria-hidden="true">
                    {isCorrect ? <IconCheck size={18} /> : <IconX size={18} />}
                  </span>
                  <span>
                    <span className="sr-only">{isCorrect ? ui.quiz.correct : ui.quiz.incorrect}: </span>
                    {chosenOption.feedback}
                  </span>
                </p>
              ) : null}
            </div>
          </fieldset>
        );
      })}
      {answered.length > 0 ? (
        <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <p className="font-medium" data-testid="quiz-score">{ui.quiz.score(correct, questions.length)}</p>
          <button
            type="button"
            onClick={() => learnerStore.set((s) => resetQuiz(s, slug))}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-accent"
          >
            {ui.quiz.retry}
          </button>
        </div>
      ) : null}
    </div>
  );
}
