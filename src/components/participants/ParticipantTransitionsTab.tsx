import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowRightLeft } from "lucide-react";

interface Props {
  participantId: string;
  canEdit: boolean;
}

export function ParticipantTransitionsTab({ participantId, canEdit }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const [type, setType] = useState("exit");
  const [reason, setReason] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [destination, setDestination] = useState("");
  const [handover, setHandover] = useState("");
  const [interviewDone, setInterviewDone] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState("");
  const [docsTransferred, setDocsTransferred] = useState(false);

  const { data: transitions = [], isLoading } = useQuery({
    queryKey: ["participant-transitions", participantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_transitions")
        .select("*")
        .eq("participant_id", participantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("participant_transitions").insert({
        participant_id: participantId,
        transition_type: type,
        reason: reason || null,
        exit_date: exitDate || null,
        destination_provider: destination || null,
        handover_summary: handover || null,
        exit_interview_completed: interviewDone,
        exit_interview_notes: interviewNotes || null,
        documents_transferred: docsTransferred,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participant-transitions", participantId] });
      toast({ title: "Transition recorded" });
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setShowAdd(false);
    setType("exit");
    setReason("");
    setExitDate("");
    setDestination("");
    setHandover("");
    setInterviewDone(false);
    setInterviewNotes("");
    setDocsTransferred(false);
  };

  const typeLabel = (t: string) => {
    const map: Record<string, string> = { exit: "Exit", transfer: "Transfer", plan_review: "Plan Review" };
    return map[t] || t;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5" />Transitions</CardTitle>
        {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Record Transition</Button>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : transitions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transitions recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead>Docs Transferred</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transitions.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell><Badge variant="outline">{typeLabel(t.transition_type)}</Badge></TableCell>
                  <TableCell>{t.exit_date ? new Date(t.exit_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{t.reason || "—"}</TableCell>
                  <TableCell>{t.destination_provider || "—"}</TableCell>
                  <TableCell>{t.exit_interview_completed ? <Badge className="bg-emerald-500/15 text-emerald-700">Done</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                  <TableCell>{t.documents_transferred ? <Badge className="bg-emerald-500/15 text-emerald-700">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Transition</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exit">Exit</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="plan_review">Plan Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Exit/Transition Date</Label><Input type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} /></div>
            <div><Label>Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for transition" /></div>
            <div><Label>Destination Provider</Label><Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. New provider name" /></div>
            <div><Label>Handover Summary</Label><Textarea value={handover} onChange={(e) => setHandover(e.target.value)} placeholder="Summary of handover details" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={interviewDone} onCheckedChange={setInterviewDone} />
              <Label>Exit Interview Completed</Label>
            </div>
            {interviewDone && <div><Label>Interview Notes</Label><Textarea value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} /></div>}
            <div className="flex items-center gap-3">
              <Switch checked={docsTransferred} onCheckedChange={setDocsTransferred} />
              <Label>Documents Transferred</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
