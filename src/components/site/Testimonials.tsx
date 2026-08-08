import { Quote, Star } from "lucide-react";
import { useSiteContent } from "@/lib/site-content";

export function Testimonials() {
  const { testimonials } = useSiteContent();
  return (
    <section id="reviews" className="bg-brand-soft/70 py-20 lg:py-28">
      <div className="section-shell">
        <div className="max-w-2xl">
          <p className="eyebrow">Client reviews</p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            A straight 5.0, in our clients' words
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.author} className="soft-card flex h-full flex-col p-7">
              <Quote className="size-7 text-brand" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/85">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-cta text-cta" />
                  ))}
                </div>
                <p className="mt-2 text-sm font-semibold">{t.author}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
