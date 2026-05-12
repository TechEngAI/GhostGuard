import { Check } from "lucide-react";

export function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex w-full items-start">
      {steps.map((step, index) => {
        const number = index + 1;
        const complete = number < currentStep;
        const active = number === currentStep;
        return (
          <div key={step} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${complete || active ? "bg-brand text-white" : "bg-gray-200 text-ink-tertiary"}`}>
                {complete ? <Check className="h-4 w-4" /> : number}
              </div>
              <span className={`mt-2 text-center text-xs font-semibold ${active ? "text-brand-dark" : "text-ink-tertiary"}`}>{step}</span>
            </div>
            {index < steps.length - 1 && <div className={`mt-4 h-0.5 flex-1 ${complete ? "bg-brand" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}
