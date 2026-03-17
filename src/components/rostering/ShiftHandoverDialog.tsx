import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
  shiftId?: string;
  staffId?: string;
}

export function ShiftHandoverDialog({ open, onOpenChange, houseId, shiftId, staffId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [participantUpdates, setParticipantUpdates] = useState("");
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [outstandingTasks, setOutstandingTasks] = useState("");
  const [concerns, setConcerns] = useState("");

  const { data: handovers = [] } = useQuery({
    queryKey: ["shift-handovers", houseId],
    queryFn: async () => {
      const { data } = await supabase.from("shift_handovers").select("*, staff:outgoing_staff_id(profiles(full_name))").eq("sil_house_id", houseId).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const content = { participant_updates: participantUpdates, tasks_completed: tasksCompleted, outstanding_tasks: outstandingTasks, concerns };
      const { error } = await supabase.from("shift_handovers").insert({
        sil_house_id: houseId,
        shift_id: shiftId || null,
        outgoing_staff_id: staffId || user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-handovers"] });
      toast({ title: "Handover submitted" });
      setParticipantUpdates(""); setTasksCompleted(""); setOutstandingTasks(""); setConcerns("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const ackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shift_handovers").update({ acknowledged: true, acknowledged_at: new Date().toISOString(), incoming_staff_id: user?.id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shift-handovers"] }); toast({ title: "Handover acknowledged" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Shift Handovers</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <h4 className="font-medium text-sm">Submit New Handover</h4>
          <div><Label>Participant Updates</Label><Textarea value={participantUpdates} onChange={(e) => setParticipantUpdates(e.target.value)} placeholder="Any changes in participant condition or needs" /></div>
          <div><Label>Tasks Completed</Label><Textarea value={tasksCompleted} onChange={(e) => setTasksCompleted(e.target.value)} placeholder="Tasks completed during shift" /></div>
          <div><Label>Outstanding Tasks</Label><Textarea value={outstandingTasks} onChange={(e) => setOutstandingTasks(e.target.value)} placeholder="Tasks for next shift" /></div>
          <div><Label>Concerns</Label><Textarea value={concerns} onChange={(e) => setConcerns(e.target.value)} placeholder="Any concerns or issues" /></div>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Submitting…" : "Submit Handover"}
          </Button>

          <hr className="border-border" />
          <h4 className="font-medium text-sm">Recent Handovers</h4>
          {handovers.length === 0 ? <p className="text-sm text-muted-foreground">No handovers yet.</p> : (
            <div className="space-y-3">
              {handovers.map((h: any) => {
                const content = (h.content || {}) as Record<string, string>;
                return (
                  <div key={h.id} className="border border-border rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{(h.staff as any)?.profiles?.full_name || "Unknown"}</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("en-AU")}</span>
                        {h.acknowledged ? <Badge variant="default" className="text-xs">Acknowledged</Badge> : (
                          <Button size="sm" variant="outline" onClick={() => ackMutation.mutate(h.id)}>Acknowledge</Button>
                        )}
                      </div>
                    </div>
                    {content.participant_updates && <div><span className="text-muted-foreground">Updates:</span> {content.participant_updates}</div>}
                    {content.tasks_completed && <div><span className="text-muted-foreground">Completed:</span> {content.tasks_completed}</div>}
                    {content.outstanding_tasks && <div><span className="text-muted-foreground">Outstanding:</span> {content.outstanding_tasks}</div>}
                    {content.concerns && <div><span className="text-muted-foreground">Concerns:</span> {content.concerns}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
