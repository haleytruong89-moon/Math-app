"use client";

import { useRouter } from "next/navigation";
import type { PublicUnit } from "@/lib/content/public";
import { PracticeStage } from "./lesson-player";

export function HomeworkPractice({ unit, homeworkId }: { unit: PublicUnit; homeworkId: string }) {
  const router = useRouter();
  return <PracticeStage unit={unit} homeworkId={homeworkId} onDone={() => router.push("/student")} recapHref={(id) => `/student/recap/${id}`} />;
}
