import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AddSchedulerShiftDialog } from "@/components/scheduler/AddSchedulerShiftDialog";
import { SchedulerStatsBar } from "@/components/scheduler/SchedulerStatsBar";
import { SchedulerDayView } from "@/components/scheduler/SchedulerDayView";
import { ShiftCard } from "@/components/scheduler/ShiftCard";
import { Plus, ChevronLeft, ChevronRight, Send, Search, Users, UserCheck } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

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
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [perspective, setPerspective] = useState<"staff" | "participant">("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dateRange = `${format(weekDates[0], "d MMM")} – ${format(weekDates[6], "d MMM yyyy")}`;

  // Queries
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
        .select("*, participants(first_name, last_name), sil_houses(name), ndis_price_list(item_code, rate, unit)")
        .gte("date", from)
        .lte("date", to)
        .order("start_time");
      return (data || []) as any[];
    },
  });

  const { data: participantsList } = useQuery({
    queryKey: ["participants-map"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name").eq("is_active", true) as any;
      return (data || []) as { id: string; first_name: string; last_name: string }[];
    },
  });

  const { data: houseMap } = useQuery({
    queryKey: ["houses-map"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name");
      return Object.fromEntries((data || []).map(h => [h.id, h.name]));
    },
  });

  const participantMap = useMemo(() => {
    if (!participantsList) return {};
    return Object.fromEntries(participantsList.map(p => [p.id, `${p.first_name} ${p.last_name}`]));
  }, [participantsList]);

  const staffMap = useMemo(() => {
    if (!staff) return {};
    return Object.fromEntries(staff.map(s => [s.id, `${s.first_name} ${s.last_name}`]));
  }, [staff]);

  // Filtering
  const filteredShifts = useMemo(() => {
    if (!shifts) return [];
    if (statusFilter === "all") return shifts;
    return shifts.filter(s => s.status === statusFilter);
  }, [shifts, statusFilter]);

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    if (!searchQuery) return staff;
    const q = searchQuery.toLowerCase();
    return staff.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q));
  }, [staff, searchQuery]);

  const filteredParticipants = useMemo(() => {
    if (!participantsList) return [];
    if (!searchQuery) return participantsList;
    const q = searchQuery.toLowerCase();
    return participantsList.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q));
  }, [participantsList, searchQuery]);

  // Grid data
  const shiftGrid = useMemo(() => {
    const groupKey = perspective === "staff" ? "staff_id" : "participant_id";
    const map: Record<string, Record<string, any[]>> = {};
    for (const s of filteredShifts) {
      const key = s[groupKey] || "__unassigned__";
      if (!map[key]) map[key] = {};
      if (!map[key][s.date]) map[key][s.date] = [];
      map[key][s.date].push(s);
    }
    return map;
  }, [filteredShifts, perspective]);

  const rowHours = useMemo(() => {
    const groupKey = perspective === "staff" ? "staff_id" : "participant_id";
    const hours: Record<string, number> = {};
    for (const s of filteredShifts) {
      const key = s[groupKey] || "__unassigned__";
      hours[key] = (hours[key] || 0) + getHoursFromTime(s.start_time, s.end_time);
    }
    return hours;
  }, [filteredShifts, perspective]);

  const rows = perspective === "staff" ? filteredStaff : filteredParticipants;

  const openAdd = (entityId?: string, date?: string) => {
    setEditShift(null);
    setPrefillStaff(perspective === "staff" ? entityId : undefined);
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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const shiftId = result.draggableId;
    // droppableId format: "cell-{entityId}-{date}"
    const parts = result.destination.droppableId.split("-");
    const newDate = parts.pop()!;
    const newEntityId = parts.slice(1).join("-");

    const updatePayload: any = { date: newDate };
    if (perspective === "staff") updatePayload.staff_id = newEntityId;

    const { error } = await supabase.from("scheduler_shifts").update(updatePayload).eq("id", shiftId);
    if (error) {
      toast({ title: "Error moving shift", description: error.message, variant: "destructive" });
    } else {
      qc.invalidateQueries({ queryKey: ["scheduler-shifts"] });
    }
  };

  const initials = (f: string, l: string) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();

  // Day view columns
  const dayViewColumns = useMemo(() => {
    return rows.map(r => ({
      id: r.id,
      label: `${r.first_name} ${r.last_name}`,
      initials: initials(r.first_name, r.last_name),
    }));
  }, [rows]);

  return (
    <div className="space-y-4">
      <PageHeader title="Scheduler" subtitle="Staff scheduling across all services">
        <Button variant="ghost-light" onClick={publishAll}>
          <Send className="h-4 w-4 mr-1" /> Publish Drafts
        </Button>
        <Button variant="accent" onClick={() => openAdd()}>
          <Plus className="h-4 w-4 mr-1" /> Add Shift
        </Button>
      </PageHeader>

      {/* Stats */}
      <SchedulerStatsBar shifts={filteredShifts} />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekStart(w => subWeeks(w, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekStart(w => addWeeks(w, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <span className="text-sm font-medium text-muted-foreground ml-1">{dateRange}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={`Search ${perspective}…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 w-[180px] pl-8 text-sm"
            />
          </div>

          {/* Perspective toggle */}
          <ToggleGroup type="single" value={perspective} onValueChange={v => v && setPerspective(v as any)} size="sm">
            <ToggleGroupItem value="staff" aria-label="By Staff"><Users className="h-3.5 w-3.5 mr-1" />Staff</ToggleGroupItem>
            <ToggleGroupItem value="participant" aria-label="By Participant"><UserCheck className="h-3.5 w-3.5 mr-1" />Participant</ToggleGroupItem>
          </ToggleGroup>

          {/* View toggle */}
          <ToggleGroup type="single" value={viewMode} onValueChange={v => v && setViewMode(v as any)} size="sm">
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
            <ToggleGroupItem value="day">Day</ToggleGroupItem>
          </ToggleGroup>

          {/* Day selector (when in day view) */}
          {viewMode === "day" && (
            <Select value={String(selectedDayIndex)} onValueChange={v => setSelectedDayIndex(Number(v))}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {weekDates.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>{format(d, "EEE d MMM")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
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
      </div>

      {/* Day View */}
      {viewMode === "day" && (
        <SchedulerDayView
          date={weekDates[selectedDayIndex]}
          shifts={filteredShifts}
          columns={dayViewColumns}
          participantMap={participantMap}
          houseMap={houseMap || {}}
          staffMap={staffMap}
          perspective={perspective}
          onShiftClick={openEdit}
          onCellClick={(entityId, date) => openAdd(entityId, date)}
        />
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
            {/* Header row */}
            <div className="grid grid-cols-[220px_repeat(7,1fr)] border-b bg-muted/40">
              <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r">
                {perspective === "staff" ? "Staff" : "Participant"}
              </div>
              {weekDates.map(d => (
                <div key={d.toISOString()} className={cn("p-3 text-center border-r last:border-r-0", isToday(d) && "bg-primary/5")}>
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold">{format(d, "EEE")}</div>
                  <div className={cn("text-sm font-bold", isToday(d) ? "text-primary" : "text-foreground")}>{format(d, "d MMM")}</div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {(!rows || rows.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "No results found." : `No active ${perspective === "staff" ? "staff" : "participants"} found.`}
              </div>
            )}
            {rows.map(r => {
              const totalH = rowHours[r.id] || 0;
              return (
                <div key={r.id} className="grid grid-cols-[220px_repeat(7,1fr)] border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                  {/* Entity cell */}
                  <div className="p-3 flex items-start gap-2 border-r">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {initials(r.first_name, r.last_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.first_name} {r.last_name}</div>
                      <div className="text-[11px] text-muted-foreground">{totalH.toFixed(1)}h this week</div>
                    </div>
                  </div>

                  {/* Day cells */}
                  {weekDates.map(d => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    const cellShifts = shiftGrid[r.id]?.[dateStr] || [];
                    const droppableId = `cell-${r.id}-${dateStr}`;

                    return (
                      <Droppable droppableId={droppableId} key={droppableId}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "p-1.5 border-r last:border-r-0 min-h-[72px] cursor-pointer transition-colors",
                              isToday(d) && "bg-primary/[0.03]",
                              snapshot.isDraggingOver && "bg-accent/10"
                            )}
                            onClick={() => openAdd(r.id, dateStr)}
                          >
                            {cellShifts.map((shift: any, idx: number) => {
                              const label = shift.participant_id && participantMap[shift.participant_id]
                                ? participantMap[shift.participant_id]
                                : shift.sil_house_id && houseMap?.[shift.sil_house_id]
                                  ? houseMap[shift.sil_house_id] : "";
                              const sLabel = perspective === "participant" && shift.staff_id && staffMap[shift.staff_id]
                                ? staffMap[shift.staff_id] : undefined;

                              return (
                                <Draggable key={shift.id} draggableId={shift.id} index={idx}>
                                  {(dragProvided) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                    >
                                      <ShiftCard
                                        shift={shift}
                                        label={label}
                                        staffLabel={sLabel}
                                        onClick={e => { e.stopPropagation(); openEdit(shift); }}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

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
