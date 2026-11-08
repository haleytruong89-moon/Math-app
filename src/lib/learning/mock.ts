// Thi thử (S9, 07/11/2026, docs/superpowers/specs/2026-11-06-thi-thu-design.md): status, schedule suggestion,
// totals and the KUs that lost points. Pure, so `node --test` covers it.
import { baiOf, MOCK_PAPERS, type MockPart } from "../content/mock.ts";
import type { ProgressProblem } from "../content/progress.ts";

// Kiểm tra tiến bộ (08/11/2026): progress tests share the thi thử tables (`kind`), screens and grading. A part the
// student has not learnt yet can be marked "chưa học" on a progress test — left out of the score instead of 0.
export type ExamKind = "mock" | "progress";
export type ExamRef = { kind: ExamKind; paper: number };
/** URL key: "57" for thi thử, "kt1" for a progress test. */
export const refKey = (r: ExamRef) => (r.kind === "progress" ? `kt${r.paper}` : String(r.paper));
export const refLabel = (r: ExamRef) => (r.kind === "progress" ? `KT${r.paper}` : `Đề ${r.paper}`);
export function parseRef(raw: string): ExamRef | null {
  const kt = /^kt(\d{1,2})$/.exec(raw);
  if (kt) {
    const n = Number(kt[1]);
    return n >= 1 && n <= 20 ? { kind: "progress", paper: n } : null;
  }
  if (!/^\d{2}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 57 && n <= 68 ? { kind: "mock", paper: n } : null;
}

/** A thi thử score sheet or a progress test (content/index.ts `examSheet`). */
export type ExamSheet = {
  ref: ExamRef;
  title: string;
  status: "draft" | "approved";
  parts: (MockPart & { source?: string })[];
  note?: string;
  minutes: number;
  /** Thi thử: pages of the book to print. */
  pages: string | null;
  /** Progress test: the problem text (shown to the student once started, printable for adults). */
  problems: ProgressProblem[] | null;
  covers?: string;
  date?: string;
};
type Parts = { parts: MockPart[] };

export const MOCK_RULES = {
  minutes: 120,
  /** The student's home shows the card from this many days before the date. */
  cardDaysBefore: 3,
  /** "Cần chú ý" for the parent when a finished paper waits longer than this to be graded. */
  gradeOverdueDays: 3,
  /** Parent choice 06/11: one paper a month until this date, then one a week. */
  weeklyFrom: "2027-04-01",
  firstFrom: "2027-01-01",
} as const;

export type MockExamRow = {
  id: number;
  kind?: ExamKind;
  paper: number;
  scheduled_on: string;
  started_at: string | null;
  finished_at: string | null;
  graded_at: string | null;
  total: number | string | null;
  comment?: string | null;
};
export type MockScoreRow = { part: string; points: number | string; error_code?: string | null; note?: string | null; skipped?: boolean | null };
export const kindOf = (e: Pick<MockExamRow, "kind">): ExamKind => e.kind ?? "mock";
export const refOf = (e: Pick<MockExamRow, "kind" | "paper">): ExamRef => ({ kind: kindOf(e), paper: e.paper });
export type MockStatus = "scheduled" | "running" | "finished" | "graded";

export function mockStatus(e: Pick<MockExamRow, "started_at" | "finished_at" | "graded_at">): MockStatus {
  if (e.graded_at) return "graded";
  if (e.finished_at) return "finished";
  return e.started_at ? "running" : "scheduled";
}

export const STATUS_LABEL: Record<MockStatus | "none", string> = {
  none: "Chưa hẹn",
  scheduled: "Đã hẹn",
  running: "Đang làm",
  finished: "Đã nộp — chờ chấm",
  graded: "Đã chấm",
};

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const addMonth = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
};
/** First Saturday on or after the date (exams are on weekends). */
export const saturdayFrom = (iso: string) => addDays(iso, (6 - new Date(`${iso}T00:00:00Z`).getUTCDay() + 7) % 7);
const later = (a: string, b: string) => (a > b ? a : b);

/** The next paper to schedule (lowest not yet scheduled) and a suggested date; null when all 12 are scheduled. */
export function suggestNext(all: Pick<MockExamRow, "paper" | "scheduled_on" | "kind">[], today: string): { paper: number; date: string } | null {
  const exams = all.filter((e) => kindOf(e) === "mock");
  const taken = new Set(exams.map((e) => e.paper));
  const paper = MOCK_PAPERS.find((p) => !taken.has(p));
  if (!paper) return null;
  const last = exams.map((e) => e.scheduled_on).sort().at(-1);
  const base = last ? (last < MOCK_RULES.weeklyFrom ? addMonth(last) : addDays(last, 7)) : MOCK_RULES.firstFrom;
  return { paper, date: saturdayFrom(later(base, addDays(today, 1))) };
}

/** Seconds left of the time allowed (120 minutes for thi thử; never negative). */
export function secondsLeft(startedAt: string, now: Date, minutes: number = MOCK_RULES.minutes): number {
  return Math.max(0, Math.round(minutes * 60 - (now.getTime() - new Date(startedAt).getTime()) / 1000));
}

