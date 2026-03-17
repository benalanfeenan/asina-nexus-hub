import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function SILHouseKeysTab({ houseId }: { houseId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ key_number: "", issued_to: "", issued_date: new Date().toISOString().slice(0, 10) });

  const { data: records = [] } = useQuery({
    queryKey: ["house-keys", houseId],
    queryFn: async () => {
      const { data } = await supabase.from("house_keys").select("*").eq("sil_house_id", houseId).order("key_number");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("house_keys").insert({
        sil_house_id: houseId, key_number: form.key_number, issued_to: form.issued_to || null, issued_date: form.issued_date || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["house-keys", houseId] }); setOpen(false); toast.success("Key added"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Key Register</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Key</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Key</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Key Number</Label><Input value={form.key_number} onChange={e => setForm(f => ({ ...f, key_number: e.target.value }))} /></div>
              <div><Label>Issued To</Label><Input value={form.issued_to} onChange={e => setForm(f => ({ ...f, issued_to: e.target.value }))} /></div>
              <div><Label>Issued Date</Label><Input type="date" value={form.issued_date} onChange={e => setForm(f => ({ ...f, issued_date: e.target.value }))} /></div>
              <Button onClick={() => addMutation.mutate()} disabled={!form.key_number}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No keys registered.</p> : (
          <Table><TableHeader><TableRow><TableHead>Key #</TableHead><TableHead>Issued To</TableHead><TableHead>Issued Date</TableHead><TableHead>Returned</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell>{r.key_number}</TableCell><TableCell>{r.issued_to || "—"}</TableCell><TableCell>{r.issued_date ? format(new Date(r.issued_date), "dd/MM/yyyy") : "—"}</TableCell><TableCell>{r.returned_date ? format(new Date(r.returned_date), "dd/MM/yyyy") : "—"}</TableCell><TableCell><Badge variant={r.status === "issued" ? "default" : "secondary"}>{r.status}</Badge></TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}
