// What the browser is allowed to see: rendered HTML, never answers, solutions or mistake maps.
// Grading happens on the server (src/app/learn/actions.ts).

export type PublicFigure = { svg: string; alt: string }; // svg passed checkSvg (whitelist, theme colours)

/** S5 C3: a proof line is text segments and blanks (0-based). */
export type ProofSeg = { html: string } | { blank: number };

export type PublicItem = {
  id: string;
  type: "mcq" | "numeric" | "steps" | "analysis" | "proof" | "order";
  level: "L1" | "L2" | "L3";
  promptHtml: string;
  optionsHtml?: string[];
  unit?: string;
  /** LT5: the steps of a multi-step item, each one answer box. S5 analysis: the levels (prompt = the level's ask). */
  steps?: { promptHtml: string; item: PublicItem }[];
  figure?: PublicFigure;
  /** AI2: pre-written hints H1–H3 — practice items only (never exit; review gets them after answering). */
  hintsHtml?: string[];
  /** S5 analysis: the statement to prove. */
  goalHtml?: string;
  /** S5 C3: lines split into text and blanks; the bank in shown order. */
  proofLines?: ProofSeg[][];
  bankHtml?: string[];
  /** S5 C2: lines + distractors in shown order; how many are distractors. */
  orderLinesHtml?: string[];
  extraCount?: number;
  /** S5: fold the figure until the student drew it on paper. */
  drawFirst?: boolean;
};

export type PublicFadedStep = { kind: "text"; html: string } | { kind: "blank"; promptHtml: string; item: PublicItem };

export type PublicUnit = {
  id: string;
  moduleTitle: string;
  title: string;
  status: "draft" | "approved";
  estMinutes: number;
  figure?: "right-triangle-altitude";
  figureSvg?: PublicFigure;
  theoryHtml: string[];
  worked: {
    problemHtml: string;
    /** S5: the backward-analysis ladder of the worked example. */
    analysis?: { goalHtml: string; steps: { askHtml: string; nodeHtml: string }[] };
    steps: { html: string; whyHtml?: string }[];
    selfExplainHtml: string;
  };
  faded: { problemHtml: string; steps: PublicFadedStep[] };
  practice: PublicItem[];
  exit: PublicItem[];
  /** S5: a track C proof KU — the lesson links the Sổ tay. */
  proofKu?: boolean;
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
      /** LT5: right / wrong per step of a multi-step item. */
      steps?: boolean[];
      /** S5 analysis, level check: the fact this level leads to (hidden while the unit's review is due and the pick was wrong). */
      nodeHtml?: string;
      /** S5 analysis, whole item: the forward write-up outline. */
      outlineHtml?: string[];
      /** S5 C3: right / wrong per blank. */
      parts?: boolean[];
      /** S5 C2: the first wrong line (0-based). */
      at?: number;
      /** LT16: wrong because of an earlier KU → "Ôn lại: <title>" (read-only recap). */
      review?: { unitId: string; title: string };
      /** AI2: review only, after answering. */
      hintsHtml?: string[];
      /** Practice, real student only: mastery right after this answer (for the level nudge). */
      mastery?: { level: number; practiceCount: number; practiceRight: number; confirmed: boolean };
    };

export type ExitResult =
  | { ok: false; message: string }
  | {
      ok: true;
      score: number;
      total: number;
      items: { id: string; correct: boolean; answer: string; answerHtml?: string; feedbackHtml?: string; solutionHtml: string }[];
      /** LT4: set when this was a test-out attempt. */
      testOut?: { passed: boolean };
      /** Set when this result reached M3 and the first review (D+1) was scheduled. */
      nextReviewOn?: string;
    };

/** One question of a mixed review session (D14). */
export type ReviewQuestion = { unitId: string; unitTitle: string; item: PublicItem; /** LT7: the unit's SVG figure */ figure?: PublicFigure };

export type ReviewSummary =
  | { ok: false; message: string }
  | { ok: true; units: { unitId: string; correct: number; total: number; passed: boolean; nextDueOn: string; completed: boolean }[] };
