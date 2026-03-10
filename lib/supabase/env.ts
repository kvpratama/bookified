const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable",
  );
}

export const supabaseUrl = url;
export const supabaseKey = key;
