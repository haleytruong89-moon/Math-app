// Thi thử (S9, 07/11/2026, docs/superpowers/specs/2026-11-06-thi-thu-design.md): status, schedule suggestion,
// totals and the KUs that lost points. Pure, so `node --test` covers it.
import { baiOf, MOCK_PAPERS, type MockSheet } from "../content/mock.ts";

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
  paper: number;
  scheduled_on: string;
  started_at: string | null;
  finished_at: string | null;
  graded_at: string | null;
  total: number | string | null;
  comment?: string | null;
};
export type MockScoreRow = { part: string; points: number | string; error_code?: string | null; note?: string | null };
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
export function suggestNext(exams: Pick<MockExamRow, "paper" | "scheduled_on">[], today: string): { paper: number; date: string } | null {
  const taken = new Set(exams.map((e) => e.paper));
  const paper = MOCK_PAPERS.find((p) => !taken.has(p));
  if (!paper) return null;
  const last = exams.map((e) => e.scheduled_on).sort().at(-1);
  const base = last ? (last < MOCK_RULES.weeklyFrom ? addMonth(last) : addDays(last, 7)) : MOCK_RULES.firstFrom;
  return { paper, date: saturdayFrom(later(base, addDays(today, 1))) };
}

/** Seconds left of the 120 minutes (never negative). */
export function secondsLeft(startedAt: string, now: Date): number {
  return Math.max(0, Math.round(MOCK_RULES.minutes * 60 - (now.getTime() - new Date(startedAt).getTime()) / 1000));
}

const round2 = (x: number) => Math.round(x * 100) / 100;

/** Total and per-Bài points of a graded exam (parts missing from `scores` count 0). */
export function mockTotals(sheet: MockSheet, scores: MockScoreRow[]) {
  const got = new Map(scores.map((s) => [s.part, Number(s.points)]));
  const bai = [1, 2, 3, 4, 5].map((b) => {
    const parts = sheet.parts.filter((p) => baiOf(p.part) === b);
    return { bai: b, got: round2(parts.reduce((a, p) => a + (got.get(p.part) ?? 0), 0)), max: round2(parts.reduce((a, p) => a + p.max, 0)) };
  });
  return { total: round2(bai.reduce((a, b) => a + b.got, 0)), bai };
}

/** KUs that lost points, most first; a part's lost points are split evenly between its KUs. */
export function lostByUnit(sheet: MockSheet, scores: MockScoreRow[]): { unitId: string; lost: number; parts: string[] }[] {
  const got = new Map(scores.map((s) => [s.part, Number(s.points)]));
  const acc = new Map<string, { lost: number; parts: string[] }>();
  for (const p of sheet.parts) {
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

/** Checks the grader's input against the sheet: every part scored, 0 ≤ points ≤ max, multiples of 0,25. */
export function checkScores(sheet: MockSheet, scores: MockScoreRow[]): string[] {
  const out: string[] = [];
  const byPart = new Map(scores.map((s) => [s.part, s]));
  for (const p of sheet.parts) {
    const s = byPart.get(p.part);
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
