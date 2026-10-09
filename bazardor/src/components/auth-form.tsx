"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import AccountShell from "./account-shell";

type Provider = "google" | "github";

export default function AuthForm({
  mode,
}: {
  mode: "signup" | "signin";
}) {
  const signup = mode === "signup";
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState<Provider | null>(null);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  const disabled = busy || socialBusy !== null;

  function showError(message: string) {
    setError(message);
    toast.error(message, {
      id: "auth-error",
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) return;

    setError("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");

    if (signup && !name) {
      showError("আপনার নাম লিখুন।");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("সঠিক ইমেইল ঠিকানা লিখুন।");
      return;
    }

    if (!password) {
      showError("আপনার পাসওয়ার্ড লিখুন।");
      return;
    }

    if (signup && password.length < 8) {
      showError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return;
    }

    if (password.length > 128) {
      showError("পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে পারবে।");
      return;
    }

    if (signup && password !== confirm) {
      showError("পাসওয়ার্ড দুটি মিলছে না।");
      return;
    }

    setBusy(true);

    try {
      const result = signup
        ? await authClient.signUp.email({
            name,
            email,
            password,
          })
        : await authClient.signIn.email({
            email,
            password,
          });

      if (result.error) {
        showError(
          result.error.message ||
            (signup
              ? "অ্যাকাউন্ট তৈরি করা যায়নি।"
              : "সাইন ইন করা যায়নি।"),
        );
        return;
      }

      toast.success(
        signup
          ? "অ্যাকাউন্ট তৈরি হয়েছে। এখন সাইন ইন করুন।"
          : "সফলভাবে সাইন ইন হয়েছে।",
        {
          id: "auth-success",
        },
      );

      router.replace(signup ? "/signin" : "/");
      router.refresh();
    } catch {
      showError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  async function socialLogin(provider: Provider) {
    if (disabled) return;

    setError("");
    setSocialBusy(provider);

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/?notice=social-success",
        errorCallbackURL: "/signin?notice=social-error",
      });

      if (result.error) {
        showError(
          result.error.message ||
            "সোশ্যাল লগইন শুরু করা যায়নি। আবার চেষ্টা করুন।",
        );
      }
    } catch {
      showError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSocialBusy(null);
    }
  }

  const input =
    "mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-green-800 focus:ring-2 focus:ring-green-100 disabled:opacity-60";

  return (
    <AccountShell>
      <section className="mx-auto max-w-md">
        <h1 className="text-center text-2xl font-bold">
          {signup ? "অ্যাকাউন্ট তৈরি করুন" : "সাইন ইন"}
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-gray-600">
          {signup
            ? "বিনা খরচে সাইন আপ করে সব বিস্তারিত দাম দেখুন।"
            : "বিস্তারিত দাম ও প্রোফাইল দেখতে অ্যাকাউন্টে ঢুকুন।"}
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="mt-6 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7"
        >
          {signup && (
            <label className="block text-sm font-medium">
              নাম
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                disabled={disabled}
                placeholder="যেমন: রহিম উদ্দিন"
                className={input}
              />
            </label>
          )}

          <label className="block text-sm font-medium">
            ইমেইল
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={disabled}
              placeholder="you@example.com"
              className={input}
            />
          </label>

          <label className="block text-sm font-medium">
            পাসওয়ার্ড

            <div className="relative">
              <input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={
                  signup ? "new-password" : "current-password"
                }
                required
                maxLength={128}
                disabled={disabled}
                placeholder="আপনার পাসওয়ার্ড"
                className={`${input} pr-20`}
              />

              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={
                  visible ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"
                }
                aria-pressed={visible}
                className="absolute right-3 top-5 text-sm text-green-900"
              >
                {visible ? "লুকান" : "দেখুন"}
              </button>
            </div>

            {signup && (
              <span className="mt-2 block text-xs text-gray-500">
                কমপক্ষে ৮ অক্ষর ব্যবহার করুন।
              </span>
            )}
          </label>

          {signup && (
            <label className="block text-sm font-medium">
              পাসওয়ার্ড নিশ্চিত করুন
              <input
                name="confirm"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                required
                maxLength={128}
                disabled={disabled}
                placeholder="আবার লিখুন"
                className={input}
              />
            </label>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {busy
              ? "অপেক্ষা করুন..."
              : signup
                ? "অ্যাকাউন্ট তৈরি করুন"
                : "সাইন ইন"}
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="h-px flex-1 bg-gray-200" />
            অথবা
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["google", "github"] as const).map((provider) => (
              <button
                key={provider}
                type="button"
                disabled={disabled}
                onClick={() => void socialLogin(provider)}
                className="rounded-lg border border-gray-200 px-2 py-3 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {socialBusy === provider ? (
                  "অপেক্ষা করুন..."
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="mr-2 font-bold"
                    >
                      {provider === "google" ? "G" : "◉"}
                    </span>
                    {provider === "google" ? "Google" : "GitHub"}
                    {" "}দিয়ে চালিয়ে যান
                  </>
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-gray-600">
            {signup ? "অ্যাকাউন্ট আছে? " : "অ্যাকাউন্ট নেই? "}

            <Link
              href={signup ? "/signin" : "/signup"}
              className="font-semibold text-green-900 hover:underline"
            >
              {signup ? "সাইন ইন করুন" : "সাইন আপ করুন"}
            </Link>
          </p>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-gray-600 hover:text-green-900"
        >
          ← হোম পেজে ফিরে যান
        </Link>
      </section>
    </AccountShell>
  );
}