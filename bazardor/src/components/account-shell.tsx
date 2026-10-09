"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

const categories = [
  ["chal", "🍚", "চাল"],
  ["dal", "🫘", "ডাল"],
  ["tel", "🛢️", "তেল"],
  ["sobji", "🥬", "সবজি"],
  ["mach", "🐟", "মাছ"],
  ["mangsho", "🍗", "মাংস"],
  ["dim-dudh", "🥛", "ডিম-দুধ"],
  ["mosla", "🌶️", "মসলা"],
];

type Product = {
  id: number;
  nameBn: string;
  image?: string;
  today: number;
  unit: string;
  change: {
    dir: string;
    pct: number;
  };
};

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

function Avatar({
  image,
  name,
}: {
  image?: string | null;
  name?: string | null;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);

  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100 font-semibold text-green-900">
      {image && failedImage !== image ? (
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailedImage(image)}
        />
      ) : (
        name?.trim().slice(0, 1).toUpperCase() || "U"
      )}
    </span>
  );
}

export default function AccountShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const [date, setDate] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [signoutError, setSignoutError] = useState("");

  useEffect(() => {
    setDate(
      new Intl.DateTimeFormat("bn-BD", {
        timeZone: "Asia/Dhaka",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );

    const controller = new AbortController();

    async function loadPrices() {
      const bases = [
        "https://api.api-store.workers.dev/api/bazardor",
        "https://api.abcz.workers.dev/api/bazardor",
      ];

      for (const base of bases) {
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

          if (!controller.signal.aborted) {
            setProducts(
              list.filter(
                (item) =>
                  item &&
                  typeof item.nameBn === "string" &&
                  typeof item.today === "number" &&
                  item.change &&
                  typeof item.change.pct === "number",
              ),
            );
          }

          return;
        } catch {
          if (controller.signal.aborted) return;
        }
      }
    }

    void loadPrices();

    return () => controller.abort();
  }, []);

  async function signout() {
    if (leaving) return;

    setLeaving(true);
    setSignoutError("");

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setSignoutError("সাইন আউট করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }

      router.replace("/signin");
      router.refresh();
    } catch {
      setSignoutError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-900 text-xl text-white"
            >
              🛒
            </span>

            <span>
              <span className="block text-xl font-bold">
                বাজার দর
              </span>
              <span className="mt-1 block text-xs text-gray-600 sm:text-sm">
                {date || "প্রতিদিনের বাজারের দাম"}
              </span>
            </span>
          </Link>

          {isPending ? (
            <span className="text-sm text-gray-500">
              অপেক্ষা করুন…
            </span>
          ) : session ? (
            <details
            className="group relative"
            onKeyDown={(event) => {
            if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget
            .querySelector<HTMLElement>("summary")
            ?.focus();
              }
              }}
              >
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 hover:bg-green-50 [&::-webkit-details-marker]:hidden">
                <Avatar
                  image={session.user.image}
                  name={session.user.name}
                />

                <span className="max-w-24 truncate text-sm font-semibold sm:max-w-44">
                  {session.user.name}
                </span>

                <span
                  aria-hidden="true"
                  className="transition-transform group-open:rotate-180"
                >
                  ⌄
                </span>
              </summary>

              <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[85vw] rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                <p className="wrap-break-words font-semibold">
                  {session.user.name}
                </p>

                <p className="mt-1 break-all text-xs text-gray-500">
                  {session.user.email}
                </p>

                <div className="mt-3 border-t border-gray-100 pt-2">
                  <Link
                    href="/profile"
                    onClick={(event) =>
                      event.currentTarget.closest("details")?.removeAttribute("open")
                    }
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-green-50"
                  >
                    👤 আমার প্রোফাইল
                  </Link>

                  <button
                    type="button"
                    onClick={signout}
                    disabled={leaving}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {leaving ? "অপেক্ষা করুন…" : "↪ সাইন আউট"}
                  </button>

                  {signoutError && (
                    <p role="alert" className="mt-2 text-xs text-red-700">
                      {signoutError}
                    </p>
                  )}
                </div>
              </div>
            </details>
          ) : (
            <div className="flex shrink-0 gap-2 text-sm">
              <Link
                href="/signin"
                className="rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                সাইন ইন
              </Link>

              <Link
                href="/signup"
                className="rounded-lg bg-green-900 px-3 py-2 text-white hover:bg-green-800"
              >
                সাইন আপ
              </Link>
            </div>
          )}
        </div>

        <nav
          aria-label="পণ্যের বিভাগ"
          className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6"
        >
          {categories.map(([slug, icon, label]) => {
            const active = pathname === `/category/${slug}`;

            return (
              <Link
                key={slug}
                href={`/category/${slug}`}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm sm:text-base ${
                  active
                    ? "bg-green-900 text-white"
                    : "hover:bg-green-50"
                }`}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      {products.length > 0 && (
        <div className="overflow-hidden border-b border-green-100 bg-green-50 py-3">
          <div className="account-price-track flex w-max">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1 ? true : undefined}
                className="flex shrink-0 items-center gap-8 pr-8"
              >
                {products.map((product) => (
                  <span
                    key={product.id}
                    className="flex items-center gap-2 whitespace-nowrap text-sm"
                  >
                    <span aria-hidden="true">{product.image}</span>
                    <span>{product.nameBn}</span>
                    <span>
                      {number(product.today)} টাকা/
                      {units[product.unit] ?? product.unit}
                    </span>

                    <span
                      className={
                        product.change.dir === "up"
                          ? "font-semibold text-red-700"
                          : product.change.dir === "down"
                            ? "font-semibold text-green-700"
                            : "text-gray-500"
                      }
                    >
                      {product.change.dir === "up"
                        ? "▲"
                        : product.change.dir === "down"
                          ? "▼"
                          : "—"}{" "}
                      {number(Math.abs(product.change.pct), 1)}%
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 px-4 py-12 sm:px-6 sm:py-14">
        {children}
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm leading-6 text-gray-600 sm:flex-row sm:justify-between">
          <p>
            <span className="font-semibold text-green-900">
              বাজার দর
            </span>
            {" "}— প্রয়োজনীয় পণ্যের দাম এক নজরে।
          </p>

          <p>
            সকল দাম সম্ভাব্য; বাজারের অবস্থার উপর নির্ভর করে পরিবর্তিত হয়।
          </p>
        </div>
      </footer>

      <style>{`
        .account-price-track {
          animation: account-ticker 100s linear infinite;
        }

        .account-price-track:hover {
          animation-play-state: paused;
        }

        @keyframes account-ticker {
          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .account-price-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}