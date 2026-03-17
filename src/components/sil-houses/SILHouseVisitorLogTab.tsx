import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export function SILHouseVisitorLogTab({ houseId }: { houseId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), visitor_name: "", purpose: "", time_in: "", time_out: "" });

  const { data: records = [] } = useQuery({
    queryKey: ["visitor-log", houseId],
    queryFn: async () => {
      const { data } = await supabase.from("visitor_log").select("*").eq("sil_house_id", houseId).order("date", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("visitor_log").insert({
        sil_house_id: houseId, date: form.date, visitor_name: form.visitor_name,
        purpose: form.purpose || null, time_in: form.time_in || null, time_out: form.time_out || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["visitor-log", houseId] }); setOpen(false); toast.success("Visitor logged"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Visitor Log</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Log Visitor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Visitor</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><Label>Visitor Name</Label><Input value={form.visitor_name} onChange={e => setForm(f => ({ ...f, visitor_name: e.target.value }))} /></div>
              <div><Label>Purpose</Label><Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Time In</Label><Input type="time" value={form.time_in} onChange={e => setForm(f => ({ ...f, time_in: e.target.value }))} /></div>
                <div><Label>Time Out</Label><Input type="time" value={form.time_out} onChange={e => setForm(f => ({ ...f, time_out: e.target.value }))} /></div>
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={!form.visitor_name}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No visitors logged.</p> : (
          <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Visitor</TableHead><TableHead>Purpose</TableHead><TableHead>Time In</TableHead><TableHead>Time Out</TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell>{format(new Date(r.date), "dd/MM/yyyy")}</TableCell><TableCell>{r.visitor_name}</TableCell><TableCell>{r.purpose || "—"}</TableCell><TableCell>{r.time_in || "—"}</TableCell><TableCell>{r.time_out || "—"}</TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}
