import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Syringe } from "lucide-react";

export function ParticipantMedicationsTab({ participantId, canEdit }: { participantId: string; canEdit: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showPrn, setShowPrn] = useState(false);
  const [prnMedId, setPrnMedId] = useState("");
  const [prnReason, setPrnReason] = useState("");
  const [prnOutcome, setPrnOutcome] = useState("");
  const [prnFollowUp, setPrnFollowUp] = useState(false);

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

  const { data: prnRecords = [] } = useQuery({
    queryKey: ["prn-records", participantId],
    queryFn: async () => {
      const medIds = medications.filter((m) => m.is_prn).map((m) => m.id);
      if (medIds.length === 0) return [];
      const { data } = await supabase.from("prn_records").select("*, medications(name)").in("medication_id", medIds).order("administered_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: medications.some((m) => m.is_prn),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("medications").insert({
        participant_id: participantId, name: name.trim(), dose: dose.trim() || null, frequency: frequency.trim() || null,
        route: route.trim() || null, prescriber: prescriber.trim() || null, is_prn: isPrn, instructions: instructions.trim() || null,
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

  const prnMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("prn_records").insert({
        medication_id: prnMedId, reason: prnReason, outcome: prnOutcome || null, follow_up_required: prnFollowUp, administered_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prn-records"] });
      toast({ title: "PRN recorded" });
      setShowPrn(false); setPrnMedId(""); setPrnReason(""); setPrnOutcome(""); setPrnFollowUp(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openPrnRecord = (medId: string) => {
    setPrnMedId(medId);
    setPrnReason(""); setPrnOutcome(""); setPrnFollowUp(false);
    setShowPrn(true);
  };

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
              <TableHead>Medication</TableHead><TableHead>Dose</TableHead><TableHead>Frequency</TableHead><TableHead>Route</TableHead><TableHead>PRN</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
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
                  <TableCell>
                    {m.is_prn && m.is_active && (
                      <Button size="sm" variant="outline" onClick={() => openPrnRecord(m.id)} className="gap-1">
                        <Syringe className="h-3 w-3" />Record PRN
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* PRN History */}
        {prnRecords.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-sm mb-2">Recent PRN Records</h4>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Medication</TableHead><TableHead>Reason</TableHead><TableHead>Outcome</TableHead><TableHead>Follow-up</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {prnRecords.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{new Date(r.administered_at).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                    <TableCell>{(r.medications as any)?.name}</TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell>{r.outcome || "—"}</TableCell>
                    <TableCell>{r.follow_up_required ? <Badge variant="destructive">Yes</Badge> : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Medication Dialog */}
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

        {/* PRN Record Dialog */}
        <Dialog open={showPrn} onOpenChange={setShowPrn}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record PRN Administration</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Reason *</Label><Textarea value={prnReason} onChange={(e) => setPrnReason(e.target.value)} placeholder="Why was this PRN medication given?" /></div>
              <div><Label>Outcome</Label><Textarea value={prnOutcome} onChange={(e) => setPrnOutcome(e.target.value)} placeholder="What was the outcome?" /></div>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={prnFollowUp} onCheckedChange={(v) => setPrnFollowUp(!!v)} />Follow-up required</label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPrn(false)}>Cancel</Button>
              <Button onClick={() => prnMutation.mutate()} disabled={!prnReason.trim() || prnMutation.isPending}>{prnMutation.isPending ? "Saving…" : "Record"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
