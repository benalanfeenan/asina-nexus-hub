import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  reported: "bg-amber-500/15 text-amber-700 border-amber-200",
  scheduled: "bg-blue-500/15 text-blue-700 border-blue-200",
  in_progress: "bg-purple-500/15 text-purple-700 border-purple-200",
  completed: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
};

export function SILHouseMaintenanceTab({ houseId }: { houseId: string }) {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [contractor, setContractor] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["sil-house-maintenance", houseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("property_maintenance_log")
        .select("*")
        .eq("sil_house_id", houseId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("property_maintenance_log").insert({
        sil_house_id: houseId,
        description,
        priority,
        contractor: contractor || null,
        scheduled_date: scheduledDate || null,
        cost: cost ? parseFloat(cost) : null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sil-house-maintenance", houseId] });
      toast({ title: "Maintenance item added" });
      setShowAdd(false);
      setDescription(""); setContractor(""); setScheduledDate(""); setCost(""); setNotes("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Maintenance Log</CardTitle>
        {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Item</Button>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contractor</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Scheduled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No maintenance items.</TableCell></TableRow>
            ) : (
              items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{m.description}</TableCell>
                  <TableCell className="capitalize">{m.priority || "medium"}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[m.status] || ""} variant="outline">{m.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>{m.contractor || "—"}</TableCell>
                  <TableCell>{m.cost ? `$${m.cost}` : "—"}</TableCell>
                  <TableCell>{m.scheduled_date || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Maintenance Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue" /></div>
            <div><Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Contractor</Label><Input value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="Contractor name" /></div>
            <div><Label>Scheduled Date</Label><Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} /></div>
            <div><Label>Estimated Cost</Label><Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!description || addMutation.isPending}>
              {addMutation.isPending ? "Saving..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
