import { Banknote, Fingerprint, MapPinned, Plane, Search, WalletCards } from "lucide-react";

export function FeaturesSection() {
  const features = [
    { icon: MapPinned, title: "GPS Geofencing", body: "Workers must be physically inside the office boundary to check in." },
    { icon: Fingerprint, title: "Device Fingerprinting", body: "Detect multiple workers checking in from one phone." },
    { icon: Plane, title: "Impossible Travel", body: "Catch GPS spoofing with physics. You can't be in two places at once." },
    { icon: Banknote, title: "Bank Velocity", body: "Flag workers who rotate bank accounts to evade detection." },
    { icon: Search, title: "Approval Path Anomaly", body: "Expose the insider handling ghost accounts." },
    { icon: WalletCards, title: "Gross-to-Net Variance", body: "Real employees have deductions. Ghosts get flat cash out." },
  ];
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center"><p className="text-xs font-semibold uppercase tracking-wide text-brand">Features</p><h2 className="mt-3 text-4xl font-bold">10 signals. Zero ghost workers.</h2></div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-soft">
                <Icon className="h-8 w-8 text-brand" />
                <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
