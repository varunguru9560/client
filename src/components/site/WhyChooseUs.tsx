import { differentiators } from "@/data/site";

export function WhyChooseUs() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-shell">
        <div className="max-w-2xl">
          <p className="eyebrow">Why choose us</p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            A boutique practice with wide-ranging expertise
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="soft-card p-7">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft">
                  <Icon className="size-5 text-brand" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
