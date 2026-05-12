export function TrustScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const value = Math.max(0, Math.min(100, Number(score || 0)));
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const color = value < 40 ? "#A32D2D" : value < 70 ? "#BA7517" : "#1D9E75";
  const verdict = value < 40 ? "FLAGGED" : value < 70 ? "SUSPICIOUS" : "VERIFIED";
  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(value / 100) * circumference} ${circumference}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="26" fontWeight="800">{Math.round(value)}</text>
        <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="10" fontWeight="700">{verdict}</text>
      </svg>
    </div>
  );
}
