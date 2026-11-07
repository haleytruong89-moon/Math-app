import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MockExamRow, MockScoreRow } from "./mock.ts";

// Thi thử (S9): reads through the caller's client, so RLS decides — the student gets her points only once graded.
export async function loadMockExams(supabase: SupabaseClient, studentId: string): Promise<MockExamRow[]> {
  const { data, error } = await supabase
    .from("mock_exams")
    .select("id, paper, scheduled_on, started_at, finished_at, graded_at, total, comment")
    .eq("student_id", studentId)
    .order("scheduled_on", { ascending: true });
  if (error) console.error("loadMockExams", error.message);
  return (data ?? []) as MockExamRow[];
}

export async function loadMockScores(supabase: SupabaseClient, examId: number): Promise<MockScoreRow[]> {
  const { data, error } = await supabase.from("mock_scores").select("part, points, error_code, note").eq("exam_id", examId);
  if (error) console.error("loadMockScores", error.message);
  return (data ?? []) as MockScoreRow[];
}
