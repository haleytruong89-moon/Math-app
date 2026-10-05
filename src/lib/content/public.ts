// What the browser is allowed to see: rendered HTML, never answers, solutions or mistake maps.
// Grading happens on the server (src/app/learn/actions.ts).

export type PublicItem = {
  id: string;
  type: "mcq" | "numeric";
  level: "L1" | "L2";
  promptHtml: string;
  optionsHtml?: string[];
  unit?: string;
};

export type PublicFadedStep = { kind: "text"; html: string } | { kind: "blank"; promptHtml: string; item: PublicItem };

export type PublicUnit = {
  id: string;
  moduleTitle: string;
  title: string;
  status: "draft" | "approved";
  estMinutes: number;
  figure?: "right-triangle-altitude";
  theoryHtml: string[];
  worked: { problemHtml: string; steps: { html: string; whyHtml?: string }[]; selfExplainHtml: string };
  faded: { problemHtml: string; steps: PublicFadedStep[] };
  practice: PublicItem[];
  exit: PublicItem[];
};

export type CheckResult =
  | { ok: false; message: string }
  | { ok: true; understood: false }
  | {
      ok: true;
      understood: true;
      correct: boolean;
      feedbackHtml?: string;
      solutionHtml?: string;
      /** What the student entered (escaped / MCQ option text). */
      answerHtml?: string;
      /** The right answer — only when the solution may be shown (faded steps keep their reveal rule). */
      correctHtml?: string;
      errorCode?: string | null;
      /** Practice, real student only: mastery right after this answer (for the level nudge). */
      mastery?: { level: number; practiceCount: number; practiceRight: number; confirmed: boolean };
    };

export type ExitResult =
  | { ok: false; message: string }
  | {
      ok: true;
      score: number;
      total: number;
      items: { id: string; correct: boolean; answer: string; feedbackHtml?: string; solutionHtml: string }[];
      /** LT4: set when this was a test-out attempt. */
      testOut?: { passed: boolean };
      /** Set when this result reached M3 and the first review (D+1) was scheduled. */
      nextReviewOn?: string;
    };

/** One question of a mixed review session (D14). */
export type ReviewQuestion = { unitId: string; unitTitle: string; item: PublicItem };

export type ReviewSummary =
  | { ok: false; message: string }
  | { ok: true; units: { unitId: string; correct: number; total: number; passed: boolean; nextDueOn: string; completed: boolean }[] };
