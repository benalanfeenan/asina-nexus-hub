import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Insurance() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ policy_type: "", provider: "", policy_number: "", start_date: "", expiry_date: "" });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["insurance-register"],
    queryFn: async () => {
      const { data } = await supabase.from("insurance_register").select("*").order("expiry_date");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("insurance_register").insert({
        policy_type: form.policy_type, provider: form.provider || null, policy_number: form.policy_number || null,
        start_date: form.start_date || null, expiry_date: form.expiry_date || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["insurance-register"] }); setOpen(false); toast.success("Policy added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const isExpired = (d: string | null) => d && new Date(d) < new Date();
  const isExpiringSoon = (d: string | null) => d && !isExpired(d) && new Date(d) < new Date(Date.now() + 30 * 86400000);

  return (
    <div className="space-y-6">
      <PageHeader title="Insurance Register" subtitle="Policy tracking and expiry management">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Add Policy</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Insurance Policy</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Policy Type</Label><Input value={form.policy_type} onChange={e => setForm(f => ({ ...f, policy_type: e.target.value }))} placeholder="e.g. Public Liability" /></div>
              <div><Label>Provider</Label><Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} /></div>
              <div><Label>Policy Number</Label><Input value={form.policy_number} onChange={e => setForm(f => ({ ...f, policy_number: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={!form.policy_type}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? <p className="text-sm text-muted-foreground">No policies recorded.</p> : (
            <Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Provider</TableHead><TableHead>Policy #</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{records.map((r: any) => (
                <TableRow key={r.id}><TableCell>{r.policy_type}</TableCell><TableCell>{r.provider || "—"}</TableCell><TableCell>{r.policy_number || "—"}</TableCell>
                  <TableCell>{r.expiry_date ? format(new Date(r.expiry_date), "dd/MM/yyyy") : "—"}</TableCell>
                  <TableCell><Badge variant={isExpired(r.expiry_date) ? "destructive" : isExpiringSoon(r.expiry_date) ? "outline" : "default"}>{isExpired(r.expiry_date) ? "Expired" : isExpiringSoon(r.expiry_date) ? "Expiring Soon" : r.status}</Badge></TableCell>
                </TableRow>
              ))}</TableBody></Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
