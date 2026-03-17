import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserMinus } from "lucide-react";

export function SILHouseStaffTab({ houseId }: { houseId: string }) {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");

  const { data: linked = [] } = useQuery({
    queryKey: ["sil-house-staff", houseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("sil_house_staff")
        .select("*, staff(id, position, profiles(full_name))")
        .eq("sil_house_id", houseId);
      return data || [];
    },
  });

  const { data: allStaff = [] } = useQuery({
    queryKey: ["staff-for-assign"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, position, profiles(full_name)").eq("is_active", true);
      return data || [];
    },
    enabled: showAdd,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sil_house_staff").insert({ sil_house_id: houseId, staff_id: selectedStaff });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sil-house-staff", houseId] });
      toast({ title: "Staff assigned" });
      setShowAdd(false);
      setSelectedStaff("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("sil_house_staff").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sil-house-staff", houseId] });
      toast({ title: "Staff removed" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assigned Staff</CardTitle>
        {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Assign</Button>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Primary</TableHead>
              {canEdit && <TableHead className="w-[80px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {linked.length === 0 ? (
              <TableRow><TableCell colSpan={canEdit ? 4 : 3} className="text-center text-muted-foreground py-6">No staff assigned.</TableCell></TableRow>
            ) : (
              linked.map((l) => {
                const s = l.staff as any;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{s?.profiles?.full_name || "—"}</TableCell>
                    <TableCell>{s?.position || "—"}</TableCell>
                    <TableCell>{l.is_primary ? <Badge>Primary</Badge> : "—"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(l.id)}>
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Staff</DialogTitle></DialogHeader>
          <div>
            <Label>Staff Member</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
              <SelectContent>
                {allStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{(s.profiles as any)?.full_name || "Unknown"} — {s.position || "No position"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={!selectedStaff || assignMutation.isPending}>
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
