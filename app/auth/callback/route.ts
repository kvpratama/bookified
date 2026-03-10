import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateRedirect } from "@/lib/validate-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = validateRedirect(searchParams.get("next") ?? undefined);

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      return NextResponse.redirect(
        `${origin}/?auth_failed=true&next=${encodeURIComponent(next)}`,
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/?auth_failed=true&next=${encodeURIComponent(next)}`,
  );
}
