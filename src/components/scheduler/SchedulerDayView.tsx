import { useMemo } from "react";
import { ShiftCard } from "./ShiftCard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

interface Props {
  date: Date;
  shifts: any[];
  columns: { id: string; label: string; initials: string }[];
  participantMap: Record<string, string>;
  houseMap: Record<string, string>;
  staffMap: Record<string, string>;
  perspective: "staff" | "participant";
  onShiftClick: (shift: any) => void;
  onCellClick: (entityId: string, date: string) => void;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function SchedulerDayView({ date, shifts, columns, participantMap, houseMap, staffMap, perspective, onShiftClick, onCellClick }: Props) {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayShifts = useMemo(() => shifts.filter(s => s.date === dateStr), [shifts, dateStr]);

  const groupKey = perspective === "staff" ? "staff_id" : "participant_id";
  const shiftsByCol = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of dayShifts) {
      const key = s[groupKey] || "__unassigned__";
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [dayShifts, groupKey]);

  const startMinute = HOURS[0] * 60; // 360
  const totalMinutes = HOURS.length * 60; // 1020

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Header */}
      <div className="flex border-b bg-muted/40">
        <div className="w-16 shrink-0 p-2 text-[10px] font-semibold text-muted-foreground uppercase border-r">Time</div>
        {columns.map(col => (
          <div key={col.id} className="flex-1 min-w-[120px] p-2 text-center border-r last:border-r-0">
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mx-auto mb-0.5">
              {col.initials}
            </div>
            <div className="text-xs font-medium truncate">{col.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline grid */}
      <div className="flex relative" style={{ minHeight: `${HOURS.length * 48}px` }}>
        {/* Time labels */}
        <div className="w-16 shrink-0 border-r">
          {HOURS.map(h => (
            <div key={h} className="h-12 border-b last:border-b-0 flex items-start justify-end pr-2 pt-0.5">
              <span className="text-[10px] text-muted-foreground">{h.toString().padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* Columns */}
        {columns.map(col => (
          <div
            key={col.id}
            className="flex-1 min-w-[120px] border-r last:border-r-0 relative cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => onCellClick(col.id, dateStr)}
          >
            {/* Hour lines */}
            {HOURS.map(h => (
              <div key={h} className="h-12 border-b last:border-b-0" />
            ))}

            {/* Shift blocks */}
            {(shiftsByCol[col.id] || []).map((shift: any) => {
              const sMin = timeToMinutes(shift.start_time) - startMinute;
              const eMin = timeToMinutes(shift.end_time) - startMinute;
              const top = Math.max(0, (sMin / totalMinutes) * 100);
              const height = Math.max(2, ((eMin - sMin) / totalMinutes) * 100);
              const label = shift.participant_id && participantMap[shift.participant_id]
                ? participantMap[shift.participant_id]
                : shift.sil_house_id && houseMap[shift.sil_house_id]
                  ? houseMap[shift.sil_house_id] : "";
              const sLabel = perspective === "participant" && shift.staff_id && staffMap[shift.staff_id]
                ? staffMap[shift.staff_id] : undefined;

              return (
                <div
                  key={shift.id}
                  className="absolute left-1 right-1 z-10"
                  style={{ top: `${top}%`, height: `${height}%`, minHeight: "24px" }}
                >
                  <ShiftCard
                    shift={shift}
                    label={label}
                    staffLabel={sLabel}
                    onClick={e => { e.stopPropagation(); onShiftClick(shift); }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
