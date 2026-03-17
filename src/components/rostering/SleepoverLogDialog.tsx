import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
  shiftId?: string;
}

export function SleepoverLogDialog({ open, onOpenChange, houseId, shiftId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activeMinutes, setActiveMinutes] = useState("");
  const [reason, setReason] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: participants = [] } = useQuery({
    queryKey: ["house-participants", houseId],
    queryFn: async () => {
      const { data } = await supabase.from("sil_house_participants").select("participant_id, participants(id, first_name, last_name)").eq("sil_house_id", houseId).eq("is_current", true);
      return data || [];
    },
    enabled: open,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["sleepover-logs", houseId],
    queryFn: async () => {
      const { data } = await supabase.from("sleepover_logs").select("*, participants(first_name, last_name)").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sleepover_logs").insert({
        staff_id: user!.id,
        shift_id: shiftId || null,
        start_time: startTime,
        end_time: endTime || null,
        active_minutes: activeMinutes ? parseInt(activeMinutes) : 0,
        reason: reason || null,
        participant_id: participantId || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sleepover-logs"] });
      toast({ title: "Sleepover log saved" });
      setStartTime(""); setEndTime(""); setActiveMinutes(""); setReason(""); setParticipantId(""); setNotes("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Sleepover Logs</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Log New Entry</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Time *</Label><Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
            <div><Label>End Time</Label><Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Active Minutes</Label><Input type="number" value={activeMinutes} onChange={(e) => setActiveMinutes(e.target.value)} placeholder="0" /></div>
            <div>
              <Label>Participant</Label>
              <Select value={participantId} onValueChange={setParticipantId}>
                <SelectTrigger><SelectValue placeholder="Select (optional)" /></SelectTrigger>
                <SelectContent>
                  {participants.map((p: any) => <SelectItem key={p.participant_id} value={p.participant_id}>{(p.participants as any)?.first_name} {(p.participants as any)?.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Reason for Waking</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Participant required assistance" /></div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button onClick={() => mutation.mutate()} disabled={!startTime || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Log"}
          </Button>

          <hr className="border-border" />
          <h4 className="font-medium text-sm">Recent Logs</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Active Min</TableHead><TableHead>Participant</TableHead><TableHead>Reason</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No logs</TableCell></TableRow>
                ) : logs.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{new Date(l.start_time).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                    <TableCell>{l.active_minutes || 0}</TableCell>
                    <TableCell>{(l.participants as any)?.first_name ? `${(l.participants as any).first_name} ${(l.participants as any).last_name}` : "—"}</TableCell>
                    <TableCell className="text-sm">{l.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
