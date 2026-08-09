import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CircleCheck, TriangleAlert, CircleAlert, CircleX, Pencil } from "lucide-react";

export type DataQuality = "regional" | "state_proxy" | "national_proxy" | "estimate" | "none";

const CONFIG: Record<DataQuality, { label: string; icon: typeof CircleCheck; className: string }> = {
  regional: {
    label: "Regional data",
    icon: CircleCheck,
    className: "bg-[hsl(var(--chart-1))]/15 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/30",
  },
  state_proxy: {
    label: "State proxy",
    icon: TriangleAlert,
    className: "bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30",
  },
  national_proxy: {
    label: "National proxy",
    icon: CircleAlert,
    className: "bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/30",
  },
  estimate: {
    label: "Owner estimate — placeholder",
    icon: Pencil,
    className: "bg-[hsl(var(--chart-5))]/15 text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5))]/30",
  },
  none: {
    label: "No data — survey needed",
    icon: CircleX,
    className: "bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/30",
  },
};

export function DataQualityBadge({ quality, className }: { quality: string; className?: string }) {
  const config = CONFIG[quality as DataQuality] ?? CONFIG.none;
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", config.className, className)}
      data-testid={`badge-data-quality-${quality}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
