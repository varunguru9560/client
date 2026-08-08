import { Check } from "lucide-react";
import { useSiteContent } from "@/lib/site-content";
import portrait from "@/assets/consultant-portrait.jpg";

const points = [
  "Profound working knowledge of income tax, GST and corporate compliance",
  "Meticulous attention to detail on every filing and registration",
  "Proactive updates — deadlines and notices flagged before they cost you",
  "Complex matters broken down into clear, accessible terms",
];

export function About() {
  const { business } = useSiteContent();
  return (
    <section id="about" className="py-20 lg:py-28">
      <div className="section-shell grid items-center gap-14 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <div aria-hidden className="absolute inset-4 -rotate-2 rounded-[2rem] bg-brand-soft" />
          <img
            src={portrait}
            alt={`${business.person}, ${business.role} at The Tax Maestro in New Delhi`}
            loading="lazy"
            width={1024}
            height={1280}
            className="relative w-full rounded-[2rem] border border-border object-cover shadow-[var(--shadow-card)]"
          />
        </div>

        <div className="order-1 lg:order-2">
          <p className="eyebrow">About the consultant</p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Meet {business.person} — {business.role}
          </h2>
          <p className="mt-5 text-muted-foreground">
            Shweta Singh is an exceptional tax and financial consultant whose practice is built on
            depth of knowledge and genuine care for each client. From first-time filers to growing
            firms, trusts and NGOs, she takes personal responsibility for every engagement.
          </p>
          <p className="mt-4 text-muted-foreground">
            Her commitment is simple: translate complex tax, compliance and registration matters
            into clear, accessible terms so you can make confident decisions — and stay ahead of
            every statutory deadline instead of reacting to it.
          </p>

          <ul className="mt-8 grid gap-3">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft">
                  <Check className="size-3 text-brand" />
                </span>
                <span className="text-foreground/85">{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-border bg-brand-soft/60 px-5 py-4 text-sm">
            <span className="font-semibold">GSTIN:</span> {business.gstin}
          </div>
        </div>
      </div>
    </section>
  );
}
