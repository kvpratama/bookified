import {
  BookOpen,
  MessageSquare,
  Library,
  Upload,
  Search,
  LayoutDashboard,
  Moon,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingFeatures() {
  return (
    <section className="bg-background">
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">
        {/* Section Header */}
        <header className="text-center mb-16 animate-fade-in-up">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4 tracking-tight">
            Everything you need to read smarter
          </h2>
          <p className="font-serif text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your PDFs, read in an elegant environment, and chat with an
            AI companion that understands your documents.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-border" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground/50" />
            <div className="h-px w-12 bg-border" />
          </div>
        </header>

        <div className="space-y-24">
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Read Your Books"
              description="Open any PDF in an elegant reading environment. Navigate pages, zoom, and track your progress in a warm, library-inspired interface."
              delay="delay-200"
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Chat with AI"
              description="Ask questions about any book. Our AI provides answers with citations, so you can verify sources and jump directly to relevant pages."
              delay="delay-300"
            />
            <FeatureCard
              icon={<Library className="w-6 h-6" />}
              title="Build Your Library"
              description="Upload PDFs up to 5MB. We'll automatically extract metadata and prepare everything for AI-powered exploration."
              delay="delay-400"
            />
          </div>

          {/* How-To Guides */}
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-6 animate-fade-in-up delay-500">
              <h3 className="font-serif text-2xl text-foreground flex items-center gap-3">
                <Upload className="w-5 h-5 text-accent-foreground" />
                How to Upload
              </h3>
              <StepList
                steps={[
                  `Click "Upload Book" from anywhere in the app`,
                  "Drag and drop a PDF file (under 5MB)",
                  "Review the auto-extracted metadata and edit if needed",
                  `Click "Save & Add to Library" to begin indexing`,
                ]}
              />
            </div>

            <div className="space-y-6 animate-fade-in-up delay-500">
              <h3 className="font-serif text-2xl text-foreground flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-accent-foreground" />
                How to Read
              </h3>
              <StepList
                steps={[
                  "Click any book card from your Dashboard or Library",
                  "Use the floating toolbar to navigate and zoom",
                  "Browse the table of contents via the outline icon",
                  "Try dark mode for comfortable nighttime reading",
                ]}
              />
            </div>

            <div className="space-y-6 animate-fade-in-up delay-700">
              <h3 className="font-serif text-2xl text-foreground flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-accent-foreground" />
                How to Chat
              </h3>
              <StepList
                steps={[
                  "Open any book in the reading view",
                  "Click the message icon in the bottom-right corner",
                  `Ask questions like "What are the main themes here?"`,
                  "Click citations to jump directly to the source pages",
                ]}
              />
            </div>

            <div className="space-y-6 animate-fade-in-up delay-700">
              <h3 className="font-serif text-2xl text-foreground flex items-center gap-3">
                <Search className="w-5 h-5 text-accent-foreground" />
                Best Experience
              </h3>
              <ul className="space-y-4">
                <TipItem
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  text="Explore the dashboard to pick up where you left off"
                />
                <TipItem
                  icon={<AlertCircle className="w-4 h-4" />}
                  text="Always verify AI responses against the original text"
                />
                <TipItem
                  icon={<Moon className="w-4 h-4" />}
                  text="Toggle light/dark mode for comfort"
                />
              </ul>
            </div>
          </div>

          {/* Footer CTA */}
          <footer className="text-center pt-12 border-t border-border/50 animate-fade-in-up delay-1000">
            <p className="font-serif italic text-muted-foreground mb-8 text-lg">
              &quot;Sanctuary is designed to feel like a quiet reading room —
              warm, intentional, and yours.&quot;
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8"
              >
                <Link href="/library">View Your Library</Link>
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card/50 border border-border/50 p-6 rounded-2xl hover:border-accent-foreground/20 transition-colors group animate-fade-in-up",
        delay,
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-accent-foreground/5 flex items-center justify-center text-accent-foreground mb-4 group-hover:bg-accent-foreground/10 transition-colors">
        {icon}
      </div>
      <h3 className="font-serif text-lg text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <span className="shrink-0 w-6 h-6 rounded-full bg-accent-foreground/10 flex items-center justify-center text-[10px] font-bold text-accent-foreground mt-0.5">
            {i + 1}
          </span>
          <span className="text-sm text-muted-foreground leading-snug">
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

function TipItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 text-accent-foreground opacity-70">{icon}</div>
      <span className="text-sm text-muted-foreground leading-relaxed font-sans">
        {text}
      </span>
    </li>
  );
}
