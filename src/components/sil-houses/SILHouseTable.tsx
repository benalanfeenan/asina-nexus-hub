import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  houses: Tables<"sil_houses">[];
  participantCounts: Record<string, number>;
}

export function SILHouseTable({ houses, participantCounts }: Props) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Capacity</TableHead>
          <TableHead>Participants</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {houses.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No SIL houses found.</TableCell>
          </TableRow>
        ) : (
          houses.map((h) => (
            <TableRow key={h.id} className="cursor-pointer" onClick={() => navigate(`/sil-houses/${h.id}`)}>
              <TableCell className="font-medium">{h.name}</TableCell>
              <TableCell>{h.address || "—"}</TableCell>
              <TableCell>{h.capacity || 0}</TableCell>
              <TableCell>{participantCounts[h.id] || 0} / {h.capacity || 0}</TableCell>
              <TableCell>
                <Badge variant={h.is_active ? "default" : "secondary"}>{h.is_active ? "Active" : "Inactive"}</Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
