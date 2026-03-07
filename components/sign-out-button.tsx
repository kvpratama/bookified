"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to sign out. Please try again.");
        return;
      }
      toast.success("Signed out successfully.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={handleSignOut}>
      <LogOut className="size-4" />
      <span className="sr-only">Sign out</span>
    </Button>
  );
}
