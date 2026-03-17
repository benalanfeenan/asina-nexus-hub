import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, ArrowRightLeft, Moon, Settings2, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { AddShiftDialog } from "@/components/rostering/AddShiftDialog";
import { ShiftHandoverDialog } from "@/components/rostering/ShiftHandoverDialog";
import { SleepoverLogDialog } from "@/components/rostering/SleepoverLogDialog";
import { RosterPatternsDialog } from "@/components/rostering/RosterPatternsDialog";

const SHIFT_TYPES = ["morning", "afternoon", "night", "sleepover", "active_night"] as const;
const SHIFT_LABELS: Record<string, string> = { morning: "AM", afternoon: "PM", night: "Night", sleepover: "Sleepover", active_night: "Active Night" };
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string { return d.toISOString().split("T")[0]; }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

export default function Rostering() {
  const { role } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const canEdit = role === "admin" || role === "house_manager";
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedHouse, setSelectedHouse] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [prefillDate, setPrefillDate] = useState("");
  const [prefillType, setPrefillType] = useState<string>("");
  const [showHandover, setShowHandover] = useState(false);
  const [showSleepover, setShowSleepover] = useState(false);
  const [showPatterns, setShowPatterns] = useState(false);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = addDays(weekStart, 6);

  const { data: houses = [] } = useQuery({
    queryKey: ["sil-houses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", selectedHouse, formatDate(weekStart)],
    queryFn: async () => {
      if (!selectedHouse) return [];
      const { data } = await supabase.from("shifts").select("*, staff(profiles(full_name))").eq("sil_house_id", selectedHouse).gte("date", formatDate(weekStart)).lte("date", formatDate(weekEnd));
      return data || [];
    },
    enabled: !!selectedHouse,
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ["public-holidays-week", formatDate(weekStart)],
    queryFn: async () => {
      const { data } = await supabase.from("public_holidays").select("date").gte("date", formatDate(weekStart)).lte("date", formatDate(weekEnd));
      return data?.map((h) => h.date) || [];
    },
  });

  const holidaySet = useMemo(() => new Set(holidays), [holidays]);

  const shiftMap = useMemo(() => {
    const map: Record<string, typeof shifts> = {};
    shifts.forEach((s) => { const key = `${s.date}_${s.shift_type}`; if (!map[key]) map[key] = []; map[key].push(s); });
    return map;
  }, [shifts]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted text-muted-foreground", published: "bg-blue-500/15 text-blue-700",
      confirmed: "bg-emerald-500/15 text-emerald-700", completed: "bg-primary/15 text-primary", cancelled: "bg-destructive/15 text-destructive",
    };
    return <Badge variant="outline" className={colors[status] || ""}>{status}</Badge>;
  };

  const handleCellClick = (date: string, shiftType: string) => {
    if (!canEdit) return;
    setPrefillDate(date); setPrefillType(shiftType); setShowAdd(true);
  };

  const generateWeekMutation = useMutation({
    mutationFn: async () => {
      const { data: patterns } = await supabase.from("recurring_roster_patterns").select("*").eq("sil_house_id", selectedHouse).eq("is_active", true);
      if (!patterns || patterns.length === 0) throw new Error("No active patterns for this house");

      const existingKeys = new Set(shifts.map((s) => `${s.date}_${s.shift_type}`));
      const toInsert: any[] = [];

      patterns.forEach((p) => {
        // day_of_week: 0=Mon, 1=Tue... in our patterns
        const targetDate = addDays(weekStart, p.day_of_week);
        const dateStr = formatDate(targetDate);
        const key = `${dateStr}_${p.shift_type}`;
        if (!existingKeys.has(key)) {
          toInsert.push({
            sil_house_id: selectedHouse, date: dateStr, shift_type: p.shift_type,
            staff_id: p.staff_id || null, start_time: p.start_time || null, end_time: p.end_time || null, status: "draft",
          });
          existingKeys.add(key);
        }
      });

      if (toInsert.length === 0) throw new Error("All shifts already exist for this week");
      const { error } = await supabase.from("shifts").insert(toInsert);
      if (error) throw error;
      return toInsert.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: `Generated ${count} shifts from patterns` });
    },
    onError: (e: Error) => toast({ title: "Info", description: e.message }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rostering"
        action={canEdit && selectedHouse ? (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={() => setShowHandover(true)}><ArrowRightLeft className="mr-1 h-4 w-4" />Handovers</Button>
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={() => setShowSleepover(true)}><Moon className="mr-1 h-4 w-4" />Sleepover Logs</Button>
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={() => setShowPatterns(true)}><Settings2 className="mr-1 h-4 w-4" />Patterns</Button>
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={() => generateWeekMutation.mutate()} disabled={generateWeekMutation.isPending}>
              <Wand2 className="mr-1 h-4 w-4" />{generateWeekMutation.isPending ? "Generating…" : "Generate Week"}
            </Button>
            <Button variant="accent" onClick={() => { setPrefillDate(""); setPrefillType(""); setShowAdd(true); }}><Plus className="mr-1 h-4 w-4" />Add Shift</Button>
          </div>
        ) : undefined}
      />

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedHouse} onValueChange={setSelectedHouse}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select SIL House" /></SelectTrigger>
          <SelectContent>{houses.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(getWeekStart(new Date()))}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground ml-2">
            {weekStart.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – {weekEnd.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {!selectedHouse ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Select a SIL house to view the roster.</CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-border bg-muted p-2 text-left w-[120px]">Shift</th>
                {weekDates.map((d, i) => (
                  <th key={i} className={`border border-border bg-muted p-2 text-center min-w-[120px] ${holidaySet.has(formatDate(d)) ? "bg-destructive/10" : ""}`}>
                    <div className="font-medium">{DAY_NAMES[i]}</div>
                    <div className="text-xs text-muted-foreground">{d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</div>
                    {holidaySet.has(formatDate(d)) && <Badge variant="destructive" className="text-[10px] mt-1">Holiday</Badge>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIFT_TYPES.map((type) => (
                <tr key={type}>
                  <td className="border border-border bg-muted/50 p-2 font-medium">{SHIFT_LABELS[type]}</td>
                  {weekDates.map((d, i) => {
                    const dateStr = formatDate(d);
                    const key = `${dateStr}_${type}`;
                    const cellShifts = shiftMap[key] || [];
                    return (
                      <td key={i} className={`border border-border p-2 align-top min-h-[60px] ${canEdit ? "cursor-pointer hover:bg-accent/50" : ""} ${holidaySet.has(dateStr) ? "bg-destructive/5" : ""}`} onClick={() => handleCellClick(dateStr, type)}>
                        {cellShifts.length === 0 ? <span className="text-xs text-muted-foreground">—</span> : cellShifts.map((s) => (
                          <div key={s.id} className="mb-1 text-xs">
                            <div className="font-medium">{(s.staff as any)?.profiles?.full_name || "Unassigned"}</div>
                            {s.start_time && s.end_time && <div className="text-muted-foreground">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</div>}
                            {statusBadge(s.status)}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedHouse && (
        <>
          <AddShiftDialog open={showAdd} onOpenChange={setShowAdd} houseId={selectedHouse} prefillDate={prefillDate} prefillType={prefillType} />
          <ShiftHandoverDialog open={showHandover} onOpenChange={setShowHandover} houseId={selectedHouse} />
          <SleepoverLogDialog open={showSleepover} onOpenChange={setShowSleepover} houseId={selectedHouse} />
          <RosterPatternsDialog open={showPatterns} onOpenChange={setShowPatterns} houseId={selectedHouse} />
        </>
      )}
    </div>
  );
}
