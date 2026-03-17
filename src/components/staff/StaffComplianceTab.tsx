import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { AddComplianceDialog } from "./AddComplianceDialog";
import { useAuth } from "@/contexts/AuthContext";

const CHECK_LABELS: Record<string, string> = {
  ndis_wsc: "NDIS Worker Screening",
  wwcc: "Working with Children",
  first_aid: "First Aid",
  cpr: "CPR",
  police_check: "Police Check",
  drivers_license: "Driver's License",
  other: "Other",
};

function expiryBadge(expiry: string | null) {
  if (!expiry) return <Badge variant="outline">No expiry</Badge>;
  const d = new Date(expiry);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return <Badge variant="destructive">Expired</Badge>;
  if (diff <= 30) return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">Expiring</Badge>;
  return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">Current</Badge>;
}

export function StaffComplianceTab({ staffId }: { staffId: string }) {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const [showAdd, setShowAdd] = useState(false);

  const { data: records = [] } = useQuery({
    queryKey: ["staff-compliance", staffId],
    queryFn: async () => {
      const { data } = await supabase.from("staff_compliance").select("*").eq("staff_id", staffId).order("expiry_date", { ascending: true });
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Check</Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Check Type</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No compliance checks.</TableCell></TableRow>
          ) : records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{CHECK_LABELS[r.check_type] || r.check_type}</TableCell>
              <TableCell>{r.issue_date || "—"}</TableCell>
              <TableCell>{r.expiry_date || "—"}</TableCell>
              <TableCell>{r.reference_number || "—"}</TableCell>
              <TableCell>
                {r.is_verified ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
              </TableCell>
              <TableCell>{expiryBadge(r.expiry_date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AddComplianceDialog open={showAdd} onOpenChange={setShowAdd} staffId={staffId} />
    </div>
  );
}
