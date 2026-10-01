import { redirect } from "next/navigation";
import { connection } from "next/server";
import { hasPublicEnv } from "@/lib/env";
import { getCurrentUser, ROLE_HOME } from "@/lib/dal";
import { SetupNotice } from "@/components/setup-notice";

export default async function Home() {
  await connection(); // env + session are read per request, never at build time
  if (!hasPublicEnv()) return <SetupNotice />;
  const user = await getCurrentUser();
  redirect(user ? ROLE_HOME[user.role] : "/login");
}
