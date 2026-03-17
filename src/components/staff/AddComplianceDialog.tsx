import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type CheckType = Database["public"]["Enums"]["compliance_check_type"];

const CHECK_TYPE_LABELS: Record<CheckType, string> = {
  ndis_wsc: "NDIS Worker Screening",
  wwcc: "Working with Children",
  first_aid: "First Aid",
  cpr: "CPR",
  police_check: "Police Check",
  drivers_license: "Driver's License",
  other: "Other",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
}

export function AddComplianceDialog({ open, onOpenChange, staffId }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [checkType, setCheckType] = useState<CheckType>("ndis_wsc");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [verified, setVerified] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("staff_compliance").insert({
        staff_id: staffId,
        check_type: checkType,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        reference_number: refNumber || null,
        is_verified: verified,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-compliance", staffId] });
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast({ title: "Compliance check added" });
      onOpenChange(false);
      setCheckType("ndis_wsc"); setIssueDate(""); setExpiryDate(""); setRefNumber(""); setVerified(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Compliance Check</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Check Type</Label>
            <Select value={checkType} onValueChange={(v) => setCheckType(v as CheckType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CHECK_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Issue Date</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
          <div><Label>Expiry Date</Label><Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
          <div><Label>Reference Number</Label><Input value={refNumber} onChange={(e) => setRefNumber(e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={verified} onCheckedChange={setVerified} />
            <Label>Verified</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
