"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm overflow-hidden border-border/50 bg-card/80 shadow-2xl backdrop-blur-md transition-all duration-500">
      <CardHeader className="space-y-4 pb-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/5 p-3 text-primary ring-1 ring-primary/20">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>
        <div className="space-y-1">
          <CardTitle className="font-serif text-3xl tracking-tight">
            {step === "email" ? "Sanctuary" : "Verification"}
          </CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground/80">
            {step === "email"
              ? "Your digital reading enclave"
              : "Enter the code sent to your email"}
          </CardDescription>
        </div>
      </CardHeader>

      <div className="relative overflow-hidden">
        {step === "email" ? (
          <form
            onSubmit={handleSendOtp}
            className="animate-in fade-in slide-in-from-right-4 duration-500"
          >
            <CardContent className="space-y-4 px-8">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 bg-background/50 border-border/50 transition-all focus:ring-terracotta/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 animate-in fade-in zoom-in-95">
                  <p
                    className="text-xs font-medium text-destructive text-center"
                    role="alert"
                  >
                    {error}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="px-8 pb-8 pt-4">
              <Button
                type="submit"
                className="w-full h-11 transition-all hover:-translate-y-px active:translate-y-0"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing Entrance...
                  </>
                ) : (
                  <>
                    Continue to Sanctuary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            className="animate-in fade-in slide-in-from-right-4 duration-500"
          >
            <CardContent className="space-y-4 px-8">
              <div className="space-y-2 text-center">
                <p className="text-xs text-muted-foreground mb-4">
                  We&apos;ve sent a 6-digit code to <br />
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    className="pl-10 text-center tracking-[0.5em] font-mono text-lg bg-background/50 border-border/50"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    required
                    maxLength={6}
                    autoFocus
                  />
                </div>
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p
                    className="text-xs font-medium text-destructive text-center"
                    role="alert"
                  >
                    {error}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-4">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Doors...
                  </>
                ) : (
                  "Verify & Enter"
                )}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError(null);
                }}
                className="group flex items-center justify-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="mr-1 h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                Return to Entry
              </button>
            </CardFooter>
          </form>
        )}
      </div>
    </Card>
  );
}
