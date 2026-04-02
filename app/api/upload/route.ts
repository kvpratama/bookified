import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BOOKIFIED_BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        // 1. Authenticate user
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("Upload unauthorized: No user found");
          throw new Error("Unauthorized");
        }

        // 2. Validate path (Must start with user's ID to prevent cross-user uploads)
        if (!pathname.startsWith(`${user.id}/`)) {
          console.error(
            "Upload path mismatch. User:",
            user.id,
            "Path:",
            pathname,
          );
          throw new Error("Invalid upload path: Must start with your user ID");
        }

        // console.log(
        //   "Generating upload token for user:",
        //   user.id,
        //   "path:",
        //   pathname,
        // );

        // 3. Define permissions
        return {
          allowedContentTypes: ["application/pdf", "image/png", "image/jpeg"],
          maximumSizeInBytes: MAX_FILE_SIZE,
          tokenPayload: JSON.stringify({
            userId: user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // console.log("Upload completed for", blob.url);
        try {
          const { userId } = JSON.parse(tokenPayload!);
          console.log("User who uploaded:", userId);
        } catch (error) {
          console.error("Failed to parse tokenPayload", error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Blob upload error handler:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
