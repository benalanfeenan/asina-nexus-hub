import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { AlertTriangle, XCircle, Download, CheckCircle2 } from "lucide-react";
import {
  COMPLIANCE_ITEMS, DEFAULT_ROLE_FLAGS, calculateComplianceScore,
  getItemStatus, isItemApplicable, type RoleFlags,
} from "@/lib/compliance-definitions";

const DASHBOARD_COLUMNS = [
  "ndis_wsc", "wwcc", "first_aid", "cpr", "ndis_orientation",
  "code_of_conduct", "induction_checklist", "manual_handling",
  "infection_control", "fire_safety", "medication_training",
  "mealtime_training", "bsp_training", "supervision_records", "performance_review",
];

const SHORT_LABELS: Record<string, string> = {
  ndis_wsc: "WSC", wwcc: "WWCC", first_aid: "First Aid", cpr: "CPR",
  ndis_orientation: "Orientation", code_of_conduct: "CoC", induction_checklist: "Induction",
  manual_handling: "Man. Handling", infection_control: "Infection", fire_safety: "Fire Safety",
  medication_training: "Medication", mealtime_training: "Mealtime", bsp_training: "BSP",
  supervision_records: "Supervision", performance_review: "Perf Review",
};

const ragDot = (status: string) => {
  switch (status) {
    case "completed": return <div className="h-3 w-3 rounded-full bg-emerald-500 mx-auto" />;
    case "expiring_soon": return <div className="h-3 w-3 rounded-full bg-amber-500 mx-auto" />;
    case "expired": return <div className="h-3 w-3 rounded-full bg-destructive mx-auto" />;
    case "in_progress": return <div className="h-3 w-3 rounded-full bg-blue-500 mx-auto" />;
    case "not_applicable": return <div className="h-3 w-3 rounded-full bg-muted mx-auto" />;
    default: return <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 mx-auto" />;
  }
};

