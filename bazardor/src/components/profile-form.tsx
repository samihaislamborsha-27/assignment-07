"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";

type ProfileUser = {
  name: string;
  email: string;
  image?: string | null;
};

export default function ProfileForm({
  user,
  editing = false,
}: {
  user: ProfileUser;
  editing?: boolean;
}) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [file, setFile] = useState<File | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  // Release temporary preview URLs when the selected file changes.
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function showError(message: string) {
    setError(message);
    toast.error(message);
  }

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy || leaving) return;

    setError("");

    const nextName = name.trim();

    if (!nextName || nextName.length > 100) {
      showError("১ থেকে ১০০ অক্ষরের মধ্যে আপনার নাম লিখুন।");
      return;
    }

    setBusy(true);

    try {
      let nextImage = user.image || "";

      if (file) {
        const form = new FormData();
        form.append("photo", file);

        const response = await fetch("/api/profile/photo", {
          method: "POST",
          body: form,
        });

        const uploaded = await response.json();

        if (!response.ok) {
          showError(uploaded.error || "ছবি আপলোড করা যায়নি।");
          return;
        }

        if (typeof uploaded.image !== "string") {
          showError("ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।");
          return;
        }

        nextImage = uploaded.image;
      }

      const result = await authClient.updateUser({
        name: nextName,
        ...(nextImage ? { image: nextImage } : {}),
      });

      if (result.error) {
        showError(result.error.message || "আপডেট করা যায়নি।");
        return;
      }

      toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে।");
      router.replace("/profile");
      router.refresh();
    } catch {
      showError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  async function signout() {
    if (busy || leaving) return;

    setLeaving(true);
    setError("");

    try {
      const result = await authClient.signOut();

      if (result.error) {
        showError(result.error.message || "সাইন আউট করা যায়নি।");
        return;
      }

      toast.success("সফলভাবে সাইন আউট হয়েছে।");
      router.replace("/signin");
      router.refresh();
    } catch {
      showError("সাইন আউট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setLeaving(false);
    }
  }

  const photo = preview || user.image;

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">
        {editing ? "তথ্য আপডেট করুন" : "আমার প্রোফাইল"}
      </h1>

      <p className="mt-2 text-sm text-gray-600">
        {editing
          ? "আপনার নাম ও প্রোফাইল ছবি পরিবর্তন করুন।"
          : "আপনার অ্যাকাউন্টের তথ্য এখানে দেখুন।"}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100 text-2xl font-bold text-green-900">
          {photo && !imageFailed ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photo}
              alt="প্রোফাইল ছবি"
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            user.name.slice(0, 1).toUpperCase()
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="wrap-break-word text-lg font-semibold">
            {user.name}
          </h2>

          <p className="mt-1 break-all text-sm text-gray-600">
            {user.email}
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={signout}
            disabled={leaving}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {leaving ? "অপেক্ষা করুন…" : "↪ সাইন আউট"}
          </button>
        )}
      </div>

      {!editing ? (
        <Link
          href="/profile/update"
          className="mt-5 inline-block rounded-lg bg-green-900 px-5 py-3 font-semibold text-white hover:bg-green-800"
        >
          তথ্য আপডেট করুন
        </Link>
      ) : (
        <form
          onSubmit={update}
          noValidate
          className="mt-5 rounded-2xl border border-gray-200 bg-white p-6"
        >
          <label className="block text-sm font-medium">
            নাম
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
              maxLength={100}
              disabled={busy}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-green-800 focus:ring-2 focus:ring-green-100"
            />
          </label>

          <label className="mt-5 block text-sm font-medium">
            প্রোফাইল ছবি
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(event) => {
                const selected = event.target.files?.[0];

                setError("");
                setFile(null);

                if (!selected) return;

                if (
                  !["image/jpeg", "image/png", "image/webp"].includes(
                    selected.type,
                  ) ||
                  selected.size > 4 * 1024 * 1024
                ) {
                  showError(
                    "সর্বোচ্চ ৪ MB-এর JPG, PNG অথবা WebP ছবি দিন।",
                  );
                  event.target.value = "";
                  return;
                }

                setImageFailed(false);
                setFile(selected);
              }}
              className="mt-2 block w-full rounded-lg border border-gray-300 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-semibold file:text-green-900"
            />
          </label>

          <p className="mt-2 text-sm text-gray-600">
            ছবি পরিবর্তন করা ঐচ্ছিক। সর্বোচ্চ ৪ MB।
          </p>

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {busy ? "আপডেট হচ্ছে…" : "তথ্য আপডেট করুন"}
          </button>

          <Link
            href="/profile"
            className="mt-4 block text-center text-sm text-green-900 hover:underline"
          >
            ← প্রোফাইলে ফিরে যান
          </Link>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </section>
  );
}