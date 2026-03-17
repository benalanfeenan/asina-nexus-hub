import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function ParticipantMedicationsTab({ participantId, canEdit }: { participantId: string; canEdit: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [route, setRoute] = useState("");
  const [prescriber, setPrescriber] = useState("");
  const [isPrn, setIsPrn] = useState(false);
  const [instructions, setInstructions] = useState("");

  const { data: medications = [] } = useQuery({
    queryKey: ["participant-medications", participantId],
    queryFn: async () => {
      const { data } = await supabase.from("medications").select("*").eq("participant_id", participantId).order("name");
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("medications").insert({
        participant_id: participantId,
        name: name.trim(),
        dose: dose.trim() || null,
        frequency: frequency.trim() || null,
        route: route.trim() || null,
        prescriber: prescriber.trim() || null,
        is_prn: isPrn,
        instructions: instructions.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant-medications", participantId] });
      toast({ title: "Medication added" });
      setShowAdd(false);
      setName(""); setDose(""); setFrequency(""); setRoute(""); setPrescriber(""); setIsPrn(false); setInstructions("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Medications</h3>
          {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Medication</Button>}
        </div>
        {medications.length === 0 ? <p className="text-muted-foreground text-sm">No medications recorded.</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Medication</TableHead><TableHead>Dose</TableHead><TableHead>Frequency</TableHead><TableHead>Route</TableHead><TableHead>PRN</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {medications.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.dose || "—"}</TableCell>
                  <TableCell>{m.frequency || "—"}</TableCell>
                  <TableCell>{m.route || "—"}</TableCell>
                  <TableCell>{m.is_prn ? <Badge variant="secondary">PRN</Badge> : ""}</TableCell>
                  <TableCell><Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Medication</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Medication Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dose</Label><Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 10mg" /></div>
                <div><Label>Frequency</Label><Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. Twice daily" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Route</Label><Input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="e.g. Oral" /></div>
                <div><Label>Prescriber</Label><Input value={prescriber} onChange={(e) => setPrescriber(e.target.value)} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={isPrn} onCheckedChange={(v) => setIsPrn(!!v)} />PRN (as needed)</label>
              <div><Label>Instructions</Label><Input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Special instructions" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>{mutation.isPending ? "Saving..." : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
