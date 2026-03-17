import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AddShiftDialog } from "@/components/rostering/AddShiftDialog";

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

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function Rostering() {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedHouse, setSelectedHouse] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [prefillDate, setPrefillDate] = useState("");
  const [prefillType, setPrefillType] = useState<string>("");

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
      const { data } = await supabase
        .from("shifts")
        .select("*, staff(profiles(full_name))")
        .eq("sil_house_id", selectedHouse)
        .gte("date", formatDate(weekStart))
        .lte("date", formatDate(weekEnd));
      return data || [];
    },
    enabled: !!selectedHouse,
  });

  const shiftMap = useMemo(() => {
    const map: Record<string, typeof shifts> = {};
    shifts.forEach((s) => {
      const key = `${s.date}_${s.shift_type}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [shifts]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      published: "bg-blue-500/15 text-blue-700",
      confirmed: "bg-emerald-500/15 text-emerald-700",
      completed: "bg-primary/15 text-primary",
      cancelled: "bg-destructive/15 text-destructive",
    };
    return <Badge variant="outline" className={colors[status] || ""}>{status}</Badge>;
  };

  const handleCellClick = (date: string, shiftType: string) => {
    if (!canEdit) return;
    setPrefillDate(date);
    setPrefillType(shiftType);
    setShowAdd(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Rostering</h1>
        {canEdit && selectedHouse && (
          <Button onClick={() => { setPrefillDate(""); setPrefillType(""); setShowAdd(true); }}>
            <Plus className="mr-1 h-4 w-4" />Add Shift
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedHouse} onValueChange={setSelectedHouse}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select SIL House" /></SelectTrigger>
          <SelectContent>
            {houses.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
          </SelectContent>
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
                  <th key={i} className="border border-border bg-muted p-2 text-center min-w-[120px]">
                    <div className="font-medium">{DAY_NAMES[i]}</div>
                    <div className="text-xs text-muted-foreground">{d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</div>
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
                      <td
                        key={i}
                        className={`border border-border p-2 align-top min-h-[60px] ${canEdit ? "cursor-pointer hover:bg-accent/50" : ""}`}
                        onClick={() => handleCellClick(dateStr, type)}
                      >
                        {cellShifts.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          cellShifts.map((s) => (
                            <div key={s.id} className="mb-1 text-xs">
                              <div className="font-medium">{(s.staff as any)?.profiles?.full_name || "Unassigned"}</div>
                              {s.start_time && s.end_time && (
                                <div className="text-muted-foreground">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</div>
                              )}
                              {statusBadge(s.status)}
                            </div>
                          ))
                        )}
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
        <AddShiftDialog
          open={showAdd}
          onOpenChange={setShowAdd}
          houseId={selectedHouse}
          prefillDate={prefillDate}
          prefillType={prefillType}
        />
      )}
    </div>
  );
}
