import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ProductAuthGuard from "@/components/product-auth-guard";

export const dynamic = "force-dynamic";

export default async function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin?notice=login-required");
  }

  return (
    <ProductAuthGuard>
      {children}
    </ProductAuthGuard>
  );
}