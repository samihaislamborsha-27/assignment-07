import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AccountShell from "@/components/account-shell";
import ProfileForm from "@/components/profile-form";

export const dynamic = "force-dynamic";

export default async function UpdateProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin?notice=login-required");
  }

  return (
    <AccountShell>
      <ProfileForm user={session.user} editing />
    </AccountShell>
  );
}