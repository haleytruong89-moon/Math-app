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
  | { ok: true; understood: true; correct: boolean; feedbackHtml?: string; solutionHtml?: string };

export type ExitResult =
  | { ok: false; message: string }
  | {
      ok: true;
      score: number;
      total: number;
      items: { id: string; correct: boolean; answer: string; feedbackHtml?: string; solutionHtml: string }[];
    };
