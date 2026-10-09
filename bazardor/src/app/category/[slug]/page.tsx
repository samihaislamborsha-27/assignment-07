"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AccountShell from "@/components/account-shell";

type Product = {
  id: number;
  slug: string;
  nameBn: string;
  category: string;
  unit: string;
  image: string;
  today: number;
  change: { dir: string; pct: number };
};

const categories: Record<string, { name: string; icon: string }> = {
  chal: { name: "চাল", icon: "🍚" },
  dal: { name: "ডাল", icon: "🫘" },
  tel: { name: "তেল", icon: "🛢️" },
  sobji: { name: "সবজি", icon: "🥬" },
  mach: { name: "মাছ", icon: "🐟" },
  mangsho: { name: "মাংস", icon: "🍗" },
  "dim-dudh": { name: "ডিম-দুধ", icon: "🥛" },
  mosla: { name: "মসলা", icon: "🌶️" },
};

const units: Record<string, string> = {
  kg: "কেজি",
  litre: "লিটার",
  liter: "লিটার",
  dozen: "ডজন",
  piece: "পিস",
};

const API_URLS = [
  "https://api.api-store.workers.dev/api/bazardor",
  "https://api.abcz.workers.dev/api/bazardor",
];

function number(value: number, decimals = 0) {
  return new Intl.NumberFormat("bn-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function EmptyState({ invalid = false }: { invalid?: boolean }) {
  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-8 text-center">
      <p className="text-4xl font-bold text-green-900">
        {invalid ? "৪০৪" : "🛒"}
      </p>
      <h2 className="mt-4 text-xl font-bold">
        {invalid
          ? "এই বিভাগটি পাওয়া যায়নি।"
          : "এই বিভাগে এখন কোনো পণ্য পাওয়া যায়নি।"}
      </h2>
      <Link
        href="/"
        className="mt-5 inline-block rounded-lg bg-green-900 px-5 py-3 font-semibold text-white hover:bg-green-800"
      >
        হোম পেজে ফিরে যান
      </Link>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div
      role="status"
      aria-label="পণ্যের তথ্য লোড হচ্ছে"
      className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">পণ্যের তথ্য লোড হচ্ছে…</span>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
        >
          <div className="flex gap-3">
            <div className="size-12 rounded-xl bg-gray-200" />
            <div className="flex-1">
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="mt-3 h-3 w-1/3 rounded bg-gray-100" />
            </div>
          </div>
          <div className="mt-5 h-6 w-1/2 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = Object.hasOwn(categories, slug)
    ? categories[slug]
    : undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("default");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      for (const base of API_URLS) {
        try {
          const response = await fetch(`${base}/products`, {
            signal: controller.signal,
          });
          if (!response.ok) continue;

          const body = await response.json();
          const list = Array.isArray(body)
            ? body
            : body?.products ?? body?.data?.products ?? body?.data;

          if (!Array.isArray(list)) continue;

          const valid: Product[] = list.filter(
            (product) =>
              product &&
              typeof product.nameBn === "string" &&
              typeof product.slug === "string" &&
              typeof product.category === "string" &&
              typeof product.unit === "string" &&
              Number.isFinite(product.today) &&
              product.change &&
              Number.isFinite(product.change.pct),
          );

          if (!controller.signal.aborted) {
            setProducts(valid);
            setLoading(false);
          }
          return;
        } catch {
          if (controller.signal.aborted) return;
        }
      }

      if (!controller.signal.aborted) {
        setError("পণ্যের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।");
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [attempt]);

  const visible = products.filter((product) => {
    const productCategory =
      product.category === "dim-dui" ? "dim-dudh" : product.category;
    return productCategory === slug;
  });

  if (sort === "low") {
    visible.sort((a, b) => a.today - b.today);
  } else if (sort === "high") {
    visible.sort((a, b) => b.today - a.today);
  } else if (sort === "name") {
    visible.sort((a, b) => a.nameBn.localeCompare(b.nameBn, "bn"));
  }

  function retry() {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  return (
    <AccountShell>
      <div className="mx-auto max-w-6xl">
        {!category ? (
          <EmptyState invalid />
        ) : (
          <>
            <section className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6">
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-green-50 text-3xl"
              >
                {category.icon}
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold">{category.name}</h1>
                <p className="mt-1 text-sm text-gray-600">
                  আজকের দাম ও পরিবর্তন
                </p>
              </div>
            </section>

            <div className="mt-5 flex justify-end rounded-2xl border border-gray-200 bg-white p-4">
              <label className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
                সাজান:
                <select
                  value={sort}
                  disabled={loading || Boolean(error)}
                  onChange={(event) => setSort(event.target.value)}
                  className="max-w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-green-700 disabled:opacity-60"
                >
                  <option value="default">ডিফল্ট</option>
                  <option value="low">দাম: কম থেকে বেশি</option>
                  <option value="high">দাম: বেশি থেকে কম</option>
                  <option value="name">নাম অনুযায়ী</option>
                </select>
              </label>
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : error ? (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-red-200 bg-white p-6"
              >
                <p className="text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 rounded-lg bg-green-900 px-4 py-2 text-white"
                >
                  আবার চেষ্টা করুন
                </button>
              </div>
            ) : visible.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <p className="mt-6 text-sm text-gray-600">
                  মোট {number(visible.length)}টি পণ্য দেখানো হচ্ছে
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((product) => {
                    const up = product.change.dir === "up";
                    const down = product.change.dir === "down";

                    return (
                      <Link
                        key={product.slug}
                        href={`/product/${product.slug}`}
                        className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-green-700 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-green-800"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-3xl"
                          >
                            {product.image || category.icon}
                          </span>
                          <div className="min-w-0">
                            <h2 className="wrap-break-word text-lg font-bold">
                              {product.nameBn}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                              প্রতি {units[product.unit] ?? product.unit}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-sm text-gray-500">
                              আজকের দাম
                            </p>
                            <p className="mt-1 text-xl font-bold">
                              {number(product.today)}
                              <span className="ml-1 text-base font-normal">
                                টাকা
                              </span>
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold ${
                              up
                                ? "bg-green-50 text-green-700"
                                : down
                                  ? "bg-red-50 text-red-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {up ? "▲" : down ? "▼" : "—"}{" "}
                            {number(Math.abs(product.change.pct), 1)}%
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AccountShell>
  );
}