import { cn } from "@/lib/utils/cn";

const STATUS_MAP: Record<string, string> = {
  active: "success",
  won: "success",
  customer: "success",
  positive: "success",
  open: "info",
  lead: "info",
  prospect: "indigo",
  partner: "violet",
  neutral: "neutral",
  churned: "danger",
  lost: "danger",
  negative: "danger",
  churnRisk: "warning",
};

export type BadgeProps = {
  children: string;
  variant?: string;
  statusKey?: string;
  className?: string;
};

export function Badge({ children, variant, statusKey, className }: BadgeProps) {
  const v =
    variant ||
    (statusKey ? STATUS_MAP[statusKey] : undefined) ||
    STATUS_MAP[children] ||
    "neutral";

  return (
    <span className={cn("badge-pill", `badge-pill--${v}`, className)}>
      <span className="badge-pill__dot" />
      {children}
    </span>
  );
}
