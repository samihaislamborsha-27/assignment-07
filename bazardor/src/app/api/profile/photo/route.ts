import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return Response.json({ error: "অনুমতি নেই।" }, { status: 403 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "সাইন ইন করুন।" }, { status: 401 });
  }

  const length = Number(request.headers.get("content-length"));
  if (length > 6 * 1024 * 1024) {
    return Response.json({ error: "ছবি সর্বোচ্চ ৫ MB হতে পারবে।" }, { status: 413 });
  }

  try {
    const form = await request.formData();
    const file = form.get("photo");

    if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "সর্বোচ্চ ৫ MB-এর ছবি নির্বাচন করুন।" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let mime = "";

    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      mime = "image/jpeg";
    } else if (
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      mime = "image/png";
    } else if (
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    ) {
      mime = "image/webp";
    }

    if (!mime) {
      return Response.json({ error: "JPG, PNG অথবা WebP ছবি দিন।" }, { status: 400 });
    }

    await db.collection("profilePhotos").updateOne(
      { userId: session.user.id },
      { $set: { data: bytes, mime, updatedAt: new Date() } },
      { upsert: true }
    );

    return Response.json({
      image: `/api/profile/photo?v=${Date.now()}`,
    });
  } catch {
    return Response.json({ error: "ছবি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response(null, { status: 401 });

  const photo = await db.collection("profilePhotos").findOne({
    userId: session.user.id,
  });

  if (!photo) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(photo.data.buffer), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}