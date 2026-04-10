"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Logo } from "@/components/logo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PHRASES = [
  "reading comes alive",
  "books think back",
  "stories speak back",
];

const ROTATION_INTERVAL = 4000;
const TRANSITION_DURATION = 1000;

export function Landing() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      timeoutRef.current = setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
        setIsTransitioning(false);
      }, TRANSITION_DURATION);
    }, ROTATION_INTERVAL);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoaded]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setMousePosition({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const handleEnter = async () => {
    setIsNavigating(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setTimeout(() => {
        router.push(user ? "/dashboard" : "/login");
      }, 300);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsNavigating(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center px-6 overflow-hidden transition-opacity duration-500 ${
        isNavigating ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background Image with Parallax */}
      <div
        className="absolute inset-0 z-0 transition-transform duration-200 ease-out"
        style={{
          transform: `translate(${mousePosition.x * 0.9}px, ${mousePosition.y * 0.9}px) scale(1.05)`,
        }}
      >
        <Image
          src="/landing-bg.png"
          alt="Library Background"
          fill
          className="object-cover blur-xs brightness-100 dark:brightness-40"
          priority
        />
      </div>

      {/* Warm Light Rays */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_180deg_at_50%_50%,transparent_0deg,oklch(var(--terracotta)/0.08)_60deg,transparent_120deg)] animate-soft-pulse" />
        <div
          className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,oklch(var(--terracotta)/0.06)_45deg,transparent_90deg)] animate-soft-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Overlay & Vignette */}
      <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-small transition-colors duration-1000" />
      <div className="absolute inset-0 z-30 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_30%,oklch(var(--background)/0.6)_100%)] pointer-events-none" />
      <div className="absolute inset-0 z-30 bg-[radial-gradient(circle_at_top_left,oklch(var(--dark-chocolate)/0.15)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 z-30 bg-[radial-gradient(circle_at_bottom_right,oklch(var(--dark-chocolate)/0.15)_0%,transparent_50%)] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-40 max-w-3xl text-center px-4 mt-10">
        <Logo
          className={`mx-auto mb-8 transition-all duration-1000 delay-100 ease-out drop-shadow-md ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        />
        {/* Headline */}
        <h1
          className={`font-serif text-[3rem] sm:text-[3rem] leading-[1.1] tracking-[-0.02em] text-foreground mb-6 transition-all duration-1000 delay-200 ease-out drop-shadow-md ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Where{" "}
          <span className="relative inline-block align-bottom sm:text-left">
            {/* Invisible sizer to reserve width for the longest phrase */}
            <span className="invisible text-left" aria-hidden="true">
              {PHRASES.reduce((a, b) => (a.length > b.length ? a : b))}
            </span>
            <span
              className={`absolute inset-0 z-40 text-accent-foreground transition-all duration-700 ease-in-out ${
                isTransitioning
                  ? "opacity-0 -translate-y-4"
                  : "opacity-100 translate-y-0"
              }`}
            >
              {PHRASES[phraseIndex]}
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className={`font-serif text-lg sm:text-base leading-[1.9] tracking-[0.02em] text-muted-foreground mb-12 max-w-xl mx-auto transition-all duration-1000 delay-400 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          A sanctuary for serious readers. Upload your books and engage with an
          AI companion that understands context, remembers your journey, and
          enriches every page.
        </p>

        {/* CTA Button */}
        <div
          className={`mb-12 transition-all duration-1000 delay-600 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Button
            onClick={handleEnter}
            variant="default"
            className="group relative px-8 py-6 text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
          >
            <span className="absolute inset-0 bg-linear-to-r from-accent-foreground/20 via-accent-foreground/30 to-accent-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="absolute inset-0 animate-pulse-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center gap-3">
              Enter the Library
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Button>
        </div>

        {/* Decorative Divider */}
        <div
          className={`relative transition-all duration-1000 delay-800 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-24 bg-linear-to-r from-transparent to-accent-foreground/90 dark:to-accent-foreground/40" />
            <div className="h-[2px] w-24 bg-linear-to-l from-transparent to-accent-foreground/90 dark:to-accent-foreground/40" />
          </div>
        </div>
      </div>

      {/* Scroll Hint */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
        }
        className={cn(
          "absolute bottom-8 left-1/2 -translate-x-1/2 z-40 hidden sm:inline-flex text-muted-foreground/60 hover:text-foreground hover:bg-transparent transition-all duration-1000 delay-1000 ease-out",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
        aria-label="Scroll down to learn more"
      >
        <ChevronDown className="size-6 animate-bounce-gentle" />
      </Button>
    </div>
  );
}
