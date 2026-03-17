import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffTable, type StaffWithProfile } from "@/components/staff/StaffTable";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { Plus, Search } from "lucide-react";

function computeComplianceStatus(
  checks: { staff_id: string; expiry_date: string | null }[],
  staffId: string
): "green" | "amber" | "red" | "none" {
  const staffChecks = checks.filter((c) => c.staff_id === staffId);
  if (staffChecks.length === 0) return "none";
  const now = new Date();
  let worst: "green" | "amber" | "red" = "green";
  for (const c of staffChecks) {
    if (!c.expiry_date) continue;
    const diff = (new Date(c.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "red";
    if (diff <= 30) worst = "amber";
  }
  return worst;
}

export default function Staff() {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [empFilter, setEmpFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const { data: staffRaw = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff")
        .select("id, position, employment_type, is_active, start_date, profile_id, notes, profiles(full_name, email)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: complianceChecks = [] } = useQuery({
    queryKey: ["staff-compliance-all"],
    queryFn: async () => {
      const { data } = await supabase.from("staff_compliance").select("staff_id, expiry_date");
      return data || [];
    },
  });

  const staff: StaffWithProfile[] = useMemo(() => {
    return staffRaw.map((s) => ({
      ...s,
      profiles: s.profiles as { full_name: string; email: string | null } | null,
      complianceStatus: computeComplianceStatus(complianceChecks, s.id),
    }));
  }, [staffRaw, complianceChecks]);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (statusFilter === "active" && !s.is_active) return false;
      if (statusFilter === "inactive" && s.is_active) return false;
      if (empFilter !== "all" && s.employment_type !== empFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = s.profiles?.full_name?.toLowerCase() || "";
        const email = s.profiles?.email?.toLowerCase() || "";
        const pos = s.position?.toLowerCase() || "";
        if (!name.includes(q) && !email.includes(q) && !pos.includes(q)) return false;
      }
      return true;
    });
  }, [staff, search, statusFilter, empFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Staff</h1>
        {canEdit && (
          <Button onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Staff Member</Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, email, position…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={empFilter} onValueChange={setEmpFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Employment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="part_time">Part Time</SelectItem>
            <SelectItem value="full_time">Full Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StaffTable staff={filtered} />
      <AddStaffDialog open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}
