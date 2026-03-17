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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ConflictOfInterest() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staff_id: "", description: "", management_strategy: "", declaration_date: new Date().toISOString().slice(0, 10) });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["conflict-of-interest"],
    queryFn: async () => {
      const { data } = await supabase.from("conflict_of_interest").select("*, staff(profiles(full_name))").order("declaration_date", { ascending: false });
      return data || [];
    },
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, profiles(full_name)").eq("is_active", true);
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("conflict_of_interest").insert(form as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["conflict-of-interest"] }); setOpen(false); toast.success("Declaration added"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Conflict of Interest Register" subtitle="Staff declarations and management strategies">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Add Declaration</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Declaration</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Staff Member</Label>
                <Select onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staffList.map((s: any) => <SelectItem key={s.id} value={s.id}>{(s.profiles as any)?.full_name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Declaration Date</Label><Input type="date" value={form.declaration_date} onChange={e => setForm(f => ({ ...f, declaration_date: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Management Strategy</Label><Textarea value={form.management_strategy} onChange={e => setForm(f => ({ ...f, management_strategy: e.target.value }))} /></div>
              <Button onClick={() => addMutation.mutate()} disabled={!form.staff_id || !form.description}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? <p className="text-sm text-muted-foreground">No declarations recorded.</p> : (
            <Table><TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Strategy</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{records.map((r: any) => (
                <TableRow key={r.id}><TableCell>{(r.staff as any)?.profiles?.full_name || "—"}</TableCell><TableCell>{format(new Date(r.declaration_date), "dd/MM/yyyy")}</TableCell><TableCell className="max-w-xs truncate">{r.description}</TableCell><TableCell className="max-w-xs truncate">{r.management_strategy || "—"}</TableCell><TableCell><Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge></TableCell></TableRow>
              ))}</TableBody></Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
