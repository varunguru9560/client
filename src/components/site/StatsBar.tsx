const stats = [
  { value: "5.0", label: "Client rating" },
  { value: "13+", label: "Happy clients" },
  { value: "30+", label: "Services offered" },
  { value: "Delhi", label: "Trusted tax & financial consultancy" },
];

export function StatsBar() {
  return (
    <section className="bg-brand-soft py-14">
      <div className="section-shell grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center lg:text-left">
            <p className="font-display text-3xl font-semibold text-brand-deep sm:text-4xl">
              {s.value}
            </p>
            <p className="mt-2 text-sm text-brand-deep/75">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
