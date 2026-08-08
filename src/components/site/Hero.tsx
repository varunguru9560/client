import { Phone, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/lib/site-content";
import heroOffice from "@/assets/hero-office.jpg";

export function Hero() {
  const { business } = useSiteContent();
  return (
    <section id="home" className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div
        aria-hidden
        className="absolute -top-40 -right-24 size-[38rem] rounded-full bg-brand-soft blur-3xl"
      />
      <div className="section-shell relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-widest text-brand-deep uppercase">
            {business.tagline}
          </span>
          <h1 className="mt-6 text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-[3.4rem]">
            Expert Tax & Financial Solutions,{" "}
            <span className="text-brand">Trusted Across Delhi</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            {business.person} is a {business.role} known for profound technical knowledge,
            meticulous attention to detail and proactive client service — covering income tax, GST,
            company registrations, licences and financial advisory from Palam, New Delhi.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="cta" size="xl" asChild>
              <Link to="/contact">Book a Consultation</Link>
            </Button>
            <Button variant="brandOutline" size="xl" asChild>
              <a href={`tel:${business.mobile}`}>
                <Phone className="size-4" /> {business.mobile}
              </a>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
              <span className="text-2xl font-semibold">5.0</span>
              <div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-cta text-cta" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Rated by 13 reviews</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              GSTIN <span className="font-medium text-foreground">{business.gstin}</span>
            </p>
          </div>
        </div>

        <div className="relative">
          <img
            src={heroOffice}
            alt="Consultation desk with financial statements and calculator at The Tax Maestro's Delhi office"
            width={1600}
            height={1104}
            className="w-full rounded-[2rem] border border-border object-cover shadow-[var(--shadow-float)]"
          />
          <div className="absolute -bottom-6 left-6 rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-float)]">
            <p className="text-2xl font-semibold text-brand">30+</p>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Compliance services
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
