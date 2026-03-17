import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

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

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("staff_acknowledgements").insert({ staff_id: staffId, document_type: form.document_type, signed_date: form.signed_date } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff-acknowledgements", staffId] }); setOpen(false); toast.success("Acknowledgement added"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Acknowledgements</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Acknowledgement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Document Type</Label><Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v }))}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="induction_checklist">Induction Checklist</SelectItem><SelectItem value="code_of_conduct">Code of Conduct</SelectItem><SelectItem value="confidentiality_agreement">Confidentiality Agreement</SelectItem><SelectItem value="it_acceptable_use">IT Acceptable Use</SelectItem><SelectItem value="whs_policy">WHS Policy</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div><Label>Signed Date</Label><Input type="date" value={form.signed_date} onChange={e => setForm(f => ({ ...f, signed_date: e.target.value }))} /></div>
              <Button onClick={() => addMutation.mutate()} disabled={!form.document_type}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No acknowledgements recorded.</p> : (
          <Table><TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Signed Date</TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell className="capitalize">{r.document_type.replace(/_/g, " ")}</TableCell><TableCell>{format(new Date(r.signed_date), "dd/MM/yyyy")}</TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}
