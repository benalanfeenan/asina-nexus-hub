import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, DollarSign, FileText } from "lucide-react";

function getHoursFromTime(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

interface Props {
  shifts: any[];
}

export function SchedulerStatsBar({ shifts }: Props) {
  const stats = useMemo(() => {
    let totalHours = 0;
    let totalCost = 0;
    let draft = 0, published = 0, confirmed = 0;

    for (const s of shifts) {
      totalHours += getHoursFromTime(s.start_time, s.end_time);
      if (s.ndis_price_list?.rate) {
        const rate = Number(s.ndis_price_list.rate);
        const unit = s.ndis_price_list.unit;
        totalCost += (unit === "hour" || unit === "H")
          ? rate * getHoursFromTime(s.start_time, s.end_time)
          : rate;
      }
      if (s.status === "draft") draft++;
      else if (s.status === "published") published++;
      else if (s.status === "confirmed") confirmed++;
    }

    return { total: shifts.length, totalHours, totalCost, draft, published, confirmed };
  }, [shifts]);

  const items = [
    { icon: CalendarDays, label: "Shifts", value: stats.total.toString() },
    { icon: Clock, label: "Hours", value: stats.totalHours.toFixed(1) },
    { icon: DollarSign, label: "Est. Cost", value: `$${stats.totalCost.toFixed(0)}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(it => (
        <Card key={it.label} className="p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <it.icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">{it.value}</div>
            <div className="text-[11px] text-muted-foreground">{it.label}</div>
          </div>
        </Card>
      ))}
      <Card className="p-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-wrap gap-1">
          {stats.draft > 0 && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{stats.draft} Draft</Badge>}
          {stats.published > 0 && <Badge className="text-[10px] px-1.5 h-5">{stats.published} Published</Badge>}
          {stats.confirmed > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{stats.confirmed} Confirmed</Badge>}
          {stats.draft === 0 && stats.published === 0 && stats.confirmed === 0 && (
            <span className="text-[11px] text-muted-foreground">No shifts</span>
          )}
        </div>
      </Card>
    </div>
  );
}
