"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function AppToaster() {
  const pathname = usePathname();

  useEffect(() => {
    const url = new URL(window.location.href);
    const notice = url.searchParams.get("notice");

    if (!notice) return;

    if (notice === "login-required") {
      toast.error("বিস্তারিত দাম দেখতে আগে সাইন ইন করুন।", {
        id: "login-required",
      });
    } else if (notice === "social-success") {
      toast.success("সফলভাবে সাইন ইন হয়েছে।", {
        id: "social-success",
      });
    } else if (notice === "social-error") {
      toast.error("সোশ্যাল লগইন সম্পন্ন হয়নি। আবার চেষ্টা করুন।", {
        id: "social-error",
      });
    } else {
      return;
    }

    url.searchParams.delete("notice");

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [pathname]);

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4500,
        style: {
          maxWidth: "90vw",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "#166534",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#b91c1c",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}