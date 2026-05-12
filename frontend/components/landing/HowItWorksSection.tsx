import { Brain, CreditCard, MapPin } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    { icon: MapPin, title: "Workers verify their location", body: "GPS geofencing ensures workers physically check in from the office. Remote spoofing is detected instantly." },
    { icon: Brain, title: "AI scores every worker", body: "Isolation Forest ML analyses 10 signals across attendance, banking, and behaviour. Every worker gets a Trust Score." },
    { icon: CreditCard, title: "Squad pays verified workers", body: "HR approves the clean list. Squad API disburses salary directly to verified bank accounts." },
  ];
  return (
    <section id="how-it-works" className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center"><p className="text-xs font-semibold uppercase tracking-wide text-brand">How It Works</p><h2 className="mt-3 text-4xl font-bold">From check-in to salary, verified.</h2></div>
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div className="absolute left-1/4 right-1/4 top-12 hidden h-0.5 bg-border md:block" />
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-xl border border-border bg-white p-6">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand-dark"><Icon className="h-8 w-8" /></div>
                <p className="text-sm font-bold text-brand">Step {index + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
