"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Landing() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleEnter = async () => {
    setIsNavigating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setTimeout(() => {
      router.push(user ? "/dashboard" : "/login");
    }, 300);
  };

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center px-6 overflow-hidden transition-opacity duration-300 ${
        isNavigating ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/landing-bg.png"
          alt="Library Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[15px] transition-colors duration-1000" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-background/20" />
      </div>

      <div className="relative z-10 max-w-2xl text-center animate-fade-in-up">
        {/* <div className="mb-8 flex justify-center">
          <Image
            src="/sanctuary_logo.png"
            alt="Sanctuary"
            width={120}
            height={120}
            className="drop-shadow-lg"
          />
        </div> */}

        <div className="rounded-lg bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm p-16 sm:p-6">
          <h1 className="mb-6 font-serif text-[3.5rem] leading-tight tracking-tight text-foreground sm:text-[2.5rem]">
            Where books think back
          </h1>

          <p className="mb-8 mx-auto max-w-lg font-serif text-md leading-relaxed text-muted-foreground opacity-90 sm:text-md">
            A sanctuary for serious readers. Upload your books and engage with
            an AI companion that understands context, remembers your journey,
            and enriches every page.
          </p>

          <Button onClick={handleEnter} variant="default">
            Enter the Library
          </Button>

          <div className="mt-8 h-px w-[120px] mx-auto bg-gradient-to-r from-transparent via-accent-foreground/40 to-transparent animate-scale-in" />
        </div>
      </div>
    </div>
  );
}
