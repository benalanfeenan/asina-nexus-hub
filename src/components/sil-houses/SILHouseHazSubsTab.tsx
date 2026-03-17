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

export function SILHouseHazSubsTab({ houseId }: { houseId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ substance_name: "", location: "", sds_url: "", risk_level: "medium" });

  const { data: records = [] } = useQuery({
    queryKey: ["hazardous-substances", houseId],
    queryFn: async () => {
      const { data } = await supabase.from("hazardous_substances").select("*").eq("sil_house_id", houseId).order("substance_name");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("hazardous_substances").insert({
        sil_house_id: houseId, substance_name: form.substance_name, location: form.location || null,
        sds_url: form.sds_url || null, risk_level: form.risk_level,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hazardous-substances", houseId] }); setOpen(false); toast.success("Substance added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const riskColors: Record<string, string> = { low: "default", medium: "outline", high: "destructive" };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Hazardous Substances</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Substance</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Hazardous Substance</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Substance Name</Label><Input value={form.substance_name} onChange={e => setForm(f => ({ ...f, substance_name: e.target.value }))} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div><Label>SDS URL</Label><Input value={form.sds_url} onChange={e => setForm(f => ({ ...f, sds_url: e.target.value }))} /></div>
              <div><Label>Risk Level</Label><Select value={form.risk_level} onValueChange={v => setForm(f => ({ ...f, risk_level: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
              <Button onClick={() => addMutation.mutate()} disabled={!form.substance_name}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No substances registered.</p> : (
          <Table><TableHeader><TableRow><TableHead>Substance</TableHead><TableHead>Location</TableHead><TableHead>Risk Level</TableHead><TableHead>SDS</TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell>{r.substance_name}</TableCell><TableCell>{r.location || "—"}</TableCell><TableCell><Badge variant={riskColors[r.risk_level] as any || "secondary"}>{r.risk_level}</Badge></TableCell><TableCell>{r.sds_url ? <a href={r.sds_url} target="_blank" className="text-primary underline text-sm">View</a> : "—"}</TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}
