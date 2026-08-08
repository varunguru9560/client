import { Facebook, Instagram, Linkedin, Phone, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { navLinks } from "@/data/site";
import { useSiteContent } from "@/lib/site-content";

export function Footer() {
  const { business, serviceGroups } = useSiteContent();
  return (
    <footer className="bg-brand-deep text-brand-foreground">
      <div className="section-shell grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand text-lg font-bold">
              TM
            </span>
            <span className="font-display text-lg font-semibold">The Tax Maestro</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-brand-foreground/70">
            {business.tagline} Tax, compliance and financial advisory led by {business.person},{" "}
            {business.role}, New Delhi.
          </p>

          <div className="mt-6 space-y-1 text-sm text-brand-foreground/80">
            <p>{business.address}</p>
            <p>
              <a href={`tel:${business.mobile}`} className="hover:text-cta">
                M: {business.mobile}
              </a>{" "}
              |{" "}
              <a href={`tel:${business.landline.replace(/-/g, "")}`} className="hover:text-cta">
                {business.landline}
              </a>
            </p>
            <p>GSTIN: {business.gstin}</p>
          </div>

          <div className="mt-6 flex gap-3">
            {[Facebook, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href={`tel:${business.mobile}`}
                aria-label="Social profile"
                className="grid size-10 place-items-center rounded-full bg-brand-foreground/10 transition-colors hover:bg-cta"
              >
                <Icon className="size-4" />
              </a>
            ))}
            <a
              href={`tel:${business.mobile}`}
              aria-label={`Call ${business.mobile}`}
              className="grid size-10 place-items-center rounded-full bg-brand-foreground/10 transition-colors hover:bg-cta"
            >
              <Phone className="size-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {serviceGroups.slice(0, 4).map((group) => (
            <div key={group.id}>
              <h3 className="text-sm font-semibold tracking-widest uppercase">{group.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-brand-foreground/70">
                {group.items.slice(0, 6).map((item) => (
                  <li key={item}>
                    <Link to="/services" className="hover:text-cta">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold tracking-widest uppercase">Quick links</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-brand-foreground/70">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-cta">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-widest uppercase">Business hours</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-brand-foreground/70">
              {business.hours.map((h) => (
                <li key={h.day}>
                  <span className="block text-brand-foreground/90">{h.day}</span>
                  {h.time}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-foreground/15">
        <div className="section-shell flex flex-col gap-2 py-6 text-xs text-brand-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The Tax Maestro. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p>GSTIN {business.gstin} · New Delhi-110045</p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-foreground/20 px-3 py-1.5 font-medium text-brand-foreground/80 transition-colors hover:border-cta hover:text-cta"
            >
              <ShieldCheck className="size-3.5" /> Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
