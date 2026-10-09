"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import AccountShell from "./account-shell";

export default function AuthForm({ mode }: { mode: "signup" | "signin" }) {
  const signup = mode === "signup";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [visible, setVisible] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");

    if (signup && !name) {
      setError("আপনার নাম লিখুন।");
      return;
    }
    if (signup && password !== confirm) {
      setError("পাসওয়ার্ড দুটি মিলছে না।");
      return;
    }

    setBusy(true);
    try {
      const result = signup
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "আবার চেষ্টা করুন।");
        return;
      }
      router.push(signup ? "/signin" : "/");
      router.refresh();
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-green-800 focus:ring-2 focus:ring-green-100";

  return (
    <AccountShell>
      <section className="mx-auto max-w-md">
        <h1 className="text-center text-2xl font-bold">
          {signup ? "অ্যাকাউন্ট তৈরি করুন" : "সাইন ইন"}
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-gray-600">
          {signup ? "বিনা খরচে সাইন আপ করে সব বিস্তারিত দাম দেখুন।" : "বিস্তারিত দাম, বাজার তুলনা ও প্রোফাইল দেখতে অ্যাকাউন্টে ঢুকুন।"}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
          {signup && (
            <label className="block text-sm font-medium">
              নাম
              <input name="name" autoComplete="name" required maxLength={100} placeholder="যেমন: রহিম উদ্দিন" className={input} />
            </label>
          )}
          <label className="block text-sm font-medium">
            ইমেইল
            <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={input} />
          </label>
          <label className="block text-sm font-medium">
            পাসওয়ার্ড
            <div className="relative">
              <input name="password" type={visible ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : undefined} maxLength={128} placeholder="কমপক্ষে ৮ অক্ষর" className={`${input} pr-20`} />
              <button type="button" onClick={() => setVisible(!visible)} className="absolute right-3 top-5 text-sm text-green-900">
                {visible ? "লুকান" : "দেখুন"}
              </button>
            </div>
          </label>
          {signup && (
            <label className="block text-sm font-medium">
              পাসওয়ার্ড নিশ্চিত করুন
              <input name="confirm" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} placeholder="আবার লিখুন" className={input} />
            </label>
          )}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60">
            {busy ? "অপেক্ষা করুন..." : signup ? "অ্যাকাউন্ট তৈরি করুন" : "সাইন ইন"}
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="h-px flex-1 bg-gray-200" />অথবা<span className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {["Google", "GitHub"].map((provider) => (
              <button key={provider} type="button" onClick={() => setNotice(`${provider} লগইন এখনো কনফিগার করা হয়নি। আপাতত ইমেইল দিয়ে চালিয়ে যান।`)} className="rounded-lg border border-gray-200 px-2 py-3 text-sm hover:bg-gray-50">
                <span className="mr-2 font-bold">{provider === "Google" ? "G" : "◉"}</span>
                {provider} দিয়ে চালিয়ে যান
              </button>
            ))}
          </div>
          {notice && <p role="status" className="text-sm leading-6 text-gray-600">{notice}</p>}
          <p className="text-center text-sm text-gray-600">
            {signup ? "অ্যাকাউন্ট আছে? " : "অ্যাকাউন্ট নেই? "}
            <Link href={signup ? "/signin" : "/signup"} className="font-semibold text-green-900 hover:underline">
              {signup ? "সাইন ইন করুন" : "সাইন আপ করুন"}
            </Link>
          </p>
        </form>

        <Link href="/" className="mt-6 block text-center text-sm text-gray-600 hover:text-green-900">← হোম পেজে ফিরে যান</Link>
      </section>
    </AccountShell>
  );
}
