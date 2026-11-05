"use client";

import { useRouter } from "next/navigation";
import type { PublicUnit } from "@/lib/content/public";
import { PracticeStage } from "./lesson-player";

export function HomeworkPractice({ unit, homeworkId, ai = false }: { unit: PublicUnit; homeworkId: string; ai?: boolean }) {
  const router = useRouter();
  return <PracticeStage unit={unit} homeworkId={homeworkId} onDone={() => router.push("/student")} recapHref={(id) => `/student/recap/${id}`} ai={ai} />;
}
