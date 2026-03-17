import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Eye, MoreHorizontal, Archive, ArchiveRestore } from "lucide-react";

export interface StaffWithProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  employment_type: string | null;
  is_active: boolean;
  start_date: string | null;
  profiles: { full_name: string; email: string | null } | null;
  complianceStatus: "green" | "amber" | "red" | "none";
  complianceScore?: number;
}

function getDisplayName(s: StaffWithProfile): string {
  if (s.first_name || s.last_name) {
    return [s.first_name, s.last_name].filter(Boolean).join(" ");
  }
  return s.profiles?.full_name || "Unknown";
}

const complianceBadge = (status: string, score?: number) => {
  const scoreText = score !== undefined ? ` (${score}%)` : "";
  switch (status) {
    case "green":
      return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">Current{scoreText}</Badge>;
    case "amber":
      return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">Expiring{scoreText}</Badge>;
    case "red":
      return <Badge variant="destructive">Expired{scoreText}</Badge>;
    default:
      return <Badge variant="outline">No checks</Badge>;
  }
};

interface StaffTableProps {
  staff: StaffWithProfile[];
  canEdit?: boolean;
  onToggleActive?: (id: string, currentlyActive: boolean) => void;
}

export function StaffTable({ staff, canEdit, onToggleActive }: StaffTableProps) {
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
          {canEdit && <TableHead className="w-[60px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.length === 0 ? (
          <TableRow>
            <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground py-8">
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
                {getDisplayName(s)}
                {s.profiles?.email && (
                  <span className="block text-xs text-muted-foreground">{s.profiles.email}</span>
                )}
              </TableCell>
              <TableCell>{s.position || "—"}</TableCell>
              <TableCell className="capitalize">{s.employment_type?.replace("_", " ") || "—"}</TableCell>
              <TableCell>{complianceBadge(s.complianceStatus, s.complianceScore)}</TableCell>
              <TableCell>
                <Badge variant={s.is_active ? "default" : "secondary"}>
                  {s.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              {canEdit && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => navigate(`/staff/${s.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />View / Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onToggleActive?.(s.id, s.is_active)}>
                        {s.is_active ? <Archive className="mr-2 h-4 w-4" /> : <ArchiveRestore className="mr-2 h-4 w-4" />}
                        {s.is_active ? "Archive" : "Reactivate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete?.(s.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
