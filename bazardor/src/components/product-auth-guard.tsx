"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ProductAuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session && !error) {
      router.replace("/signin?notice=login-required");
    }
  }, [isPending, session, error, router]);

  if (isPending) {
    return (
      <main
        role="status"
        aria-label="অ্যাকাউন্ট যাচাই হচ্ছে"
        className="mx-auto max-w-5xl px-4 py-12"
      >
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-8">
          <div className="h-8 w-2/3 rounded bg-gray-200" />
          <div className="mt-4 h-4 w-1/2 rounded bg-gray-100" />
          <div className="mt-8 h-40 rounded bg-gray-100" />
        </div>
        <p className="mt-4 text-sm text-gray-600">
          অ্যাকাউন্ট যাচাই হচ্ছে…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-xl font-bold">
          অ্যাকাউন্ট যাচাই করা যায়নি।
        </h1>

        <p role="alert" className="mt-3 text-gray-600">
          সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-lg bg-green-900 px-5 py-3 text-white"
        >
          আবার চেষ্টা করুন
        </button>
      </main>
    );
  }

  if (!session) {
    return (
      <main role="status" className="px-4 py-12 text-center">
        সাইন ইন পেজে নিয়ে যাওয়া হচ্ছে…
      </main>
    );
  }

  return <>{children}</>;
}