export default function ComplianceDashboard() {
  const [search, setSearch] = useState("");
  const [filterIssues, setFilterIssues] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-compliance-dash"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, first_name, last_name, position, employment_type, is_active, profiles(full_name)").eq("is_active", true);
      return data || [];
    },
  });

  const { data: complianceItems = [] } = useQuery({
    queryKey: ["all-compliance-items"],
    queryFn: async () => {
      const { data } = await supabase.from("staff_compliance_items").select("*");
      return data || [];
    },
  });

  const { data: allFlags = [] } = useQuery({
    queryKey: ["all-role-flags"],
    queryFn: async () => {
      const { data } = await supabase.from("staff_role_flags").select("*");
      return data || [];
    },
  });

  const staffRows = useMemo(() => {
    return staff.map((s: any) => {
      const items = complianceItems.filter((c: any) => c.staff_id === s.id);
      const flagRow = allFlags.find((f: any) => f.staff_id === s.id);
      const flags: RoleFlags = flagRow
        ? {
            administers_medication: flagRow.administers_medication,
            supports_mealtime_assessed: flagRow.supports_mealtime_assessed,
            supports_bsp_participants: flagRow.supports_bsp_participants,
            delivers_high_intensity: flagRow.delivers_high_intensity,
            uses_restrictive_practices: flagRow.uses_restrictive_practices,
            transports_participants: flagRow.transports_participants,
            supports_under_18: flagRow.supports_under_18,
          }
        : DEFAULT_ROLE_FLAGS;

      const map = new Map<string, any>();
      items.forEach((i: any) => map.set(i.item_key, i));
      const score = calculateComplianceScore(COMPLIANCE_ITEMS, map, flags);

      const colStatuses: Record<string, string> = {};
      for (const key of DASHBOARD_COLUMNS) {
        const def = COMPLIANCE_ITEMS.find((d) => d.item_key === key);
        if (!def) { colStatuses[key] = "not_started"; continue; }
        colStatuses[key] = getItemStatus(def, map.get(key), flags);
      }

      const name = s.first_name || s.last_name
        ? [s.first_name, s.last_name].filter(Boolean).join(" ")
        : (s.profiles as any)?.full_name || "Unknown";

      return { ...s, name, score, colStatuses, flags };
    });
  }, [staff, complianceItems, allFlags]);

  // Alerts
  const alerts = useMemo(() => {
    const result: { type: "red" | "amber"; message: string }[] = [];
    const itemAlerts: Record<string, { expired: string[]; expiring: string[] }> = {};

    for (const def of COMPLIANCE_ITEMS) {
      itemAlerts[def.item_key] = { expired: [], expiring: [] };
    }

    for (const row of staffRows) {
      for (const def of COMPLIANCE_ITEMS) {
        if (!isItemApplicable(def, row.flags)) continue;
        const status = row.colStatuses[def.item_key];
        if (status === "expired") itemAlerts[def.item_key]?.expired.push(row.name);
        if (status === "expiring_soon") itemAlerts[def.item_key]?.expiring.push(row.name);
      }
    }

    for (const def of COMPLIANCE_ITEMS) {
      const a = itemAlerts[def.item_key];
      if (a?.expired.length > 0) {
        result.push({ type: "red", message: `${a.expired.length} staff have expired ${def.name}` });
      }
      if (a?.expiring.length > 0) {
        result.push({ type: "amber", message: `${a.expiring.length} staff have ${def.name} expiring within 30 days` });
      }
    }

    return result;
  }, [staffRows]);

  // Filter & sort
  const filteredRows = useMemo(() => {
    let rows = [...staffRows];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.position?.toLowerCase().includes(q));
    }
    if (filterIssues === "issues") {
      rows = rows.filter((r) => r.score < 100);
    }
    rows.sort((a, b) => {
      if (sortBy === "score") return a.score - b.score;
      return a.name.localeCompare(b.name);
    });
    return rows;
  }, [staffRows, search, filterIssues, sortBy]);

  // CSV Export
  const exportCSV = () => {
    const headers = ["Name", "Position", "Score", ...DASHBOARD_COLUMNS.map((k) => SHORT_LABELS[k] || k)];
    const csvRows = [headers.join(",")];
    for (const row of filteredRows) {
      csvRows.push([
        `"${row.name}"`,
        `"${row.position || ""}"`,
        row.score,
        ...DASHBOARD_COLUMNS.map((k) => row.colStatuses[k]),
      ].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compliance-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalNonCompliant = staffRows.reduce((sum, r) => {
    const applicable = COMPLIANCE_ITEMS.filter((i) => i.is_mandatory && isItemApplicable(i, r.flags));
    const map = new Map<string, any>();
    complianceItems.filter((c: any) => c.staff_id === r.id).forEach((c: any) => map.set(c.item_key, c));
    const nonCompliant = applicable.filter((i) => {
      const s = getItemStatus(i, map.get(i.item_key), r.flags);
      return s !== "completed" && s !== "not_applicable";
    });
    return sum + nonCompliant.length;
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance Dashboard" />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{staff.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Compliance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{staffRows.length ? Math.round(staffRows.reduce((s, r) => s + r.score, 0) / staffRows.length) : 0}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">100% Compliant</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">{staffRows.filter((r) => r.score === 100).length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Gaps</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{totalNonCompliant}</p></CardContent></Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
            {alerts.slice(0, 20).map((a, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded-md ${a.type === "red" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700"}`}>
                {a.type === "red" ? <XCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                {a.message}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters & Export */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Input placeholder="Search staff…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterIssues} onValueChange={setFilterIssues}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            <SelectItem value="issues">Issues Only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Sort by Score</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" />CSV
        </Button>
      </div>

      {/* Matrix Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10">Staff</TableHead>
              <TableHead className="text-center text-xs">Score</TableHead>
              {DASHBOARD_COLUMNS.map((k) => (
                <TableHead key={k} className="text-center text-xs whitespace-nowrap">{SHORT_LABELS[k] || k}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow><TableCell colSpan={DASHBOARD_COLUMNS.length + 2} className="text-center text-muted-foreground py-8">No staff data</TableCell></TableRow>
            ) : filteredRows.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium sticky left-0 bg-background">
                  {s.name}
                  {s.position && <span className="block text-xs text-muted-foreground">{s.position}</span>}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={s.score === 100 ? "default" : s.score >= 80 ? "secondary" : "destructive"} className="text-xs">
                    {s.score}%
                  </Badge>
                </TableCell>
                {DASHBOARD_COLUMNS.map((k) => (
                  <TableCell key={k} className="text-center">
                    {ragDot(s.colStatuses[k])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-emerald-500" /> Completed</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-amber-500" /> Expiring</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-destructive" /> Expired</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-blue-500" /> In Progress</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30" /> Not Started</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-muted" /> N/A</div>
      </div>
    </div>
  );
}
