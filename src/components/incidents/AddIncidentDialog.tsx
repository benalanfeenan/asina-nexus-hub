import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function AddIncidentDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("low");
  const [participantId, setParticipantId] = useState("");
  const [silHouseId, setSilHouseId] = useState("");
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split("T")[0]);
  const [immediateActions, setImmediateActions] = useState("");
  const [isReportable, setIsReportable] = useState(false);

  const { data: participants = [] } = useQuery({
    queryKey: ["participants-select"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name").eq("is_active", true).order("first_name");
      return data || [];
    },
    enabled: open,
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["sil-houses-select"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("incidents").insert({
        title,
        description,
        severity: severity as any,
        participant_id: participantId || null,
        sil_house_id: silHouseId || null,
        date_occurred: dateOccurred,
        immediate_actions: immediateActions || null,
        is_reportable: isReportable,
        reported_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Incident reported" });
      onOpenChange(false);
      setTitle(""); setDescription(""); setSeverity("low"); setParticipantId(""); setSilHouseId("");
      setImmediateActions(""); setIsReportable(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Report Incident</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief incident title" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" /></div>
          <div><Label>Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Participant (optional)</Label>
            <Select value={participantId} onValueChange={setParticipantId}>
              <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
              <SelectContent>
                {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>SIL House (optional)</Label>
            <Select value={silHouseId} onValueChange={setSilHouseId}>
              <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
              <SelectContent>
                {houses.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Date Occurred</Label><Input type="date" value={dateOccurred} onChange={(e) => setDateOccurred(e.target.value)} /></div>
          <div><Label>Immediate Actions Taken</Label><Textarea value={immediateActions} onChange={(e) => setImmediateActions(e.target.value)} placeholder="What was done immediately?" /></div>
          <div className="flex items-center gap-2">
            <Checkbox id="reportable" checked={isReportable} onCheckedChange={(v) => setIsReportable(!!v)} />
            <Label htmlFor="reportable">NDIS Reportable Incident</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!title || !description || mutation.isPending}>
            {mutation.isPending ? "Reporting..." : "Report Incident"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
