import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffTable, type StaffWithProfile } from "@/components/staff/StaffTable";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import {
  COMPLIANCE_ITEMS, DEFAULT_ROLE_FLAGS, calculateComplianceScore, type RoleFlags,
} from "@/lib/compliance-definitions";
import { useBatchHouseCompetencyFlags } from "@/hooks/use-merged-role-flags";

function computeComplianceFromItems(
  items: { staff_id: string; item_key: string; status: string; expiry_date: string | null }[],
  allFlags: { staff_id: string; [key: string]: any }[],
  staffId: string,
  getMergedFlags?: (staffId: string, personalFlags: RoleFlags) => RoleFlags,
): { status: "green" | "amber" | "red" | "none"; score: number } {
  const staffItems = items.filter((i) => i.staff_id === staffId);
  const flagRow = allFlags.find((f) => f.staff_id === staffId);
  const flags: RoleFlags = flagRow
    ? {
        administers_medication: flagRow.administers_medication,
        supports_mealtime_assessed: flagRow.supports_mealtime_assessed,
        supports_bsp_participants: flagRow.supports_bsp_participants,
        delivers_high_intensity: flagRow.delivers_high_intensity,
        uses_restrictive_practices: flagRow.uses_restrictive_practices,
        transports_in_own_vehicle: flagRow.transports_in_own_vehicle,
      }
    : DEFAULT_ROLE_FLAGS;

  const mergedFlags = getMergedFlags ? getMergedFlags(staffId, flags) : flags;

  const map = new Map<string, { status: string; expiry_date: string | null }>();
  staffItems.forEach((i) => map.set(i.item_key, i));
  const score = calculateComplianceScore(COMPLIANCE_ITEMS, map, mergedFlags);

  if (staffItems.length === 0) return { status: "none", score: 0 };
  if (score === 100) return { status: "green", score };
  if (score >= 80) return { status: "amber", score };
  return { status: "red", score };
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
        .select("id, position, employment_type, is_active, start_date, profile_id, notes, first_name, last_name, phone, profiles(full_name, email)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: complianceItems = [] } = useQuery({
    queryKey: ["staff-compliance-items-all"],
    queryFn: async () => {
      const { data } = await supabase.from("staff_compliance_items").select("staff_id, item_key, status, expiry_date");
      return data || [];
    },
  });

  const { data: allFlags = [] } = useQuery({
    queryKey: ["staff-role-flags-all"],
    queryFn: async () => {
      const { data } = await supabase.from("staff_role_flags").select("*");
      return data || [];
    },
  });

  const getMergedFlags = useBatchHouseCompetencyFlags();

  const staff: StaffWithProfile[] = useMemo(() => {
    return staffRaw.map((s) => {
      const { status, score } = computeComplianceFromItems(complianceItems, allFlags, s.id, getMergedFlags);
      return {
        ...s,
        profiles: s.profiles as { full_name: string; email: string | null } | null,
        complianceStatus: status,
        complianceScore: score,
      };
    });
  }, [staffRaw, complianceItems, allFlags, getMergedFlags]);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (statusFilter === "active" && !s.is_active) return false;
      if (statusFilter === "inactive" && s.is_active) return false;
      if (empFilter !== "all" && s.employment_type !== empFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = [s.first_name, s.last_name].filter(Boolean).join(" ").toLowerCase() || s.profiles?.full_name?.toLowerCase() || "";
        const email = s.profiles?.email?.toLowerCase() || "";
        const pos = s.position?.toLowerCase() || "";
        if (!name.includes(q) && !email.includes(q) && !pos.includes(q)) return false;
      }
      return true;
    });
  }, [staff, search, statusFilter, empFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        action={canEdit ? (
          <Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Staff Member</Button>
        ) : undefined}
      />

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
