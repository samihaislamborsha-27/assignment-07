"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  change: {
    dir: string;
    pct: number;
  };
};

const API_URLS = [
  "https://api.api-store.workers.dev/api/bazardor",
  "https://api.abcz.workers.dev/api/bazardor",
];

const categories = [
  { slug: "chal", name: "চাল", icon: "🍚" },
  { slug: "dal", name: "ডাল", icon: "🫘" },
  { slug: "tel", name: "তেল", icon: "🛢️" },
  { slug: "sobji", name: "সবজি", icon: "🥬" },
  { slug: "mach", name: "মাছ", icon: "🐟" },
  { slug: "mangsho", name: "মাংস", icon: "🍗" },
  { slug: "dim-dui", name: "ডিম-দুধ", icon: "🥛" },
  { slug: "mosla", name: "মসলা", icon: "🌶️" },
];

const units: Record<string, string> = {
  kg: "কেজি",
  litre: "লিটার",
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
      ? "bg-green-50 text-green-700"
      : direction === "down"
        ? "bg-red-50 text-red-700"
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
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f3f5ef] text-3xl">
          {product.image}
        </span>

        <div className="min-w-0">
          <h3 className="text-lg font-bold">{product.nameBn}</h3>
          <p className="mt-1 text-sm text-gray-500">
            প্রতি {units[product.unit] ?? product.unit}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-2">
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
  subtitle,
  id,
}: {
  title: string;
  products: Product[];
  subtitle?: string;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>

      {subtitle && (
        <p className="mt-2 text-gray-500">{subtitle}</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
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
            <div className="h-12 w-12 rounded-xl bg-gray-200" />
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

          if (!response.ok) {
            throw new Error("Products request failed");
          }

          const data: Product[] = await response.json();

          if (!Array.isArray(data)) {
            throw new Error("Invalid product response");
          }

          if (!controller.signal.aborted) {
            setProducts(data);
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
    .sort((a, b) => b.change.pct - a.change.pct)
    .slice(0, 6);

  const fallers = products
    .filter((product) => product.change.dir === "down")
    .sort(
      (a, b) =>
        Math.abs(b.change.pct) - Math.abs(a.change.pct),
    )
    .slice(0, 6);

  function retry() {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-icon.png"
                alt=""
                width={44}
                height={44}
                className="rounded-xl"
              />
              <div>
                <p className="text-2xl font-bold text-[#174b2b]">
                  বাজার দর
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {date || "আজকের বাজারের তথ্য"}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="rounded-lg border border-green-800 px-4 py-2 text-sm font-semibold text-green-900 sm:text-base"
              >
                সাইন ইন
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-[#174b2b] px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 sm:text-base"
              >
                সাইন আপ
              </Link>
            </div>
          </div>

          <nav
            aria-label="পণ্যের বিভাগ"
            className="flex gap-2 overflow-x-auto pb-3"
          >
            <Link
              href="/"
              aria-current="page"
              className="shrink-0 rounded-lg bg-green-50 px-3 py-2 font-semibold text-green-800"
            >
              সব পণ্য
            </Link>

            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="shrink-0 rounded-lg px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-800"
              >
                {category.icon} {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {!loading && products.length > 0 && (
        <div className="ticker overflow-hidden border-b border-gray-200 bg-[#eef2e9] py-3">
          <div className="ticker-track">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className="flex shrink-0"
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 px-5 text-sm"
                  >
                    <span>{product.image}</span>
                    <span className="whitespace-nowrap">
                      {product.nameBn} {banglaNumber(product.today)} টাকা/
                      {units[product.unit] ?? product.unit}
                    </span>
                    <ChangeBadge product={product} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="grid items-center gap-6 rounded-3xl border border-gray-200 bg-white p-6 sm:p-9 md:grid-cols-[1.6fr_1fr]">
          <div>
            <span className="inline-block rounded-full bg-[#edf3e7] px-3 py-1.5 text-sm text-green-900">
              {date || "প্রতিদিনের বাজার দর"}
            </span>

            <h1 className="mt-4 text-3xl leading-tight font-bold sm:text-4xl">
              আজকের বাজারের দাম এক নজরে
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              চাল, ডাল, তেল, সবজি, মাছ, মাংস, ডিম ও মসলার দাম —
              বাজারভিত্তিক বিস্তারিত, গড়, সর্বনিম্ন-সর্বাধিক এবং
              দামের পরিবর্তন এক জায়গায়।
            </p>

            <a
              href="#সব-পণ্য"
              className="mt-6 inline-block rounded-lg bg-[#174b2b] px-5 py-3 font-semibold text-white hover:bg-green-900"
            >
              সব পণ্য দেখুন
            </a>
          </div>

          <Image
            src="/bazar-hero.png"
            alt="তাজা ফল ও সবজির ঝুড়ি"
            width={400}
            height={320}
            priority
            className="mx-auto h-auto w-full max-w-72 object-contain"
          />
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
                onClick={retry}
                className="mt-4 rounded-lg bg-[#174b2b] px-5 py-2 text-white"
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
                title="▲ আজ দাম বেড়েছে"
                products={risers}
              />

              <ProductSection
                title="▼ আজ দাম কমেছে"
                products={fallers}
              />

              <ProductSection
                id="সব-পণ্য"
                title="সব পণ্য"
                subtitle={`মোট ${banglaNumber(products.length)}টি পণ্য দেখানো হচ্ছে`}
                products={products}
              />
            </>
          )}
        </div>
      </main>

      <footer className="mt-10 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-6 text-sm text-gray-600 sm:px-6 md:flex-row">
          <p>
            <span className="font-bold text-green-900">বাজার দর</span>
            {" "}— প্রয়োজনীয় পণ্যের দাম এক নজরে।
          </p>
          <p>
            সকল দাম সম্ভাব্য; বাজার অবস্থার ওপর নির্ভর করে পরিবর্তিত হয়।
          </p>
        </div>
      </footer>
    </>
  );
}