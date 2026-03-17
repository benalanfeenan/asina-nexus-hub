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
import { Plus, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export function SILHouseCleaningTab({ houseId }: { houseId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ task: "", frequency: "daily" });

  const { data: records = [] } = useQuery({
    queryKey: ["cleaning-schedules", houseId],
    queryFn: async () => {
      const { data } = await supabase.from("cleaning_schedules").select("*").eq("sil_house_id", houseId).order("task");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cleaning_schedules").insert({ sil_house_id: houseId, task: form.task, frequency: form.frequency } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cleaning-schedules", houseId] }); setOpen(false); toast.success("Task added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const markComplete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cleaning_schedules").update({ last_completed: new Date().toISOString(), completed_by: user?.id } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cleaning-schedules", houseId] }); toast.success("Marked complete"); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cleaning Schedules</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Task</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Cleaning Task</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Task</Label><Input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} placeholder="e.g. Mop kitchen floor" /></div>
              <div><Label>Frequency</Label><Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="fortnightly">Fortnightly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>
              <Button onClick={() => addMutation.mutate()} disabled={!form.task}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No cleaning tasks set up.</p> : (
          <Table><TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Frequency</TableHead><TableHead>Last Completed</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell>{r.task}</TableCell><TableCell><Badge variant="outline">{r.frequency}</Badge></TableCell><TableCell>{r.last_completed ? format(new Date(r.last_completed), "dd/MM/yyyy HH:mm") : "Never"}</TableCell><TableCell><Button size="sm" variant="ghost" onClick={() => markComplete.mutate(r.id)}><CheckCircle className="h-4 w-4 mr-1" />Done</Button></TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}
