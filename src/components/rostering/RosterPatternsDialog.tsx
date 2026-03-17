import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHIFT_TYPES = ["morning", "afternoon", "night", "sleepover", "active_night"] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
}

export function RosterPatternsDialog({ open, onOpenChange, houseId }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [shiftType, setShiftType] = useState("morning");
  const [staffId, setStaffId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const { data: patterns = [] } = useQuery({
    queryKey: ["roster-patterns", houseId],
    queryFn: async () => {
      const { data } = await supabase.from("recurring_roster_patterns").select("*, staff(profiles(full_name))").eq("sil_house_id", houseId).order("day_of_week").order("shift_type");
      return data || [];
    },
    enabled: open && !!houseId,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list-patterns"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, profiles(full_name)").eq("is_active", true);
      return data || [];
    },
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("recurring_roster_patterns").insert({
        sil_house_id: houseId,
        day_of_week: parseInt(dayOfWeek),
        shift_type: shiftType as any,
        staff_id: staffId || null,
        start_time: startTime || null,
        end_time: endTime || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster-patterns"] });
      toast({ title: "Pattern added" });
      setShowAdd(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_roster_patterns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roster-patterns"] }); toast({ title: "Pattern deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Recurring Roster Patterns</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Pattern</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Day</TableHead><TableHead>Type</TableHead><TableHead>Staff</TableHead><TableHead>Time</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {patterns.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No patterns defined</TableCell></TableRow>
                ) : patterns.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{DAY_NAMES[p.day_of_week]}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{p.shift_type}</Badge></TableCell>
                    <TableCell>{(p.staff as any)?.profiles?.full_name || "Unassigned"}</TableCell>
                    <TableCell className="text-sm">{p.start_time && p.end_time ? `${p.start_time.slice(0,5)}–${p.end_time.slice(0,5)}` : "—"}</TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {showAdd && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Day of Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shift Type</Label>
                  <Select value={shiftType} onValueChange={setShiftType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SHIFT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Staff</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger><SelectValue placeholder="Select (optional)" /></SelectTrigger>
                  <SelectContent>{staffList.map((s: any) => <SelectItem key={s.id} value={s.id}>{(s.profiles as any)?.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Time</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
                <div><Label>End Time</Label><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>{addMutation.isPending ? "Adding…" : "Add"}</Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
