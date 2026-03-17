import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, FileText, UtensilsCrossed, Shield, Zap, Pill, Hand, Globe } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  ndis_number: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  alerts: Json;
  email: string | null;
  photo_url: string | null;
  client_portal_enabled: boolean;
  sil_houses: { name: string } | null;
}

interface Props {
  participants: Participant[];
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function AlertIcons({ alerts }: { alerts: Json }) {
  if (!alerts || typeof alerts !== "object" || Array.isArray(alerts)) return null;
  const a = alerts as Record<string, boolean>;
  return (
    <div className="flex gap-1 flex-wrap">
      {a.allergies && <span title="Allergies"><AlertTriangle className="h-4 w-4 text-destructive" /></span>}
      {a.bsp && <span title="BSP"><FileText className="h-4 w-4 text-primary" /></span>}
      {a.mealtime_plan && <span title="Mealtime Plan"><UtensilsCrossed className="h-4 w-4 text-accent-foreground" /></span>}
      {a.restrictive_practices && <span title="Restrictive Practices"><Shield className="h-4 w-4 text-destructive" /></span>}
      {a.high_intensity && <span title="High Intensity"><Zap className="h-4 w-4 text-amber-600" /></span>}
      {a.medications && <span title="Medications"><Pill className="h-4 w-4 text-primary" /></span>}
      {a.manual_handling && <span title="Manual Handling"><Hand className="h-4 w-4 text-accent-foreground" /></span>}
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
          <TableHead>Client Portal</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((p) => (
          <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/participants/${p.id}`)}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {p.photo_url && <AvatarImage src={p.photo_url} alt={`${p.first_name} ${p.last_name}`} />}
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {getInitials(p.first_name, p.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium">{p.first_name} {p.last_name}</span>
                  {p.email && <span className="block text-xs text-muted-foreground">{p.email}</span>}
                </div>
              </div>
            </TableCell>
            <TableCell>{p.ndis_number || "—"}</TableCell>
            <TableCell>{(p.sil_houses as any)?.name || "—"}</TableCell>
            <TableCell>{p.date_of_birth || "—"}</TableCell>
            <TableCell><AlertIcons alerts={p.alerts} /></TableCell>
            <TableCell>
              {p.client_portal_enabled ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15 gap-1">
                  <Globe className="h-3 w-3" />On
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  <Globe className="h-3 w-3" />Off
                </Badge>
              )}
            </TableCell>
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
