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
import { Plus, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format, addMonths, differenceInDays } from "date-fns";
import { SUPERVISION_TO_COMPLIANCE, upsertComplianceItem } from "@/lib/compliance-definitions";

interface Props {
  staffId: string;
  staffStartDate?: string | null;
  supervisionFrequencyMonths?: number;
}

export function StaffSupervisionsTab({ staffId, staffStartDate, supervisionFrequencyMonths = 1 }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "supervision", notes: "", next_due: "" });

  const { data: records = [] } = useQuery({
    queryKey: ["staff-supervisions", staffId],
    queryFn: async () => {
      const { data } = await supabase.from("staff_supervisions").select("*").eq("staff_id", staffId).order("date", { ascending: false });
      return data || [];
    },
  });

  // Calculate overdue status
  const { isOverdue, nextDueDate, daysSinceLastOrStart } = useMemo(() => {
    const lastSupervision = records[0];
    const baseDate = lastSupervision ? new Date(lastSupervision.date) : (staffStartDate ? new Date(staffStartDate) : null);
    if (!baseDate) return { isOverdue: false, nextDueDate: null, daysSinceLastOrStart: 0 };
    
    const nextDue = addMonths(baseDate, supervisionFrequencyMonths);
    const now = new Date();
    const overdue = now > nextDue;
    const daysDiff = differenceInDays(now, baseDate);
    
    return { isOverdue: overdue, nextDueDate: nextDue, daysSinceLastOrStart: daysDiff };
  }, [records, staffStartDate, supervisionFrequencyMonths]);

  // Auto-calculate next_due when date changes
  const autoNextDue = useMemo(() => {
    if (!form.date) return "";
    return format(addMonths(new Date(form.date), supervisionFrequencyMonths), "yyyy-MM-dd");
  }, [form.date, supervisionFrequencyMonths]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const nextDue = form.next_due || autoNextDue;
      const { error } = await supabase.from("staff_supervisions").insert({
        staff_id: staffId, date: form.date, type: form.type, notes: form.notes || null, next_due: nextDue || null,
      } as any);
      if (error) throw error;

      // Auto-update compliance item
      const complianceKey = SUPERVISION_TO_COMPLIANCE[form.type];
      if (complianceKey) {
        await upsertComplianceItem(supabase, staffId, complianceKey, {
          status: "completed",
          date_completed: form.date,
          notes: form.notes || null,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-supervisions", staffId] });
      qc.invalidateQueries({ queryKey: ["staff-compliance-items", staffId] });
      setOpen(false);
      setForm({ date: new Date().toISOString().slice(0, 10), type: "supervision", notes: "", next_due: "" });
      toast.success("Supervision added & compliance updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Supervisions & Reviews</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Supervision / Review</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><Label>Type</Label><Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="supervision">Supervision</SelectItem><SelectItem value="performance_review">Performance Review</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div><Label>Next Due {autoNextDue && <span className="text-xs text-muted-foreground ml-1">(auto: {autoNextDue})</span>}</Label><Input type="date" value={form.next_due || autoNextDue} onChange={e => setForm(f => ({ ...f, next_due: e.target.value }))} /></div>
              <p className="text-xs text-muted-foreground">Saving will also update the compliance score automatically.</p>
              <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>{addMutation.isPending ? "Saving..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue Banner */}
        {isOverdue && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">Supervision Overdue</p>
              <p className="text-muted-foreground text-xs">
                {nextDueDate ? `Was due ${format(nextDueDate, "dd/MM/yyyy")}` : ""} · {daysSinceLastOrStart} days since last supervision{!records.length ? " (or start date)" : ""}
              </p>
            </div>
          </div>
        )}
        {!isOverdue && nextDueDate && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-500/10 p-3 text-sm">
            <p className="text-emerald-700 text-xs">Next supervision due: <strong>{format(nextDueDate, "dd/MM/yyyy")}</strong></p>
          </div>
        )}

        {records.length === 0 ? <p className="text-sm text-muted-foreground">No supervisions recorded.</p> : (
          <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Notes</TableHead><TableHead>Next Due</TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell>{format(new Date(r.date), "dd/MM/yyyy")}</TableCell><TableCell><Badge variant="outline">{r.type.replace("_", " ")}</Badge></TableCell><TableCell className="max-w-xs truncate">{r.notes || "—"}</TableCell><TableCell>{r.next_due ? format(new Date(r.next_due), "dd/MM/yyyy") : "—"}</TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}
