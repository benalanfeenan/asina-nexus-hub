import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
}

export function AddTrainingDialog({ open, onOpenChange, staffId }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("pending");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("staff_training").insert({
        staff_id: staffId,
        training_name: name,
        provider: provider || null,
        completion_date: completionDate || null,
        expiry_date: expiryDate || null,
        status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-training", staffId] });
      toast({ title: "Training record added" });
      onOpenChange(false);
      setName(""); setProvider(""); setCompletionDate(""); setExpiryDate(""); setStatus("pending");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Training Record</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Training Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Manual Handling" /></div>
          <div><Label>Provider</Label><Input value={provider} onChange={(e) => setProvider(e.target.value)} /></div>
          <div><Label>Completion Date</Label><Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} /></div>
          <div><Label>Expiry Date</Label><Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
