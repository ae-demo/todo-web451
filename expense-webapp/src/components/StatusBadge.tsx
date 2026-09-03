import { Badge } from "@astryxdesign/core/Badge";

const VARIANT: Record<string, "info" | "success" | "error"> = {
  submitted: "info",
  approved: "success",
  rejected: "error",
};

const LABEL: Record<string, string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT[status] ?? "neutral"} label={LABEL[status] ?? status} />
  );
}