const round2 = (x: number) => Math.round(x * 100) / 100;

const skippedSet = (scores: MockScoreRow[]) => new Set(scores.filter((s) => s.skipped).map((s) => s.part));
/** The parts that count: every part of the sheet except those marked "chưa học". */
export const countedParts = <P extends MockPart>(sheet: { parts: P[] }, scores: MockScoreRow[]): P[] => {
  const skip = skippedSet(scores);
  return sheet.parts.filter((p) => !skip.has(p.part));
};

/** Total and per-Bài points of a graded exam (parts missing from `scores` count 0; "chưa học" parts are left out). */
export function mockTotals(sheet: Parts, scores: MockScoreRow[]) {
  const got = new Map(scores.map((s) => [s.part, Number(s.points)]));
  const counted = countedParts(sheet, scores);
  const bai = [1, 2, 3, 4, 5]
    .map((b) => {
      const parts = counted.filter((p) => baiOf(p.part) === b);
      return { bai: b, got: round2(parts.reduce((a, p) => a + (got.get(p.part) ?? 0), 0)), max: round2(parts.reduce((a, p) => a + p.max, 0)) };
    })
    .filter((b) => b.max > 0);
  return { total: round2(bai.reduce((a, b) => a + b.got, 0)), max: round2(bai.reduce((a, b) => a + b.max, 0)), bai };
}

/** KUs that lost points, most first; a part's lost points are split evenly between its KUs. */
export function lostByUnit(sheet: Parts, scores: MockScoreRow[]): { unitId: string; lost: number; parts: string[] }[] {
  const got = new Map(scores.map((s) => [s.part, Number(s.points)]));
  const acc = new Map<string, { lost: number; parts: string[] }>();
  for (const p of countedParts(sheet, scores)) {
    const lost = p.max - (got.get(p.part) ?? 0);
    if (lost <= 0) continue;
    for (const u of p.units) {
      const a = acc.get(u) ?? { lost: 0, parts: [] };
      a.lost += lost / p.units.length;
      a.parts.push(p.part);
      acc.set(u, a);
    }
  }
  return [...acc].map(([unitId, a]) => ({ unitId, lost: round2(a.lost), parts: a.parts })).sort((x, y) => y.lost - x.lost || x.unitId.localeCompare(y.unitId));
}

/**
 * Checks the grader's input against the sheet: every part scored, 0 ≤ points ≤ max, multiples of 0,25. "Chưa học"
 * (skipped) is allowed only when `allowSkip` (progress tests), and not on every part.
 */
export function checkScores(sheet: Parts, scores: MockScoreRow[], allowSkip = false): string[] {
  const out: string[] = [];
  const byPart = new Map(scores.map((s) => [s.part, s]));
  const skipped = scores.filter((s) => s.skipped);
  if (skipped.length && !allowSkip) out.push("Thi thử chấm đủ mọi ý (không có \"chưa học\")");
  if (allowSkip && sheet.parts.length && sheet.parts.every((p) => byPart.get(p.part)?.skipped)) out.push("Mọi ý đều \"chưa học\" — không có gì để chấm");
  for (const p of sheet.parts) {
    const s = byPart.get(p.part);
    if (s?.skipped) continue;
    const x = s ? Number(s.points) : NaN;
    if (!s || !Number.isFinite(x)) out.push(`Ý ${p.part}: chưa nhập điểm`);
    else if (x < 0 || x > p.max) out.push(`Ý ${p.part}: điểm phải từ 0 đến ${String(p.max).replace(".", ",")}`);
    else if (Math.abs(x * 4 - Math.round(x * 4)) > 1e-9) out.push(`Ý ${p.part}: điểm là bội của 0,25`);
  }
  for (const s of scores) if (!sheet.parts.some((p) => p.part === s.part)) out.push(`Ý ${s.part} không có trong phiếu chấm`);
  return out;
}

/** "Cần chú ý": finished more than gradeOverdueDays ago and still not graded. */
export function gradeOverdue(e: Pick<MockExamRow, "finished_at" | "graded_at">, today: string): boolean {
  return !!e.finished_at && !e.graded_at && addDays(e.finished_at.slice(0, 10), MOCK_RULES.gradeOverdueDays) < today;
}

/** The exam the student's home shows: running, or scheduled within cardDaysBefore days (or overdue and not started). */
export function upcomingForStudent(exams: MockExamRow[], today: string): MockExamRow | null {
  const running = exams.find((e) => mockStatus(e) === "running");
  if (running) return running;
  return exams.filter((e) => mockStatus(e) === "scheduled" && e.scheduled_on <= addDays(today, MOCK_RULES.cardDaysBefore)).sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on))[0] ?? null;
}

/** Point decimals in the Vietnamese style: 7,25. */
export const pts = (x: number | string) => String(Math.round(Number(x) * 100) / 100).replace(".", ",");
