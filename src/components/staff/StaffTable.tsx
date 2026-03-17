import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export interface StaffWithProfile {
  id: string;
  position: string | null;
  employment_type: string | null;
  is_active: boolean;
  start_date: string | null;
  profiles: { full_name: string; email: string | null } | null;
  complianceStatus: "green" | "amber" | "red" | "none";
}

const complianceBadge = (status: string) => {
  switch (status) {
    case "green":
      return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">Current</Badge>;
    case "amber":
      return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">Expiring</Badge>;
    case "red":
      return <Badge variant="destructive">Expired</Badge>;
    default:
      return <Badge variant="outline">No checks</Badge>;
  }
};

export function StaffTable({ staff }: { staff: StaffWithProfile[] }) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Employment</TableHead>
          <TableHead>Compliance</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No staff members found.
            </TableCell>
          </TableRow>
        ) : (
          staff.map((s) => (
            <TableRow
              key={s.id}
              className="cursor-pointer"
              onClick={() => navigate(`/staff/${s.id}`)}
            >
              <TableCell className="font-medium">
                {s.profiles?.full_name || "—"}
                {s.profiles?.email && (
                  <span className="block text-xs text-muted-foreground">{s.profiles.email}</span>
                )}
              </TableCell>
              <TableCell>{s.position || "—"}</TableCell>
              <TableCell className="capitalize">{s.employment_type?.replace("_", " ") || "—"}</TableCell>
              <TableCell>{complianceBadge(s.complianceStatus)}</TableCell>
              <TableCell>
                <Badge variant={s.is_active ? "default" : "secondary"}>
                  {s.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
