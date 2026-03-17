import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface Props {
  participantId: string;
}

export function ParticipantABCDataTab({ participantId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [antecedent, setAntecedent] = useState("");
  const [behaviour, setBehaviour] = useState("");
  const [consequence, setConsequence] = useState("");
  const [notes, setNotes] = useState("");

  const { data: records = [] } = useQuery({
    queryKey: ["abc-data", participantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("abc_data_sheets")
        .select("*")
        .eq("participant_id", participantId)
        .order("date", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("abc_data_sheets").insert({
        participant_id: participantId,
        antecedent,
        behaviour,
        consequence,
        notes: notes || null,
        staff_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abc-data", participantId] });
      setShowAdd(false);
      setAntecedent(""); setBehaviour(""); setConsequence(""); setNotes("");
      toast({ title: "ABC data recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Antecedent-Behaviour-Consequence data for BSP reviews</p>
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add ABC Record</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>Antecedent</TableHead>
              <TableHead>Behaviour</TableHead>
              <TableHead>Consequence</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No ABC data recorded</TableCell></TableRow>
            ) : records.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{format(new Date(r.date), "dd/MM/yyyy HH:mm")}</TableCell>
                <TableCell className="max-w-[180px] truncate">{r.antecedent}</TableCell>
                <TableCell className="max-w-[180px] truncate">{r.behaviour}</TableCell>
                <TableCell className="max-w-[180px] truncate">{r.consequence}</TableCell>
                <TableCell className="max-w-[120px] truncate">{r.notes || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record ABC Data</DialogTitle><DialogDescription>Log antecedent-behaviour-consequence observation</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Antecedent</Label><Textarea value={antecedent} onChange={(e) => setAntecedent(e.target.value)} placeholder="What happened before the behaviour?" /></div>
            <div className="grid gap-2"><Label>Behaviour</Label><Textarea value={behaviour} onChange={(e) => setBehaviour(e.target.value)} placeholder="Describe the behaviour observed" /></div>
            <div className="grid gap-2"><Label>Consequence</Label><Textarea value={consequence} onChange={(e) => setConsequence(e.target.value)} placeholder="What happened after the behaviour?" /></div>
            <div className="grid gap-2"><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!antecedent || !behaviour || !consequence}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
