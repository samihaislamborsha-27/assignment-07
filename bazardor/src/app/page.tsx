"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AccountShell from "@/components/account-shell";

type Product = {
  id: number;
  slug: string;
  nameBn: string;
  category: string;
  categoryNameBn?: string;
  categoryIcon?: string;
  unit: string;
  image: string;
  today: number;
  change: {
    dir: string;
    pct: number;
  };
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

function banglaNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("bn-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function ChangeBadge({ product }: { product: Product }) {
  const direction = product.change.dir;

  const symbol =
    direction === "up" ? "▲" : direction === "down" ? "▼" : "—";

  const color =
    direction === "up"
      ? "bg-red-50 text-red-700"
      : direction === "down"
        ? "bg-green-50 text-green-700"
        : "bg-gray-100 text-gray-600";

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold ${color}`}
    >
      {symbol} {banglaNumber(Math.abs(product.change.pct), 1)}%
    </span>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-green-700 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-3xl"
        >
          {product.image || product.categoryIcon || "🛒"}
        </span>

        <div className="min-w-0">
          <h3 className="text-lg font-bold">{product.nameBn}</h3>
          <p className="mt-1 text-sm text-gray-500">
            প্রতি {units[product.unit] ?? product.unit}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">আজকের দাম</p>
          <p className="mt-1 text-xl font-bold">
            {banglaNumber(product.today)}
            <span className="ml-1 text-base font-normal">টাকা</span>
          </p>
        </div>

        <ChangeBadge product={product} />
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
        {direction && (
          <span
            aria-hidden="true"
            className={
              direction === "up" ? "text-red-600" : "text-green-700"
            }
          >
            {direction === "up" ? "▲" : "▼"}
          </span>
        )}
        {title}
      </h2>

      {subtitle && (
        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
      )}

      {products.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 text-gray-600">
          এই তালিকায় এখন কোনো পণ্য নেই।
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
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
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
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
      for (const baseUrl of API_URLS) {
        try {
          const response = await fetch(`${baseUrl}/products`, {
            signal: controller.signal,
          });

          if (!response.ok) continue;

          const body = await response.json();

          const list = Array.isArray(body)
            ? body
            : body.products ?? body.data?.products ?? body.data;

          if (!Array.isArray(list)) continue;

          const validProducts: Product[] = list.filter(
            (product) =>
              product &&
              typeof product.nameBn === "string" &&
              typeof product.today === "number" &&
              typeof product.slug === "string" &&
              product.change &&
              typeof product.change.pct === "number",
          );

          if (!controller.signal.aborted) {
            setProducts(validProducts);
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

  const risingProducts = products.filter(
    (product) => product.change.dir === "up",
  );

  const fallingProducts = products.filter(
    (product) => product.change.dir === "down",
  );

  const risers = [...risingProducts]
    .sort(
      (a, b) =>
        Math.abs(b.change.pct) - Math.abs(a.change.pct),
    )
    .slice(0, 6);

  const fallers = [...fallingProducts]
    .sort(
      (a, b) =>
        Math.abs(b.change.pct) - Math.abs(a.change.pct),
    )
    .slice(0, 6);

  const categoryCount = new Set(
    products
      .map((product) =>
        product.category === "dim-dui"
          ? "dim-dudh"
          : product.category,
      )
      .filter(Boolean),
  ).size;

  const stats = [
    {
      label: "পণ্য",
      value: products.length,
      description: "টি নিত্যপ্রয়োজনীয় পণ্য",
    },
    {
      label: "বিভাগ",
      value: categoryCount,
      description: "টি পণ্যের বিভাগ",
    },
    {
      label: "বেড়েছে",
      value: risingProducts.length,
      description: "টি পণ্যের দাম",
    },
  ];

  function retry() {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  return (
    <AccountShell>
      <div className="mx-auto max-w-6xl">
        <section className="grid items-center gap-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-9 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <span className="inline-block rounded-full bg-green-50 px-3 py-1.5 text-sm text-green-800">
              {date || "প্রতিদিনের বাজার দর"}
            </span>

            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              আজকের বাজারের দাম এক নজরে
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              চাল, ডাল, তেল, সবজি, মাছ, মাংস, ডিম ও মসলার দাম —
              বাজারভিত্তিক বিস্তারিত, গড়, সর্বনিম্ন-সর্বাধিক এবং দামের
              পরিবর্তন এক জায়গায়।
            </p>

            <a
              href="#all-products"
              className="mt-6 inline-block rounded-lg bg-green-900 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              সব পণ্য দেখুন
            </a>
          </div>

          <div className="grid grid-cols-3 divide-x divide-green-100 rounded-2xl border border-green-100 bg-green-50/60 p-5">
            {stats.map((stat) => (
              <div key={stat.label} className="px-2 sm:px-4">
                <p className="text-sm text-gray-600">{stat.label}</p>

                <p className="mt-2 text-3xl font-bold text-green-900">
                  {loading || error ? "—" : banglaNumber(stat.value)}
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-600">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 space-y-10">
          {loading ? (
            <>
              <h2 className="text-xl font-bold">
                বাজারের তথ্য লোড হচ্ছে…
              </h2>
              <SkeletonGrid />
            </>
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-white p-8 text-center"
            >
              <p className="text-red-700">{error}</p>

              <button
                type="button"
                onClick={retry}
                className="mt-4 rounded-lg bg-green-900 px-5 py-2 text-white hover:bg-green-800"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : products.length === 0 ? (
            <p className="py-12 text-center text-gray-600">
              এই মুহূর্তে কোনো পণ্য পাওয়া যায়নি।
            </p>
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
                id="all-products"
                title="সব পণ্য"
                subtitle={`মোট ${banglaNumber(products.length)}টি পণ্য দেখানো হচ্ছে`}
                products={products}
              />
            </>
          )}
        </div>
      </div>
    </AccountShell>
  );
}