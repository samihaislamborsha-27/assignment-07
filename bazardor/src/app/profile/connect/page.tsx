"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import AccountShell from "@/components/account-shell";
import { authClient } from "@/lib/auth-client";

export default function ConnectAccountPage() {
  const { data: session, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);

  async function connectGoogle() {
    setBusy(true);

    try {
      const result = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/profile",
      });

      if (result.error) {
        toast.error(
          result.error.message || "Google সংযুক্ত করা যায়নি।",
        );
      }
    } catch {
      toast.error("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountShell>
      <section className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold">
          Google অ্যাকাউন্ট সংযুক্ত করুন
        </h1>

        {isPending ? (
          <p className="mt-4">অপেক্ষা করুন…</p>
        ) : !session ? (
          <Link
            href="/signin"
            className="mt-5 inline-block font-semibold text-green-900"
          >
            প্রথমে ইমেইল ও পাসওয়ার্ড দিয়ে সাইন ইন করুন →
          </Link>
        ) : (
          <>
            <p className="mt-4 break-all text-sm text-gray-600">
              বর্তমান অ্যাকাউন্ট: {session.user.email}
            </p>

            <p className="mt-3 text-sm text-gray-600">
              Google থেকে একই ইমেইলের অ্যাকাউন্টটি নির্বাচন করুন।
            </p>

            <button
              type="button"
              disabled={busy}
              onClick={connectGoogle}
              className="mt-6 w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {busy ? "অপেক্ষা করুন…" : "Google সংযুক্ত করুন"}
            </button>
          </>
        )}
      </section>
    </AccountShell>
  );
}