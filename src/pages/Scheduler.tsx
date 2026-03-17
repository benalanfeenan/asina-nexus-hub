import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AddSchedulerShiftDialog } from "@/components/scheduler/AddSchedulerShiftDialog";
import { Plus, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SERVICE_COLORS: Record<string, string> = {
  SIL: "bg-violet-500/15 text-violet-700 border-violet-300",
  "Personal Care": "bg-blue-500/15 text-blue-700 border-blue-300",
  "Community Access": "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  Respite: "bg-amber-500/15 text-amber-700 border-amber-300",
  Transport: "bg-cyan-500/15 text-cyan-700 border-cyan-300",
  "Domestic Assistance": "bg-pink-500/15 text-pink-700 border-pink-300",
  "Social & Community": "bg-lime-500/15 text-lime-700 border-lime-300",
  Other: "bg-gray-500/15 text-gray-700 border-gray-300",
};

interface SchedulerShift {
  id: string;
  staff_id: string;
  participant_id: string | null;
  sil_house_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  service_type: string;
  status: string;
  notes: string | null;
}

function getHoursFromTime(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

export default function Scheduler() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editShift, setEditShift] = useState<SchedulerShift | null>(null);
  const [prefillStaff, setPrefillStaff] = useState<string | undefined>();
  const [prefillDate, setPrefillDate] = useState<string | undefined>();

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dateRange = `${format(weekDates[0], "d MMM")} – ${format(weekDates[6], "d MMM yyyy")}`;

  const { data: staff } = useQuery({
    queryKey: ["scheduler-staff"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, first_name, last_name").eq("status", "active").order("first_name");
      return data || [];
    },
  });

  const { data: shifts } = useQuery({
    queryKey: ["scheduler-shifts", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const from = format(weekDates[0], "yyyy-MM-dd");
      const to = format(weekDates[6], "yyyy-MM-dd");
      const { data } = await supabase
        .from("scheduler_shifts")
        .select("*, participants(first_name, last_name), sil_houses(name)")
        .gte("date", from)
        .lte("date", to)
        .order("start_time");
      return (data || []) as any[];
    },
  });

  const { data: participantMap } = useQuery({
    queryKey: ["participants-map"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name");
      return Object.fromEntries((data || []).map(p => [p.id, `${p.first_name} ${p.last_name}`]));
    },
  });

  const { data: houseMap } = useQuery({
    queryKey: ["houses-map"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name");
      return Object.fromEntries((data || []).map(h => [h.id, h.name]));
    },
  });

  const filteredShifts = useMemo(() => {
    if (!shifts) return [];
    if (statusFilter === "all") return shifts;
    return shifts.filter(s => s.status === statusFilter);
  }, [shifts, statusFilter]);

  // Group shifts by staff_id -> date
  const shiftGrid = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    for (const s of filteredShifts) {
      if (!map[s.staff_id]) map[s.staff_id] = {};
      const key = s.date;
      if (!map[s.staff_id][key]) map[s.staff_id][key] = [];
      map[s.staff_id][key].push(s);
    }
    return map;
  }, [filteredShifts]);

  const staffHours = useMemo(() => {
    const hours: Record<string, number> = {};
    for (const s of filteredShifts) {
      hours[s.staff_id] = (hours[s.staff_id] || 0) + getHoursFromTime(s.start_time, s.end_time);
    }
    return hours;
  }, [filteredShifts]);

  const openAdd = (staffId?: string, date?: string) => {
    setEditShift(null);
    setPrefillStaff(staffId);
    setPrefillDate(date);
    setDialogOpen(true);
  };

  const openEdit = (shift: SchedulerShift) => {
    setEditShift(shift);
    setDialogOpen(true);
  };

  const publishAll = async () => {
    const draftIds = filteredShifts.filter(s => s.status === "draft").map(s => s.id);
    if (draftIds.length === 0) {
      toast({ title: "No draft shifts to publish" });
      return;
    }
    const { error } = await supabase.from("scheduler_shifts").update({ status: "published" }).in("id", draftIds);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${draftIds.length} shifts published` });
      qc.invalidateQueries({ queryKey: ["scheduler-shifts"] });
    }
  };

  const initials = (f: string, l: string) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader title="Scheduler" subtitle="Staff scheduling across all services">
        <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" onClick={publishAll}>
          <Send className="h-4 w-4 mr-1" /> Publish Drafts
        </Button>
        <Button className="bg-white text-primary hover:bg-white/90" onClick={() => openAdd()}>
          <Plus className="h-4 w-4 mr-1" /> Add Shift
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekStart(w => subWeeks(w, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekStart(w => addWeeks(w, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <span className="text-sm font-medium text-muted-foreground ml-1">{dateRange}</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        {/* Header row */}
        <div className="grid grid-cols-[220px_repeat(7,1fr)] border-b bg-muted/40">
          <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r">Staff</div>
          {weekDates.map(d => (
            <div key={d.toISOString()} className={cn("p-3 text-center border-r last:border-r-0", isToday(d) && "bg-primary/5")}>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold">{format(d, "EEE")}</div>
              <div className={cn("text-sm font-bold", isToday(d) ? "text-primary" : "text-foreground")}>{format(d, "d MMM")}</div>
            </div>
          ))}
        </div>

        {/* Staff rows */}
        {(!staff || staff.length === 0) && (
          <div className="p-8 text-center text-muted-foreground">No active staff found.</div>
        )}
        {staff?.map(s => {
          const totalH = staffHours[s.id] || 0;
          return (
            <div key={s.id} className="grid grid-cols-[220px_repeat(7,1fr)] border-b last:border-b-0 hover:bg-muted/20 transition-colors">
              {/* Staff cell */}
              <div className="p-3 flex items-start gap-2 border-r">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {initials(s.first_name, s.last_name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.first_name} {s.last_name}</div>
                  <div className="text-[11px] text-muted-foreground">{totalH.toFixed(1)}h this week</div>
                </div>
              </div>

              {/* Day cells */}
              {weekDates.map(d => {
                const dateStr = format(d, "yyyy-MM-dd");
                const cellShifts = shiftGrid[s.id]?.[dateStr] || [];
                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "p-1.5 border-r last:border-r-0 min-h-[72px] cursor-pointer hover:bg-accent/5 transition-colors",
                      isToday(d) && "bg-primary/[0.03]"
                    )}
                    onClick={() => openAdd(s.id, dateStr)}
                  >
                    {cellShifts.map((shift: any) => {
                      const colorCls = SERVICE_COLORS[shift.service_type] || SERVICE_COLORS.Other;
                      const label = shift.participant_id && participantMap?.[shift.participant_id]
                        ? participantMap[shift.participant_id]
                        : shift.sil_house_id && houseMap?.[shift.sil_house_id]
                          ? houseMap[shift.sil_house_id]
                          : "";
                      return (
                        <div
                          key={shift.id}
                          className={cn("rounded-md border px-2 py-1 mb-1 text-[11px] leading-tight cursor-pointer hover:shadow-sm transition-shadow", colorCls, shift.status === "draft" && "opacity-70 border-dashed")}
                          onClick={e => { e.stopPropagation(); openEdit(shift); }}
                        >
                          <div className="font-semibold">{shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}</div>
                          <div className="truncate">{shift.service_type}</div>
                          {label && <div className="truncate text-[10px] opacity-80">{label}</div>}
                          {shift.status === "draft" && <Badge variant="outline" className="mt-0.5 text-[9px] px-1 py-0 h-4">Draft</Badge>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <AddSchedulerShiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => qc.invalidateQueries({ queryKey: ["scheduler-shifts"] })}
        defaultStaffId={prefillStaff}
        defaultDate={prefillDate}
        editShift={editShift}
      />
    </div>
  );
}
