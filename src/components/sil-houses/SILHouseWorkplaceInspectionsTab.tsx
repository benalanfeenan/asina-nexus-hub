import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export function SILHouseWorkplaceInspectionsTab({ houseId }: { houseId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), findings: "", actions: "" });

  const { data: records = [] } = useQuery({
    queryKey: ["workplace-inspections", houseId],
    queryFn: async () => {
      const { data } = await supabase.from("workplace_inspections").select("*").eq("sil_house_id", houseId).order("date", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("workplace_inspections").insert({ sil_house_id: houseId, date: form.date, findings: form.findings || null, actions: form.actions || null } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workplace-inspections", houseId] }); setOpen(false); toast.success("Inspection added"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Workplace Inspections</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Inspection</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Workplace Inspection</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><Label>Findings</Label><Textarea value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} /></div>
              <div><Label>Actions Required</Label><Textarea value={form.actions} onChange={e => setForm(f => ({ ...f, actions: e.target.value }))} /></div>
              <Button onClick={() => addMutation.mutate()}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No inspections recorded.</p> : (
          <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Findings</TableHead><TableHead>Actions</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell>{format(new Date(r.date), "dd/MM/yyyy")}</TableCell><TableCell className="max-w-xs truncate">{r.findings || "—"}</TableCell><TableCell className="max-w-xs truncate">{r.actions || "—"}</TableCell><TableCell><Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status}</Badge></TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}
