import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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

export default function LegislativeCompliance() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ legislation_name: "", description: "", applicable_to: "", review_date: "" });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["legislative-compliance"],
    queryFn: async () => {
      const { data } = await supabase.from("legislative_compliance").select("*").order("legislation_name");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { legislation_name: form.legislation_name, description: form.description || null, applicable_to: form.applicable_to || null, review_date: form.review_date || null };
      const { error } = await supabase.from("legislative_compliance").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["legislative-compliance"] }); setOpen(false); toast.success("Legislation added"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Legislative Compliance Register" subtitle="Applicable legislation and review dates">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Add Legislation</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Legislation</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Legislation Name</Label><Input value={form.legislation_name} onChange={e => setForm(f => ({ ...f, legislation_name: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Applicable To</Label><Input value={form.applicable_to} onChange={e => setForm(f => ({ ...f, applicable_to: e.target.value }))} /></div>
              <div><Label>Review Date</Label><Input type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} /></div>
              <Button onClick={() => addMutation.mutate()} disabled={!form.legislation_name}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? <p className="text-sm text-muted-foreground">No legislation recorded.</p> : (
            <Table><TableHeader><TableRow><TableHead>Legislation</TableHead><TableHead>Applicable To</TableHead><TableHead>Review Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{records.map((r: any) => (
                <TableRow key={r.id}><TableCell>{r.legislation_name}</TableCell><TableCell>{r.applicable_to || "—"}</TableCell><TableCell>{r.review_date ? format(new Date(r.review_date), "dd/MM/yyyy") : "—"}</TableCell><TableCell><Badge variant={r.status === "current" ? "default" : "secondary"}>{r.status}</Badge></TableCell></TableRow>
              ))}</TableBody></Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
