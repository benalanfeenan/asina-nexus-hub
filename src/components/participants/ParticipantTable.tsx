import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, UtensilsCrossed } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  ndis_number: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  alerts: Json;
  sil_houses: { name: string } | null;
}

interface Props {
  participants: Participant[];
}

function AlertIcons({ alerts }: { alerts: Json }) {
  if (!alerts || typeof alerts !== "object" || Array.isArray(alerts)) return null;
  const a = alerts as Record<string, boolean>;
  return (
    <div className="flex gap-1">
      {a.allergies && <span title="Allergies"><AlertTriangle className="h-4 w-4 text-destructive" /></span>}
      {a.bsp && <span title="BSP"><FileText className="h-4 w-4 text-primary" /></span>}
      {a.mealtime_plan && <span title="Mealtime Plan"><UtensilsCrossed className="h-4 w-4 text-accent-foreground" /></span>}
    </div>
  );
}

export function ParticipantTable({ participants }: Props) {
  const navigate = useNavigate();

  if (participants.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No participants found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>NDIS Number</TableHead>
          <TableHead>SIL House</TableHead>
          <TableHead>Date of Birth</TableHead>
          <TableHead>Alerts</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((p) => (
          <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/participants/${p.id}`)}>
            <TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell>
            <TableCell>{p.ndis_number || "—"}</TableCell>
            <TableCell>{(p.sil_houses as any)?.name || "—"}</TableCell>
            <TableCell>{p.date_of_birth || "—"}</TableCell>
            <TableCell><AlertIcons alerts={p.alerts} /></TableCell>
            <TableCell>
              <Badge variant={p.is_active ? "default" : "secondary"}>
                {p.is_active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
