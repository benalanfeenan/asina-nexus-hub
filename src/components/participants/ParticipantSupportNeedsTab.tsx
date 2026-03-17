import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function ParticipantSupportNeedsTab({ participantId, canEdit }: { participantId: string; canEdit: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [supportLevel, setSupportLevel] = useState("");

  const { data: needs = [] } = useQuery({
    queryKey: ["participant-support-needs", participantId],
    queryFn: async () => {
      const { data } = await supabase.from("participant_support_needs").select("*").eq("participant_id", participantId).order("category");
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("participant_support_needs").insert({
        participant_id: participantId,
        category: category.trim(),
        description: description.trim(),
        support_level: supportLevel.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant-support-needs", participantId] });
      toast({ title: "Support need added" });
      setShowAdd(false);
      setCategory(""); setDescription(""); setSupportLevel("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Support Needs</h3>
          {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Support Need</Button>}
        </div>
        {needs.length === 0 ? <p className="text-muted-foreground text-sm">No support needs recorded.</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Support Level</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {needs.map((n) => (
                <TableRow key={n.id}>
                  <TableCell><Badge variant="outline">{n.category}</Badge></TableCell>
                  <TableCell>{n.description}</TableCell>
                  <TableCell>{n.support_level || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Support Need</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Category *</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Personal Care, Mobility" /></div>
              <div><Label>Description *</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the support need" /></div>
              <div><Label>Support Level</Label><Input value={supportLevel} onChange={(e) => setSupportLevel(e.target.value)} placeholder="e.g. Full assist, Prompting" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={() => mutation.mutate()} disabled={!category.trim() || !description.trim() || mutation.isPending}>{mutation.isPending ? "Saving..." : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
