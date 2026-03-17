import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function ParticipantRoutinesTab({ participantId, canEdit }: { participantId: string; canEdit: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState("");
  const [description, setDescription] = useState("");
  const [supportRequired, setSupportRequired] = useState("");

  const { data: routines = [] } = useQuery({
    queryKey: ["participant-routines", participantId],
    queryFn: async () => {
      const { data } = await supabase.from("participant_daily_routines").select("*").eq("participant_id", participantId).order("time_of_day");
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("participant_daily_routines").insert({
        participant_id: participantId,
        time_of_day: timeOfDay.trim(),
        routine_description: description.trim(),
        support_required: supportRequired.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant-routines", participantId] });
      toast({ title: "Routine added" });
      setShowAdd(false);
      setTimeOfDay(""); setDescription(""); setSupportRequired("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Daily Routines</h3>
          {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Routine</Button>}
        </div>
        {routines.length === 0 ? <p className="text-muted-foreground text-sm">No routines recorded.</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Time of Day</TableHead><TableHead>Routine</TableHead><TableHead>Support Required</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {routines.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.time_of_day}</TableCell>
                  <TableCell>{r.routine_description}</TableCell>
                  <TableCell>{r.support_required || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Daily Routine</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Time of Day *</Label><Input value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} placeholder="e.g. Morning, 8:00 AM" /></div>
              <div><Label>Routine Description *</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the routine" /></div>
              <div><Label>Support Required</Label><Input value={supportRequired} onChange={(e) => setSupportRequired(e.target.value)} placeholder="Level of support needed" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={() => mutation.mutate()} disabled={!timeOfDay.trim() || !description.trim() || mutation.isPending}>{mutation.isPending ? "Saving..." : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
