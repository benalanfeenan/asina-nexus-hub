import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const SERVICE_COLORS: Record<string, string> = {
  SIL: "bg-violet-500/15 text-violet-700 border-violet-300 dark:text-violet-300",
  "Personal Care": "bg-blue-500/15 text-blue-700 border-blue-300 dark:text-blue-300",
  "Community Access": "bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-300",
  Respite: "bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-300",
  Transport: "bg-cyan-500/15 text-cyan-700 border-cyan-300 dark:text-cyan-300",
  "Domestic Assistance": "bg-pink-500/15 text-pink-700 border-pink-300 dark:text-pink-300",
  "Social & Community": "bg-lime-500/15 text-lime-700 border-lime-300 dark:text-lime-300",
  Other: "bg-gray-500/15 text-gray-700 border-gray-300 dark:text-gray-300",
};

const COMPLETED_COLOR = "bg-blue-500/20 text-blue-800 border-blue-400 dark:text-blue-300 dark:border-blue-500";

export { SERVICE_COLORS };

interface ShiftCardProps {
  shift: any;
  label: string;
  staffLabel?: string;
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function ShiftCard({ shift, label, staffLabel, compact, onClick }: ShiftCardProps) {
  const isCompleted = shift.status === "completed";
  const colorCls = isCompleted ? COMPLETED_COLOR : (SERVICE_COLORS[shift.service_type] || SERVICE_COLORS.Other);

  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1 mb-1 text-[11px] leading-tight cursor-pointer hover:shadow-sm transition-shadow select-none",
        colorCls,
        shift.status === "draft" && "opacity-70 border-dashed"
      )}
      onClick={onClick}
    >
      <div className="font-semibold flex items-center gap-1">
        {isCompleted && <Check className="h-3 w-3 shrink-0" />}
        {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
      </div>
      {!compact && <div className="truncate">{shift.service_type}</div>}
      {shift.ndis_price_list?.item_code && (
        <div className="truncate text-[10px] opacity-70 font-mono">{shift.ndis_price_list.item_code}</div>
      )}
      {staffLabel && <div className="truncate text-[10px] opacity-80 font-medium">{staffLabel}</div>}
      {label && <div className="truncate text-[10px] opacity-80">{label}</div>}
      {shift.status === "draft" && (
        <Badge variant="outline" className="mt-0.5 text-[9px] px-1 py-0 h-4">Draft</Badge>
      )}
      {isCompleted && (
        <Badge variant="outline" className="mt-0.5 text-[9px] px-1 py-0 h-4 border-blue-400 text-blue-700 dark:text-blue-300">Completed</Badge>
      )}
    </div>
  );
}
