"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { validateRedirect } from "@/lib/validate-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  otp: z
    .string()
    .length(6, "Verification code must be 6 digits.")
    .regex(/^\d+$/, "Verification code must contain only numbers."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function sanitizeAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email") && lower.includes("rate")) {
    return "Too many attempts. Please try again later.";
  }
  if (lower.includes("invalid") || lower.includes("expired")) {
    return "Invalid or expired code. Please try again.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Connection issue. Please check your network.";
  }
  return "Unable to complete request. Please try again.";
}

export function LoginForm({
  next,
  callbackError,
}: {
  next?: string;
  callbackError?: string;
}) {
  const router = useRouter();
  const redirectTo = validateRedirect(next);
  const [error, setError] = useState<string | null>(callbackError ?? null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  const email = form.watch("email");

  async function handleSendOtp() {
    const isValid = await form.trigger("email");
    if (!isValid) return;

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: form.getValues("email"),
        options: { shouldCreateUser: true },
      });

      if (authError) {
        setError(sanitizeAuthError(authError.message));
        toast.error("Failed to send verification code");
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("otp");
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("Failed to send verification code");
      setLoading(false);
    }
  }

  async function handleVerifyOtp(data: LoginFormValues) {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: "email",
      });

      if (authError) {
        setError(sanitizeAuthError(authError.message));
        toast.error("Invalid verification code");
        setLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("Failed to verify code");
      setLoading(false);
    }
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
        <Form {...form}>
          {step === "email" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <CardContent className="space-y-4 px-8">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel
                        htmlFor="email"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
                      >
                        Email Address
                      </FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                        <FormControl>
                          <Input
                            id="email"
                            placeholder="name@example.com"
                            className="pl-10 bg-background/50 border-border/50 transition-all focus:ring-ring/20"
                            {...field}
                            autoFocus
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
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
              onSubmit={form.handleSubmit(handleVerifyOtp)}
              className="animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <CardContent className="space-y-4 px-8">
                <div className="space-y-2 text-center">
                  <p className="text-xs text-muted-foreground mb-4">
                    We&apos;ve sent a 6-digit code to <br />
                    <span className="font-semibold text-foreground">
                      {email}
                    </span>
                  </p>
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="otp" className="sr-only">
                          Verification code
                        </FormLabel>
                        <div className="relative">
                          <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                          <FormControl>
                            <Input
                              id="otp"
                              type="text"
                              inputMode="numeric"
                              placeholder="000000"
                              className="pl-10 text-center tracking-[0.5em] font-mono text-lg bg-background/50 border-border/50"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value.replace(/[^0-9]/g, ""),
                                )
                              }
                              maxLength={6}
                              autoFocus
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
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
              <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-4">
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading}
                >
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
                    form.setValue("otp", "");
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
        </Form>
      </div>
    </Card>
  );
}
