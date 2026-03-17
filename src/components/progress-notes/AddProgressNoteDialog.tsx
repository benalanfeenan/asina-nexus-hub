import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProgressNoteDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [participantId, setParticipantId] = useState("");
  const [content, setContent] = useState("");
  const [concernsFlagged, setConcernsFlagged] = useState(false);
  const [concernDetails, setConcernDetails] = useState("");

  const { data: participants = [] } = useQuery({
    queryKey: ["participants-select"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name").eq("is_active", true).order("first_name");
      return data || [];
    },
    enabled: open,
  });

  // Get the staff record linked to the current user
  const { data: staffRecord } = useQuery({
    queryKey: ["my-staff-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id").eq("profile_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user && open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!staffRecord) throw new Error("No staff record linked to your account. Contact an administrator.");
      const { error } = await supabase.from("progress_notes").insert({
        participant_id: participantId,
        staff_id: staffRecord.id,
        content,
        concerns_flagged: concernsFlagged,
        concern_details: concernsFlagged ? concernDetails || null : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress-notes"] });
      toast({ title: "Progress note added" });
      onOpenChange(false);
      setParticipantId(""); setContent(""); setConcernsFlagged(false); setConcernDetails("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Progress Note</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Participant</Label>
            <Select value={participantId} onValueChange={setParticipantId}>
              <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
              <SelectContent>
                {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Describe the participant's progress, activities, and observations…" rows={5} /></div>
          <div className="flex items-center gap-2">
            <Checkbox id="concerns" checked={concernsFlagged} onCheckedChange={(v) => setConcernsFlagged(!!v)} />
            <Label htmlFor="concerns">Flag concerns</Label>
          </div>
          {concernsFlagged && (
            <div><Label>Concern Details</Label><Textarea value={concernDetails} onChange={(e) => setConcernDetails(e.target.value)} placeholder="Describe the concern…" /></div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!participantId || !content || mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Add Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
