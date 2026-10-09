import Link from "next/link";
import AccountShell from "@/components/account-shell";

export default function NotFound() {
  return (
    <AccountShell>
      <section className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center sm:px-10">
        <p className="text-7xl font-bold text-green-900">
          ৪০৪
        </p>

        <h1 className="mt-5 text-2xl font-bold">
          পেজটি পাওয়া যায়নি
        </h1>

        <p className="mt-3 text-sm leading-7 text-gray-600">
          ঠিকানাটি ভুল হতে পারে অথবা পেজটি আর এখানে নেই।
          হোম পেজে ফিরে আজকের বাজারের দাম দেখুন।
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-green-900 px-5 py-3 font-semibold text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"
        >
          ← হোম পেজে ফিরে যান
        </Link>
      </section>
    </AccountShell>
  );
}