import { BadgeCheck, Landmark, ReceiptText } from "lucide-react";

export function SquadSection() {
  const items = [
    { icon: BadgeCheck, title: "Bank Verification", body: "Squad confirms every worker's account name matches their identity." },
    { icon: Landmark, title: "Salary Disbursement", body: "Squad pays verified workers directly after HR approval." },
    { icon: ReceiptText, title: "Tamper-Evident Receipts", body: "Every payment generates a Squad TX ID linked to attendance records." },
  ];
  return (
    <section className="bg-brand-dark py-24 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold">Built on Squad's payment infrastructure.</h2>
        <div className="mt-10 grid gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/10 p-6 sm:flex-row sm:items-center">
                <Icon className="h-9 w-9 text-brand-light" />
                <div><h3 className="text-xl font-bold">{item.title}</h3><p className="mt-1 text-sm text-gray-200">{item.body}</p></div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-brand-light">GhostGuard uses Squad's sandbox API and is production-ready.</p>
      </div>
    </section>
  );
}
