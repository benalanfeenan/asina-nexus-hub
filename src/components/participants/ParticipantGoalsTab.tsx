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
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";

const GOAL_STATUSES = Constants.public.Enums.goal_status;

export function ParticipantGoalsTab({ participantId, canEdit }: { participantId: string; canEdit: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [status, setStatus] = useState<string>("not_started");
  const [targetDate, setTargetDate] = useState("");
  const [progress, setProgressVal] = useState("0");

  const { data: goals = [] } = useQuery({
    queryKey: ["participant-goals", participantId],
    queryFn: async () => {
      const { data } = await supabase.from("participant_goals").select("*").eq("participant_id", participantId).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("participant_goals").insert({
        participant_id: participantId,
        goal_text: goalText.trim(),
        status: status as any,
        target_date: targetDate || null,
        progress_percentage: parseInt(progress) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant-goals", participantId] });
      toast({ title: "Goal added" });
      setShowAdd(false);
      setGoalText(""); setStatus("not_started"); setTargetDate(""); setProgressVal("0");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusColor = (s: string) => {
    if (s === "achieved") return "default";
    if (s === "in_progress") return "secondary";
    if (s === "discontinued") return "destructive";
    return "outline";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Goals</h3>
          {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Goal</Button>}
        </div>
        {goals.length === 0 ? <p className="text-muted-foreground text-sm">No goals recorded.</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Goal</TableHead><TableHead>Status</TableHead><TableHead>Target Date</TableHead><TableHead>Progress</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {goals.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium max-w-[300px]">{g.goal_text}</TableCell>
                  <TableCell><Badge variant={statusColor(g.status)}>{g.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell>{g.target_date || "—"}</TableCell>
                  <TableCell className="w-[120px]"><Progress value={g.progress_percentage || 0} className="h-2" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Goal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Goal *</Label><Input value={goalText} onChange={(e) => setGoalText(e.target.value)} placeholder="Describe the goal" /></div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GOAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Target Date</Label><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
              <div><Label>Progress (%)</Label><Input type="number" min="0" max="100" value={progress} onChange={(e) => setProgressVal(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={() => mutation.mutate()} disabled={!goalText.trim() || mutation.isPending}>{mutation.isPending ? "Saving..." : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
