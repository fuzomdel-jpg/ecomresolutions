import { CaseStatus } from "@prisma/client";
import { Badge } from "@/components/ui/card";
import { customerStatusLabel } from "@/lib/cases";

const tone: Record<CaseStatus, "blue" | "green" | "amber" | "slate" | "red"> = {
  NEW: "blue",
  DIAGNOSING: "blue",
  WAITING_FOR_CUSTOMER: "amber",
  IN_PROGRESS: "blue",
  QA: "blue",
  RESOLVED: "green",
  CLOSED: "slate",
  CANCELLED: "red",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <Badge tone={tone[status]}>
      <span aria-hidden="true">● </span>
      {customerStatusLabel[status]}
    </Badge>
  );
}
