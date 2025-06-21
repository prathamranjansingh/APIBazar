export const plans = [
  "free",
  "pro",
  "business",
  "business plus",
  "business extra",
  "business max",
  "advanced",
  "enterprise",
] as const;

export type PlanProps = (typeof plans)[number];
