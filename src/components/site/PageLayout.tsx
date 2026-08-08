import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SiteContentProvider, toSiteContent } from "@/lib/site-content";
import type { RawSiteContent } from "@/lib/site-content.functions";

export function PageLayout({
  raw,
  eyebrow,
  title,
  intro,
  children,
}: {
  raw?: RawSiteContent | null;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <SiteContentProvider content={toSiteContent(raw)}>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <section className="bg-brand-soft/50 pt-32 pb-14 lg:pt-40 lg:pb-20">
            <div className="section-shell max-w-3xl">
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="mt-4 text-3xl font-semibold sm:text-4xl lg:text-5xl">{title}</h1>
              {intro ? <p className="mt-5 text-muted-foreground">{intro}</p> : null}
            </div>
          </section>
          {children}
        </main>
        <Footer />
        <Toaster />
      </div>
    </SiteContentProvider>
  );
}
