import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  participants: any[];
  userId?: string;
}

export function AddInvoiceDialog({ open, onOpenChange, participants, userId }: Props) {
  const queryClient = useQueryClient();
  const [participantId, setParticipantId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").insert({ participant_id: participantId, invoice_number: invoiceNumber, due_date: dueDate || null, notes: notes || null, created_by: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onOpenChange(false);
      setParticipantId(""); setInvoiceNumber(""); setDueDate(""); setNotes("");
      toast({ title: "Invoice created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Invoice</DialogTitle><DialogDescription>Create a new NDIS invoice</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Participant</Label>
            <Select value={participantId} onValueChange={setParticipantId}>
              <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
              <SelectContent>{participants.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2"><Label>Invoice Number</Label><Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => addMutation.mutate()} disabled={!participantId || !invoiceNumber}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
