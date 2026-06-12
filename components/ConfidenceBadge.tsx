import {
  getConfidenceColor,
  getConfidenceLabel,
  getConfidenceLevel,
} from "@/lib/confidence";

interface ConfidenceBadgeProps {
  trustScore: number;
}

export default function ConfidenceBadge({ trustScore }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(trustScore);
  const label = getConfidenceLabel(level);
  const color = getConfidenceColor(level);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${color}`}
    >
      {label} ({(trustScore * 100).toFixed(0)}%)
    </span>
  );
}
