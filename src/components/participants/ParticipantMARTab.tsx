import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TIME_SLOTS = ["morning", "afternoon", "evening", "night"] as const;
const SLOT_LABELS: Record<string, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" };
const STATUS_COLORS: Record<string, string> = {
  administered: "bg-emerald-500/20 text-emerald-700 border-emerald-300",
  missed: "bg-destructive/20 text-destructive border-destructive/30",
  refused: "bg-amber-500/20 text-amber-700 border-amber-300",
  pending: "bg-muted text-muted-foreground border-border",
};

export function ParticipantMARTab({ participantId }: { participantId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showRecord, setShowRecord] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [status, setStatus] = useState("administered");
  const [notes, setNotes] = useState("");

  const { data: medications = [] } = useQuery({
    queryKey: ["participant-medications-active", participantId],
    queryFn: async () => {
      const { data } = await supabase.from("medications").select("*").eq("participant_id", participantId).eq("is_active", true).eq("is_prn", false).order("name");
      return data || [];
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ["mar-records", participantId, date],
    queryFn: async () => {
      const medIds = medications.map((m) => m.id);
      if (medIds.length === 0) return [];
      const { data } = await supabase.from("mar_records").select("*").in("medication_id", medIds).eq("date", date);
      return data || [];
    },
    enabled: medications.length > 0,
  });

  const recordMap = useMemo(() => {
    const map: Record<string, any> = {};
    records.forEach((r) => { map[`${r.medication_id}_${r.time_slot}`] = r; });
    return map;
  }, [records]);

  const openRecord = (med: any, slot: string) => {
    const existing = recordMap[`${med.id}_${slot}`];
    setSelectedMed(med);
    setSelectedSlot(slot);
    setStatus(existing?.status || "administered");
    setNotes(existing?.notes || "");
    setShowRecord(true);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const existing = recordMap[`${selectedMed.id}_${selectedSlot}`];
      if (existing) {
        const { error } = await supabase.from("mar_records").update({ status, notes: notes || null, administered_by: user?.id }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mar_records").insert({ medication_id: selectedMed.id, date, time_slot: selectedSlot, status, notes: notes || null, administered_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mar-records"] });
      toast({ title: "Record saved" });
      setShowRecord(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Medication Administration Record</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
            <Button variant="outline" size="icon" onClick={() => changeDate(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {medications.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active scheduled medications.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-border bg-muted p-2 text-left">Medication</th>
                  <th className="border border-border bg-muted p-2 text-left">Dose</th>
                  {TIME_SLOTS.map((s) => <th key={s} className="border border-border bg-muted p-2 text-center min-w-[100px]">{SLOT_LABELS[s]}</th>)}
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => (
                  <tr key={med.id}>
                    <td className="border border-border p-2 font-medium">{med.name}</td>
                    <td className="border border-border p-2 text-muted-foreground">{med.dose || "—"}</td>
                    {TIME_SLOTS.map((slot) => {
                      const record = recordMap[`${med.id}_${slot}`];
                      const cellStatus = record?.status || "pending";
                      return (
                        <td key={slot} className={`border border-border p-2 text-center cursor-pointer hover:opacity-80 ${STATUS_COLORS[cellStatus]}`} onClick={() => openRecord(med, slot)}>
                          <span className="text-xs font-medium capitalize">{cellStatus}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3 mt-4 text-xs">
          <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-300" variant="outline">Administered</Badge>
          <Badge className="bg-destructive/20 text-destructive border-destructive/30" variant="outline">Missed</Badge>
          <Badge className="bg-amber-500/20 text-amber-700 border-amber-300" variant="outline">Refused</Badge>
          <Badge variant="outline">Pending</Badge>
        </div>

        <Dialog open={showRecord} onOpenChange={setShowRecord}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Administration — {selectedMed?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Time Slot</Label><p className="text-sm font-medium capitalize">{SLOT_LABELS[selectedSlot] || selectedSlot}</p></div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administered">Administered</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRecord(false)}>Cancel</Button>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
