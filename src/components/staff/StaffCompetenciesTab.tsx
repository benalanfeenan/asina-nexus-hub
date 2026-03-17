import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { COMPETENCY_TO_COMPLIANCE, upsertComplianceItem, calcExpiryDate } from "@/lib/compliance-definitions";

export function StaffCompetenciesTab({ staffId }: { staffId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ competency_type: "", date: new Date().toISOString().slice(0, 10), assessor: "", result: "competent", next_due: "", notes: "" });

  const { data: records = [] } = useQuery({
    queryKey: ["staff-competencies", staffId],
    queryFn: async () => {
      const { data } = await supabase.from("staff_competency_assessments").select("*").eq("staff_id", staffId).order("date", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("staff_competency_assessments").insert({
        staff_id: staffId, competency_type: form.competency_type, date: form.date, assessor: form.assessor || null,
        result: form.result, next_due: form.next_due || null, notes: form.notes || null,
      } as any);
      if (error) throw error;

      // Auto-update compliance item if competent
      const complianceKey = COMPETENCY_TO_COMPLIANCE[form.competency_type];
      if (complianceKey && form.result === "competent") {
        const expiryDate = calcExpiryDate(form.date, 12);
        await upsertComplianceItem(supabase, staffId, complianceKey, {
          status: "completed",
          date_completed: form.date,
          expiry_date: expiryDate,
          notes: `Assessed by ${form.assessor || "unknown"}`,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-competencies", staffId] });
      qc.invalidateQueries({ queryKey: ["staff-compliance-items", staffId] });
      setOpen(false);
      setForm({ competency_type: "", date: new Date().toISOString().slice(0, 10), assessor: "", result: "competent", next_due: "", notes: "" });
      toast.success("Assessment added & compliance updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Competency Assessments</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Competency Assessment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Type</Label><Select value={form.competency_type} onValueChange={v => setForm(f => ({ ...f, competency_type: v }))}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="medication">Medication</SelectItem><SelectItem value="mealtime">Mealtime</SelectItem><SelectItem value="high_intensity">High Intensity</SelectItem><SelectItem value="bsp">BSP Implementation</SelectItem><SelectItem value="manual_handling">Manual Handling</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><Label>Result</Label><Select value={form.result} onValueChange={v => setForm(f => ({ ...f, result: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="competent">Competent</SelectItem><SelectItem value="not_yet_competent">Not Yet Competent</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>Assessor</Label><Input value={form.assessor} onChange={e => setForm(f => ({ ...f, assessor: e.target.value }))} /></div>
              <div><Label>Next Due</Label><Input type="date" value={form.next_due} onChange={e => setForm(f => ({ ...f, next_due: e.target.value }))} /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <p className="text-xs text-muted-foreground">If competent, the matching compliance item will be auto-updated.</p>
              <Button onClick={() => addMutation.mutate()} disabled={!form.competency_type || addMutation.isPending}>{addMutation.isPending ? "Saving..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No assessments recorded.</p> : (
          <Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Result</TableHead><TableHead>Assessor</TableHead><TableHead>Next Due</TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell className="capitalize">{r.competency_type.replace("_", " ")}</TableCell><TableCell>{format(new Date(r.date), "dd/MM/yyyy")}</TableCell><TableCell><Badge variant={r.result === "competent" ? "default" : "destructive"}>{r.result.replace("_", " ")}</Badge></TableCell><TableCell>{r.assessor || "—"}</TableCell><TableCell>{r.next_due ? format(new Date(r.next_due), "dd/MM/yyyy") : "—"}</TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}
