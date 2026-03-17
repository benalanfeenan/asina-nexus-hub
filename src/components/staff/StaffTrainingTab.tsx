import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { AddTrainingDialog } from "./AddTrainingDialog";
import { useAuth } from "@/contexts/AuthContext";

function expiryBadge(expiry: string | null) {
  if (!expiry) return <Badge variant="outline">No expiry</Badge>;
  const d = new Date(expiry);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return <Badge variant="destructive">Expired</Badge>;
  if (diff <= 30) return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">Expiring</Badge>;
  return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">Current</Badge>;
}

export function StaffTrainingTab({ staffId }: { staffId: string }) {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const [showAdd, setShowAdd] = useState(false);

  const { data: records = [] } = useQuery({
    queryKey: ["staff-training", staffId],
    queryFn: async () => {
      const { data } = await supabase.from("staff_training").select("*").eq("staff_id", staffId).order("expiry_date", { ascending: true });
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Training</Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Training</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No training records.</TableCell></TableRow>
          ) : records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.training_name}</TableCell>
              <TableCell>{r.provider || "—"}</TableCell>
              <TableCell>{r.completion_date || "—"}</TableCell>
              <TableCell>{r.expiry_date || "—"}</TableCell>
              <TableCell>{expiryBadge(r.expiry_date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AddTrainingDialog open={showAdd} onOpenChange={setShowAdd} staffId={staffId} />
    </div>
  );
}
