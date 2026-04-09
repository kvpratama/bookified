import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-6xl font-serif font-bold text-foreground mb-2">
        404
      </h1>
      <h2 className="text-xl font-serif text-muted-foreground mb-2">
        Page not found
      </h2>
      <div className="w-16 h-px bg-accent-foreground/30 my-4" />
      <p className="text-muted-foreground mb-8 max-w-md">
        It seems you&apos;ve wandered into an uncharted section of the library.
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild>
        <Link href="/">Return to the Reading Room</Link>
      </Button>
    </div>
  );
}
