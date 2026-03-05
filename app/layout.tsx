import type { Metadata } from "next";
import { Inter, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanctuary | Reading Room",
  description:
    "A premium AI reading environment designed like a quiet library.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${libreBaskerville.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Navigation Bar */}
          <header
            suppressHydrationWarning
            className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md"
          >
            <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    suppressHydrationWarning
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif font-medium leading-tight text-foreground">
                    Sanctuary
                  </span>
                  <span className="text-[9px] tracking-[0.2em] font-semibold text-muted-foreground uppercase">
                    Reading Room
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border hover:bg-muted rounded transition-colors text-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    suppressHydrationWarning
                  >
                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
                  </svg>
                  Continue Reading
                </button>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
