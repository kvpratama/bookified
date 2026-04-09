import { type NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  // Validate that the blob belongs to the authenticated user
  try {
    const blobUrl = new URL(url);
    const pathname = blobUrl.pathname.replace(/^\//, "");
    const isUserBlob = pathname.startsWith(`${user.id}/`);
    const isSystemBlob = pathname.startsWith("system/");
    if (!isUserBlob && !isSystemBlob) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const token = process.env.BOOKIFIED_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await get(url, {
      access: "private",
      token,
    });

    if (result?.statusCode !== 200) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Blob retrieval failed" },
      { status: 502 },
    );
  }
}
