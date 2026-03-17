import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AddIncidentDialog } from "@/components/incidents/AddIncidentDialog";
import { IncidentDetailDialog } from "@/components/incidents/IncidentDetailDialog";

const severityColors: Record<string, string> = {
  low: "bg-blue-500/15 text-blue-700 border-blue-200",
  medium: "bg-amber-500/15 text-amber-700 border-amber-200",
  high: "bg-orange-500/15 text-orange-700 border-orange-200",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Incidents() {
  const { role } = useAuth();
  const canCreate = role === "admin" || role === "house_manager" || role === "support_worker";
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  const { data: incidents = [] } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("incidents")
        .select("*, participants(first_name, last_name), sil_houses(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
      if (statusFilter !== "all" && inc.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!inc.reference_number.toLowerCase().includes(q) && !inc.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [incidents, search, severityFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        action={canCreate ? (
          <Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Report Incident</Button>
        ) : undefined}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by reference or title…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Participant</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Reportable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No incidents found.</TableCell></TableRow>
          ) : (
            filtered.map((inc) => {
              const p = inc.participants as any;
              return (
                <TableRow key={inc.id} className="cursor-pointer" onClick={() => setSelectedIncident(inc)}>
                  <TableCell className="font-mono text-xs">{inc.reference_number}</TableCell>
                  <TableCell className="font-medium">{inc.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={severityColors[inc.severity] || ""}>{inc.severity}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{inc.status}</TableCell>
                  <TableCell>{p ? `${p.first_name} ${p.last_name}` : "—"}</TableCell>
                  <TableCell>{new Date(inc.date_occurred).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {inc.is_reportable && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <AddIncidentDialog open={showAdd} onOpenChange={setShowAdd} />
      <IncidentDetailDialog incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
    </div>
  );
}
