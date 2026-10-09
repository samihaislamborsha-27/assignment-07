"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AccountShell from "@/components/account-shell";

type Market = {
  market: string;
  division: string;
  min: number;
  max: number;
};

type Product = {
  id: number;
  slug: string;
  nameBn: string;
  category: string;
  categoryNameBn: string;
  categoryIcon: string;
  unit: string;
  image: string;
  today: number;
  yesterday: number;
  change: {
    dir: string;
    pct: number;
  };
  markets: Market[];
};

const API_URLS = [
  "https://api.api-store.workers.dev/api/bazardor",
  "https://api.abcz.workers.dev/api/bazardor",
];

const units: Record<string, string> = {
  kg: "কেজি",
  litre: "লিটার",
  liter: "লিটার",
  dozen: "ডজন",
  piece: "পিস",
};

function number(value: number, decimals = 0) {
  return new Intl.NumberFormat("bn-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setProduct(null);

    async function loadProduct() {
      for (const base of API_URLS) {
        try {
          const response = await fetch(`${base}/products`, {
            signal: controller.signal,
          });

          if (!response.ok) continue;

          const body = await response.json();
          const list = Array.isArray(body)
            ? body
            : body.products ?? body.data?.products ?? body.data;

          if (!Array.isArray(list)) continue;

          const found = list.find(
            (item) => item && item.slug === slug,
          );

          if (
            found &&
            (typeof found.today !== "number" || !found.change)
          ) {
            continue;
          }

          if (!controller.signal.aborted) {
            setProduct(found ?? null);
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

    void loadProduct();

    return () => controller.abort();
  }, [slug, attempt]);

  const markets = (product?.markets ?? []).filter(
    (market) =>
      Number.isFinite(market.min) &&
      Number.isFinite(market.max),
  );

  const minimum = markets.length
    ? Math.min(...markets.map((market) => market.min))
    : null;

  const maximum = markets.length
    ? Math.max(...markets.map((market) => market.max))
    : null;

  const average = markets.length
    ? markets.reduce(
        (total, market) => total + (market.min + market.max) / 2,
        0,
      ) / markets.length
    : null;

  const categorySlug =
    product?.category === "dim-dui"
      ? "dim-dudh"
      : product?.category;

  const up = product?.change.dir === "up";
  const down = product?.change.dir === "down";

  return (
    <AccountShell>
      <div className="mx-auto max-w-5xl">
        {loading ? (
          <div
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600"
          >
            পণ্যের তথ্য লোড হচ্ছে…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-8 text-center"
          >
            <p className="text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-4 rounded-lg bg-green-900 px-5 py-2 text-white hover:bg-green-800"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : !product ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-xl font-bold">
              পণ্যটি পাওয়া যায়নি।
            </h1>

            <Link
              href="/"
              className="mt-4 inline-block font-semibold text-green-800"
            >
              ← হোম পেজে ফিরে যান
            </Link>
          </div>
        ) : (
          <>
            <nav
              aria-label="পৃষ্ঠার অবস্থান"
              className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-600"
            >
              <Link href="/" className="hover:text-green-800">
                হোম
              </Link>

              <span aria-hidden="true">›</span>

              <Link
                href={`/category/${categorySlug}`}
                className="hover:text-green-800"
              >
                {product.categoryNameBn}
              </Link>

              <span aria-hidden="true">›</span>

              <span className="text-gray-900">
                {product.nameBn}
              </span>
            </nav>

            <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-stone-50 text-4xl"
                >
                  {product.image || product.categoryIcon || "🛒"}
                </span>

                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    {product.nameBn}
                  </h1>

                  <p className="mt-2 text-sm text-gray-600">
                    প্রতি {units[product.unit] ?? product.unit}
                    {" "}· {product.categoryNameBn}
                  </p>

                  {Number.isFinite(product.yesterday) && (
                    <p className="mt-2 text-sm text-gray-500">
                      গতকালের দাম: {number(product.yesterday)} টাকা
                    </p>
                  )}
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-sm text-gray-500">আজকের দাম</p>

                <p className="mt-1 text-3xl font-bold">
                  {number(product.today)}
                  <span className="ml-2 text-base font-normal">
                    টাকা/{units[product.unit] ?? product.unit}
                  </span>
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${
                    up
                      ? "text-red-700"
                      : down
                        ? "text-green-700"
                        : "text-gray-500"
                  }`}
                >
                  {up ? "▲" : down ? "▼" : "—"}{" "}
                  {number(Math.abs(product.change.pct), 1)}%
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold">দামের সারসংক্ষেপ</h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-sm text-gray-600">
                    সর্বনিম্ন দাম
                  </p>
                  <p className="mt-2 text-2xl font-bold text-green-800">
                    {minimum === null ? "—" : number(minimum)}
                    <span className="ml-1 text-sm font-normal">
                      টাকা
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    তালিকাভুক্ত বাজারগুলোর মধ্যে
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-sm text-gray-600">
                    সর্বোচ্চ দাম
                  </p>
                  <p className="mt-2 text-2xl font-bold text-red-700">
                    {maximum === null ? "—" : number(maximum)}
                    <span className="ml-1 text-sm font-normal">
                      টাকা
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    তালিকাভুক্ত বাজারগুলোর মধ্যে
                  </p>
                </div>

                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-sm text-gray-600">গড় দাম</p>
                  <p className="mt-2 text-2xl font-bold text-green-900">
                    {average === null ? "—" : number(average, 1)}
                    <span className="ml-1 text-sm font-normal">
                      টাকা
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    বাজারগুলোর দামসীমার মধ্যমানের গড়
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold">
                বাজারভিত্তিক আজকের দাম
              </h2>

              {markets.length === 0 ? (
                <p className="mt-5 text-gray-600">
                  বাজারভিত্তিক তথ্য এখন পাওয়া যায়নি।
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full -[155px] border-collapse text-left text-sm">
                    <caption className="sr-only">
                      {product.nameBn} এর বাজারভিত্তিক দাম
                    </caption>

                    <thead>
                      <tr className="border-b border-gray-200 bg-stone-50">
                        <th scope="col" className="px-3 py-4 font-semibold">
                          বাজার
                        </th>
                        <th scope="col" className="px-3 py-4 font-semibold">
                          বিভাগ
                        </th>
                        <th scope="col" className="px-3 py-4 text-right font-semibold">
                          সর্বনিম্ন
                        </th>
                        <th scope="col" className="px-3 py-4 text-right font-semibold">
                          সর্বোচ্চ
                        </th>
                        <th scope="col" className="px-3 py-4 text-right font-semibold">
                          গড়
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {markets.map((market, index) => (
                        <tr
                          key={`${market.market}-${index}`}
                          className="border-b border-gray-100 last:border-0 hover:bg-green-50/50"
                        >
                          <td className="px-3 py-4 font-medium">
                            {market.market}
                          </td>
                          <td className="px-3 py-4 text-gray-600">
                            {market.division}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-right">
                            {number(market.min)} টাকা
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-right">
                            {number(market.max)} টাকা
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-right font-semibold">
                            {number((market.min + market.max) / 2, 1)} টাকা
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AccountShell>
  );
}