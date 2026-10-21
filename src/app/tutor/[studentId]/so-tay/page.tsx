import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { soTay } from "@/lib/content";
import { tutorStudent } from "@/lib/tutor/workspace";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { SoTayView } from "@/components/so-tay/so-tay-view";

export const metadata: Metadata = { title: "Sổ tay suy ngược — App Toán" };

/** S5: the tutor reads the handbook (draft included) to comment before the parent approves it. */
export default async function TutorSoTayPage(props: PageProps<"/tutor/[studentId]/so-tay">) {
  await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const student = await tutorStudent(studentId);
  if (!student) notFound();
  const data = soTay();
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="bai" />
      {!data ? (
        <p>Chưa có sổ tay.</p>
      ) : (
        <>
          {data.status === "draft" && (
            <p className="mb-4 rounded-lg border border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
              Bản nháp — con chưa thấy. Cô góp ý cho phụ huynh nếu cần sửa.
            </p>
          )}
          <SoTayView data={data} />
        </>
      )}
    </>
  );
}
