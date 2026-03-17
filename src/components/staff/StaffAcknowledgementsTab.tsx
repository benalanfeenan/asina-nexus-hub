import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ACKNOWLEDGEMENT_TO_COMPLIANCE, upsertComplianceItem } from "@/lib/compliance-definitions";

export function StaffAcknowledgementsTab({ staffId }: { staffId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ document_type: "", signed_date: new Date().toISOString().slice(0, 10) });

  const { data: records = [] } = useQuery({
    queryKey: ["staff-acknowledgements", staffId],
    queryFn: async () => {
      const { data } = await supabase.from("staff_acknowledgements").select("*").eq("staff_id", staffId).order("signed_date", { ascending: false });
      return data || [];
    },
  });

  // Document-based acknowledgements
  const { data: docAcks = [] } = useQuery({
    queryKey: ["staff-doc-acknowledgements", staffId],
    queryFn: async () => {
      const { data } = await supabase
        .from("document_acknowledgements")
        .select("*, documents(title, category, version)")
        .eq("staff_id", staffId)
        .order("acknowledged_at", { ascending: false });
      return data || [];
    },
  });

  // Documents requiring acknowledgement that this staff hasn't acknowledged yet
  const { data: pendingDocs = [] } = useQuery({
    queryKey: ["staff-pending-doc-acks", staffId],
    queryFn: async () => {
      const { data: allReqDocs } = await supabase
        .from("documents")
        .select("id, title, category, version, updated_at")
        .eq("requires_acknowledgement", true);
      if (!allReqDocs) return [];
      const { data: acks } = await supabase
        .from("document_acknowledgements")
        .select("document_id")
        .eq("staff_id", staffId);
      const ackedIds = new Set((acks || []).map((a: any) => a.document_id));
      return allReqDocs.filter((d: any) => !ackedIds.has(d.id));
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("staff_acknowledgements").insert({ staff_id: staffId, document_type: form.document_type, signed_date: form.signed_date } as any);
      if (error) throw error;

      const complianceKey = ACKNOWLEDGEMENT_TO_COMPLIANCE[form.document_type];
      if (complianceKey) {
        await upsertComplianceItem(supabase, staffId, complianceKey, {
          status: "completed",
          date_completed: form.signed_date,
          notes: `Acknowledged on ${form.signed_date}`,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-acknowledgements", staffId] });
      qc.invalidateQueries({ queryKey: ["staff-compliance-items", staffId] });
      setOpen(false);
      setForm({ document_type: "", signed_date: new Date().toISOString().slice(0, 10) });
      toast.success("Acknowledgement added & compliance updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Manual Acknowledgements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manual Acknowledgements</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Acknowledgement</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Document Type</Label><Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v }))}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="induction_checklist">Induction Checklist</SelectItem><SelectItem value="code_of_conduct">Code of Conduct</SelectItem><SelectItem value="confidentiality_agreement">Confidentiality Agreement</SelectItem><SelectItem value="it_acceptable_use">IT Acceptable Use</SelectItem><SelectItem value="whs_policy">WHS Policy</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                <div><Label>Signed Date</Label><Input type="date" value={form.signed_date} onChange={e => setForm(f => ({ ...f, signed_date: e.target.value }))} /></div>
                {ACKNOWLEDGEMENT_TO_COMPLIANCE[form.document_type] && (
                  <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-500/10 p-2 text-xs text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Will auto-update compliance item: <strong>{ACKNOWLEDGEMENT_TO_COMPLIANCE[form.document_type]?.replace(/_/g, " ")}</strong>
                  </div>
                )}
                <Button onClick={() => addMutation.mutate()} disabled={!form.document_type || addMutation.isPending}>{addMutation.isPending ? "Saving..." : "Save"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? <p className="text-sm text-muted-foreground">No manual acknowledgements recorded.</p> : (
            <Table><TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Signed Date</TableHead></TableRow></TableHeader>
              <TableBody>{records.map((r: any) => (
                <TableRow key={r.id}><TableCell className="capitalize">{r.document_type.replace(/_/g, " ")}</TableCell><TableCell>{format(new Date(r.signed_date), "dd/MM/yyyy")}</TableCell></TableRow>
              ))}</TableBody></Table>
          )}
        </CardContent>
      </Card>

      {/* Document-based Acknowledgements */}
      <Card>
        <CardHeader>
          <CardTitle>Policy & Procedure Acknowledgements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                <Clock className="h-4 w-4" />Outstanding ({pendingDocs.length})
              </h4>
              <Table>
                <TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Category</TableHead><TableHead>Version</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pendingDocs.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.title}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{d.category}</Badge></TableCell>
                      <TableCell>{d.version || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {docAcks.length === 0 && pendingDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents require acknowledgement.</p>
          ) : docAcks.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />Completed ({docAcks.length})
              </h4>
              <Table>
                <TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Category</TableHead><TableHead>Acknowledged</TableHead></TableRow></TableHeader>
                <TableBody>
                  {docAcks.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.documents?.title || "Unknown"}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{a.documents?.category}</Badge></TableCell>
                      <TableCell>{format(new Date(a.acknowledged_at), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
