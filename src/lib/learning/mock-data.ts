import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MockExamRow, MockScoreRow } from "./mock.ts";

// Thi thử (S9) and Kiểm tra tiến bộ (08/11, `kind`): reads through the caller's client, so RLS decides — the student gets her points only once graded.
export async function loadMockExams(supabase: SupabaseClient, studentId: string): Promise<MockExamRow[]> {
  const { data, error } = await supabase
    .from("mock_exams")
    .select("id, kind, paper, scheduled_on, started_at, finished_at, graded_at, total, comment")
    .eq("student_id", studentId)
    .order("scheduled_on", { ascending: true });
  if (error) console.error("loadMockExams", error.message);
  return (data ?? []) as MockExamRow[];
}

export async function loadMockScores(supabase: SupabaseClient, examId: number): Promise<MockScoreRow[]> {
  const { data, error } = await supabase.from("mock_scores").select("part, points, error_code, note, skipped").eq("exam_id", examId);
  if (error) console.error("loadMockScores", error.message);
  return (data ?? []) as MockScoreRow[];
}

/** Points of several exams in one query (target board), by exam id. */
export async function loadScoresFor(supabase: SupabaseClient, examIds: number[]): Promise<Map<number, MockScoreRow[]>> {
  const out = new Map<number, MockScoreRow[]>();
  if (!examIds.length) return out;
  const { data, error } = await supabase.from("mock_scores").select("exam_id, part, points, error_code, note, skipped").in("exam_id", examIds);
  if (error) console.error("loadScoresFor", error.message);
  for (const r of (data ?? []) as (MockScoreRow & { exam_id: number })[]) out.set(r.exam_id, [...(out.get(r.exam_id) ?? []), r]);
  return out;
}
