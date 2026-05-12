"use client";

const labels = ["Weak", "Fair", "Good", "Strong"];
const colors = ["bg-danger", "bg-warning", "bg-yellow-500", "bg-brand"];

export function PasswordStrength({ password }: { password: string }) {
  const score = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const level = Math.max(1, score);
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <span key={bar} className={`h-2 flex-1 rounded-full ${bar <= level ? colors[level - 1] : "bg-gray-200"}`} />
        ))}
      </div>
      <p className="mt-1 text-xs font-medium text-ink-secondary">{labels[level - 1]}</p>
    </div>
  );
}
