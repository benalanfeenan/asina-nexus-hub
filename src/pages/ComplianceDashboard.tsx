import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo } from "react";

function getCheckStatus(expiryDate: string | null): "green" | "amber" | "red" | "none" {
  if (!expiryDate) return "none";
  const diff = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "red";
  if (diff <= 30) return "amber";
  return "green";
}

const checkLabels: Record<string, string> = {
  ndis_wsc: "NDIS WSC", wwcc: "WWCC", first_aid: "First Aid", cpr: "CPR",
  police_check: "Police Check", drivers_license: "Driver's Licence", other: "Other",
};

const ragColors = { green: "bg-green-500", amber: "bg-yellow-500", red: "bg-red-500", none: "bg-muted" };

export default function ComplianceDashboard() {
  const { data: staff = [] } = useQuery({
    queryKey: ["staff-compliance-dash"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, is_active, profiles(full_name)").eq("is_active", true);
      return data || [];
    },
  });

  const { data: compliance = [] } = useQuery({
    queryKey: ["all-compliance"],
    queryFn: async () => {
      const { data } = await supabase.from("staff_compliance").select("*");
      return data || [];
    },
  });

  const { data: training = [] } = useQuery({
    queryKey: ["all-training"],
    queryFn: async () => {
      const { data } = await supabase.from("staff_training").select("*");
      return data || [];
    },
  });

  const checkTypes = Object.keys(checkLabels);

  const staffRows = useMemo(() => {
    return staff.map((s: any) => {
      const checks = compliance.filter((c: any) => c.staff_id === s.id);
      const statusMap: Record<string, "green" | "amber" | "red" | "none"> = {};
      for (const ct of checkTypes) {
        const check = checks.find((c: any) => c.check_type === ct);
        statusMap[ct] = check ? getCheckStatus(check.expiry_date) : "none";
      }
      const trainingCount = training.filter((t: any) => t.staff_id === s.id && t.status === "completed").length;
      return { ...s, statusMap, trainingCount };
    });
  }, [staff, compliance, training]);

  const expiredCount = compliance.filter((c: any) => getCheckStatus(c.expiry_date) === "red").length;
  const expiringCount = compliance.filter((c: any) => getCheckStatus(c.expiry_date) === "amber").length;
  const missingCount = staff.length * checkTypes.length - compliance.length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold">Compliance Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{staff.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Expired Checks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{expiredCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Expiring (30 days)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{expiringCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Missing Checks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-600">{missingCount > 0 ? missingCount : 0}</p></CardContent></Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              {checkTypes.map((ct) => <TableHead key={ct} className="text-center text-xs">{checkLabels[ct]}</TableHead>)}
              <TableHead className="text-center">Training</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffRows.length === 0 ? (
              <TableRow><TableCell colSpan={checkTypes.length + 2} className="text-center text-muted-foreground py-8">No staff data</TableCell></TableRow>
            ) : staffRows.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{(s.profiles as any)?.full_name || "—"}</TableCell>
                {checkTypes.map((ct) => (
                  <TableCell key={ct} className="text-center">
                    <div className={`h-3 w-3 rounded-full mx-auto ${ragColors[s.statusMap[ct]]}`} />
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Badge variant="secondary">{s.trainingCount}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-green-500" /> Valid</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-yellow-500" /> Expiring soon</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-red-500" /> Expired</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-muted" /> Missing</div>
      </div>
    </div>
  );
}
