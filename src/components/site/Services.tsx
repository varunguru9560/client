import { Check } from "lucide-react";
import { useSiteContent } from "@/lib/site-content";

export function Services() {
  const { serviceGroups } = useSiteContent();
  return (
    <section id="services" className="bg-muted/50 py-20 lg:py-28">
      <div className="section-shell">
        <div className="max-w-2xl">
          <p className="eyebrow">What we do</p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Every registration, return and licence in one place
          </h2>
          <p className="mt-5 text-muted-foreground">
            Thirty-plus services across registrations, taxation, accounting and sector licences —
            handled by one consultant who knows your file.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {serviceGroups.map((group) => {
            const Icon = group.icon;
            return (
              <article key={group.id} className="soft-card flex flex-col p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft">
                  <Icon className="size-6 text-brand" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{group.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{group.blurb}</p>
                <ul className="mt-5 grid gap-2 text-sm">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-cta" />
                      <span className="text-foreground/85">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
