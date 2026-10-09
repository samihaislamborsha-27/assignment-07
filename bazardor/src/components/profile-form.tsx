"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ProfileForm({
  user,
}: {
  user: { name: string; email: string; image?: string | null };
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [savedName, setSavedName] = useState(user.name);
  const [savedImage, setSavedImage] = useState(user.image || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pickerKey, setPickerKey] = useState(0);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || leaving) return;
    setError("");
    setSuccess("");

    const nextName = name.trim();
    if (!nextName) {
      setError("আপনার নাম লিখুন।");
      return;
    }

    setBusy(true);
    try {
      let nextImage = savedImage;

      if (file) {
        const form = new FormData();
        form.append("photo", file);

        const response = await fetch("/api/profile/photo", {
          method: "POST",
          body: form,
        });
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "ছবি আপলোড করা যায়নি।");
          return;
        }

        nextImage = result.image;
      }

      const result = await authClient.updateUser({
        name: nextName,
        ...(nextImage ? { image: nextImage } : {}),
      });

      if (result.error) {
        setError(result.error.message || "আপডেট করা যায়নি।");
        return;
      }

      setSavedName(nextName);
      setSavedImage(nextImage);
      setFile(null);
      setPreview("");
      setPickerKey((value) => value + 1);
      setImageFailed(false);
      setSuccess("প্রোফাইল সফলভাবে আপডেট হয়েছে।");
      router.refresh();
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
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
        setError(result.error.message || "সাইন আউট করা যায়নি।");
        return;
      }
      router.replace("/signin");
      router.refresh();
    } catch {
      setError("সাইন আউট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setLeaving(false);
    }
  }

  const photo = preview || savedImage;

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">আমার প্রোফাইল</h1>
      <p className="mt-2 text-sm text-gray-600">
        আপনার অ্যাকাউন্টের তথ্য এখানে দেখুন।
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
          ) : savedName.slice(0, 1).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="break-words text-lg font-semibold">{savedName}</h2>
          <p className="mt-1 break-all text-sm text-gray-600">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={signout}
          disabled={busy || leaving}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {leaving ? "অপেক্ষা করুন..." : "↪ সাইন আউট"}
        </button>
      </div>

      <form onSubmit={update} className="mt-5 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">তথ্য</h2>

        <label className="mt-5 block text-sm font-medium">
          নাম
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            maxLength={100}
            disabled={busy || leaving}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-green-800 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="mt-5 block text-sm font-medium">
          প্রোফাইল ছবি
          <input
            key={pickerKey}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy || leaving}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              setError("");
              setSuccess("");
              if (!selected) return;

              if (
                !["image/jpeg", "image/png", "image/webp"].includes(selected.type) ||
                selected.size > 5 * 1024 * 1024
              ) {
                setError("সর্বোচ্চ ৫ MB-এর JPG, PNG অথবা WebP ছবি দিন।");
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
          ডিভাইস থেকে ছবি নির্বাচন করুন, তারপর আপডেট চাপুন। সর্বোচ্চ ৫ MB।
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{success}</p>
        )}

        <button
          disabled={busy || leaving}
          className="mt-5 w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
        >
          {busy ? "আপডেট হচ্ছে..." : "আপডেট"}
        </button>
      </form>
    </section>
  );
}