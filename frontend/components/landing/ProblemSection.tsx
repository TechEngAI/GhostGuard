export function ProblemSection() {
  const cards = [
    ["NGN 200B+", "Lost annually to ghost workers across Nigeria's public and private sectors"],
    ["23,000+", "Ghost workers discovered in a single state government audit (ICPC)"],
    ["0 tools", "Most organisations have no automated way to detect payroll fraud"],
  ];
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">The Problem</p>
        <h2 className="mt-3 text-4xl font-bold text-ink">Ghost workers are bleeding Nigerian organisations dry.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map(([title, body]) => (
            <div key={title} className="rounded-xl border border-border bg-white p-6 text-left">
              <h3 className="text-4xl font-bold text-brand-dark">{title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-ink-secondary">{body}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-3xl text-lg leading-relaxed text-ink-secondary">
          Payroll fraud hides in routine: names that never show up, accounts that change too often, and attendance patterns that look too perfect. GhostGuard turns those weak signals into evidence before money leaves the company.
        </p>
      </div>
    </section>
  );
}
