"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";

export function Landing() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

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
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setTimeout(() => {
      router.push(user ? "/dashboard" : "/login");
    }, 300);
  };

  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${10 + i * 8}%`,
    delay: `${i * 0.6}s`,
    duration: `${6 + (i % 4)}s`,
  }));

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
          className="object-cover blur-sm brightness-70 dark:brightness-50"
          priority
        />
      </div>

      {/* Warm Light Rays */}
      <div className="absolute inset-0 z-1 pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_180deg_at_50%_50%,transparent_0deg,oklch(var(--terracotta)/0.08)_60deg,transparent_120deg)] animate-soft-pulse" />
        <div
          className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,oklch(var(--terracotta)/0.06)_45deg,transparent_90deg)] animate-soft-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Overlay & Vignette */}
      <div className="absolute inset-0 z-2 bg-background/50 backdrop-blur-small transition-colors duration-1000" />
      <div className="absolute inset-0 z-3 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_30%,oklch(var(--background)/0.6)_100%)] pointer-events-none" />
      <div className="absolute inset-0 z-3 bg-[radial-gradient(circle_at_top_left,oklch(var(--dark-chocolate)/0.15)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 z-3 bg-[radial-gradient(circle_at_bottom_right,oklch(var(--dark-chocolate)/0.15)_0%,transparent_50%)] pointer-events-none" />

      {/* Floating Dust Particles */}
      <div className="absolute inset-0 z-4 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full bg-foreground/90 dark:bg-foreground/70 animate-drift"
            style={{
              left: particle.left,
              top: `${80 + (particle.id % 5) * 4}%`,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-3xl text-center px-4">
        <Logo
          className={`mx-auto mb-8 transition-all duration-1000 delay-100 ease-out drop-shadow-md ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        />
        {/* Headline */}
        <h1
          className={`font-serif text-[5rem] sm:text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-foreground mb-6 transition-all duration-1000 delay-200 ease-out drop-shadow-md ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Where books{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-accent-foreground">
              think back
            </span>
            <div className="absolute -bottom-1 left-0 right-0 h-2 bg-accent-foreground/20 blur-sm" />
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
    </div>
  );
}
