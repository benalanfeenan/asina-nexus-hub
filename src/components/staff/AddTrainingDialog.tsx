import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { TRAINING_TO_COMPLIANCE, upsertComplianceItem, calcExpiryDate } from "@/lib/compliance-definitions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
}

function findComplianceMatch(name: string) {
  const lower = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(TRAINING_TO_COMPLIANCE)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export function AddTrainingDialog({ open, onOpenChange, staffId }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("pending");

  const complianceMatch = findComplianceMatch(name);

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

      // Auto-update compliance item
      if (complianceMatch && status === "completed" && completionDate) {
        const calculatedExpiry = complianceMatch.expiry_months
          ? (expiryDate || calcExpiryDate(completionDate, complianceMatch.expiry_months))
          : null;
        await upsertComplianceItem(supabase, staffId, complianceMatch.key, {
          status: "completed",
          date_completed: completionDate,
          expiry_date: calculatedExpiry,
          notes: `Training: ${name}${provider ? ` (${provider})` : ""}`,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-training", staffId] });
      qc.invalidateQueries({ queryKey: ["staff-compliance-items", staffId] });
      toast({ title: "Training record added & compliance updated" });
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
          <div><Label>Training Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Manual Handling, First Aid, CPR" /></div>
          {complianceMatch && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-500/10 p-2 text-xs text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Will auto-update compliance item: <strong>{complianceMatch.key.replace(/_/g, " ")}</strong>
              {complianceMatch.expiry_months && <span>(expires in {complianceMatch.expiry_months} months)</span>}
            </div>
          )}
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
