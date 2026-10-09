"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AccountShell from "@/components/account-shell";

type Product = {
  id: number;
  slug: string;
  nameBn: string;
  category: string;
  categoryIcon?: string;
  unit: string;
  image: string;
  today: number;
  change: { dir: string; pct: number };
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

function ProductCard({ product }: { product: Product }) {
  const up = product.change.dir === "up";
  const down = product.change.dir === "down";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-green-700 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-green-800"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-3xl"
        >
          {product.image || product.categoryIcon || "🛒"}
        </span>

        <div className="min-w-0">
          <h3 className="wrap-break-word text-lg font-bold">
            {product.nameBn}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            প্রতি {units[product.unit] ?? product.unit}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">আজকের দাম</p>
          <p className="mt-1 text-xl font-bold">
            {number(product.today)}
            <span className="ml-1 text-base font-normal">টাকা</span>
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
}

function ProductSection({
  title,
  products,
  direction,
  subtitle,
  id,
}: {
  title: string;
  products: Product[];
  direction?: "up" | "down";
  subtitle?: string;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
        {title}
        {direction && (
          <span
            aria-hidden="true"
            className={
              direction === "up" ? "text-green-700" : "text-red-700"
            }
          >
            {direction === "up" ? "▲" : "▼"}
          </span>
        )}
      </h2>

      {subtitle && (
        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
      )}

      {products.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 text-gray-600">
          এই তালিকায় এখন কোনো পণ্য নেই।
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div
      role="status"
      aria-label="পণ্যের তথ্য লোড হচ্ছে"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setDate(
      new Intl.DateTimeFormat("bn-BD", {
        dateStyle: "full",
        timeZone: "Asia/Dhaka",
      }).format(new Date()),
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
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

    void loadProducts();
    return () => controller.abort();
  }, [attempt]);

  const risers = products
    .filter((product) => product.change.dir === "up")
    .sort((a, b) => Math.abs(b.change.pct) - Math.abs(a.change.pct))
    .slice(0, 6);

  const fallers = products
    .filter((product) => product.change.dir === "down")
    .sort((a, b) => Math.abs(b.change.pct) - Math.abs(a.change.pct))
    .slice(0, 6);

  function retry() {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  return (
    <AccountShell>
      <div className="mx-auto max-w-6xl">
        <section className="grid items-center gap-8 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 sm:p-9 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-green-50 px-3 py-1.5 text-sm text-green-800">
              {date || "প্রতিদিনের বাজার দর"}
            </span>

            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              আজকের বাজারের দাম এক নজরে
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              চাল, ডাল, তেল, সবজি, মাছ, মাংস, ডিম ও মসলার দাম —
              বাজারভিত্তিক বিস্তারিত, গড়, সর্বনিম্ন-সর্বাধিক এবং
              দামের পরিবর্তন এক জায়গায়।
            </p>

            <a
              href="#সব-পণ্য"
              className="mt-6 inline-block rounded-lg bg-green-900 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              সব পণ্য দেখুন
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl bg-green-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bazar-hero.png"
              alt="নিত্যপ্রয়োজনীয় বাজারের পণ্য"
              width={640}
              height={480}
              className="aspect-4/3 w-full object-contain"
            />
          </div>
        </section>

        <div className="mt-10 space-y-10">
          {loading ? (
            <section id="সব-পণ্য" className="scroll-mt-6">
              <h2 className="mb-5 text-xl font-bold">
                বাজারের তথ্য লোড হচ্ছে…
              </h2>
              <SkeletonGrid />
            </section>
          ) : error ? (
            <section
              id="সব-পণ্য"
              role="alert"
              className="scroll-mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center"
            >
              <p className="text-red-700">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 rounded-lg bg-green-900 px-5 py-2 text-white hover:bg-green-800"
              >
                আবার চেষ্টা করুন
              </button>
            </section>
          ) : (
            <>
              <ProductSection
                title="আজ দাম বেড়েছে"
                direction="up"
                products={risers}
              />
              <ProductSection
                title="আজ দাম কমেছে"
                direction="down"
                products={fallers}
              />
              <ProductSection
                id="সব-পণ্য"
                title="সব পণ্য"
                subtitle={`মোট ${number(products.length)}টি পণ্যের আজকের দাম ও পরিবর্তন`}
                products={products}
              />
            </>
          )}
        </div>
      </div>
    </AccountShell>
  );
}