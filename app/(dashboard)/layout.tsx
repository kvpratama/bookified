import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <Image
                src="/sanctuary_logo.png"
                alt="Sanctuary"
                width={32}
                height={32}
                className="group-hover:opacity-90 transition-opacity"
              />
              <div className="flex flex-col">
                <span className="font-serif font-medium leading-tight text-foreground">
                  Sanctuary
                </span>
                <span className="text-[9px] tracking-[0.2em] font-semibold text-muted-foreground uppercase">
                  Reading Room
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/library"
                className="text-[11px] uppercase tracking-[0.15em] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Library
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
