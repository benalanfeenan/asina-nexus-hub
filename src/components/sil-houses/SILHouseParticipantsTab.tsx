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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserMinus } from "lucide-react";

export function SILHouseParticipantsTab({ houseId }: { houseId: string }) {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [moveInDate, setMoveInDate] = useState("");

  const { data: linked = [] } = useQuery({
    queryKey: ["sil-house-participants", houseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("sil_house_participants")
        .select("*, participants(first_name, last_name, ndis_number)")
        .eq("sil_house_id", houseId)
        .eq("is_current", true);
      return data || [];
    },
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ["participants-for-assign"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name").eq("is_active", true).order("first_name");
      return data || [];
    },
    enabled: showAdd,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sil_house_participants").insert({
        sil_house_id: houseId,
        participant_id: selectedParticipant,
        move_in_date: moveInDate || null,
        is_current: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sil-house-participants", houseId] });
      toast({ title: "Participant assigned" });
      setShowAdd(false);
      setSelectedParticipant("");
      setMoveInDate("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("sil_house_participants")
        .update({ is_current: false, move_out_date: new Date().toISOString().split("T")[0] })
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sil-house-participants", houseId] });
      toast({ title: "Participant removed" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Current Participants</CardTitle>
        {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Assign</Button>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>NDIS Number</TableHead>
              <TableHead>Move In</TableHead>
              {canEdit && <TableHead className="w-[80px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {linked.length === 0 ? (
              <TableRow><TableCell colSpan={canEdit ? 4 : 3} className="text-center text-muted-foreground py-6">No participants assigned.</TableCell></TableRow>
            ) : (
              linked.map((l) => {
                const p = l.participants as any;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{p?.first_name} {p?.last_name}</TableCell>
                    <TableCell>{p?.ndis_number || "—"}</TableCell>
                    <TableCell>{l.move_in_date || "—"}</TableCell>
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
          <DialogHeader><DialogTitle>Assign Participant</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Participant</Label>
              <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                <SelectContent>
                  {allParticipants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Move-in Date</Label>
              <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={!selectedParticipant || assignMutation.isPending}>
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
