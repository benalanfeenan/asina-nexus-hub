import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { type RoleFlags, DEFAULT_ROLE_FLAGS } from "@/lib/compliance-definitions";

/**
 * Fetches the houses a staff member is linked to, then fetches
 * sil_house_competency_requirements for those houses, and merges (OR)
 * them with the staff member's personal role flags.
 */
export function useMergedRoleFlags(staffId: string, personalFlags: RoleFlags): RoleFlags {
  const { data: houseLinks = [] } = useQuery({
    queryKey: ["staff-house-links", staffId],
    queryFn: async () => {
      const { data } = await supabase
        .from("sil_house_staff")
        .select("sil_house_id")
        .eq("staff_id", staffId);
      return data || [];
    },
    enabled: !!staffId,
  });

  const houseIds = useMemo(() => houseLinks.map((h: any) => h.sil_house_id), [houseLinks]);

  const { data: houseReqs = [] } = useQuery({
    queryKey: ["house-competency-reqs", houseIds],
    queryFn: async () => {
      if (houseIds.length === 0) return [];
      const { data } = await supabase
        .from("sil_house_competency_requirements")
        .select("*")
        .in("sil_house_id", houseIds);
      return data || [];
    },
    enabled: houseIds.length > 0,
  });

  return useMemo(() => {
    const merged = { ...personalFlags };
    for (const req of houseReqs) {
      if (req.administers_medication) merged.administers_medication = true;
      if (req.supports_mealtime_assessed) merged.supports_mealtime_assessed = true;
      if (req.supports_bsp_participants) merged.supports_bsp_participants = true;
      if (req.delivers_high_intensity) merged.delivers_high_intensity = true;
      if (req.uses_restrictive_practices) merged.uses_restrictive_practices = true;
    }
    return merged;
  }, [personalFlags, houseReqs]);
}

/**
 * Batch version: merge house flags for multiple staff members at once.
 * Used in Staff list and ComplianceDashboard.
 */
export function useBatchHouseCompetencyFlags() {
  const { data: allHouseStaff = [] } = useQuery({
    queryKey: ["all-house-staff-links"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_house_staff").select("staff_id, sil_house_id");
      return data || [];
    },
  });

  const { data: allHouseReqs = [] } = useQuery({
    queryKey: ["all-house-competency-reqs"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_house_competency_requirements").select("*");
      return data || [];
    },
  });

  /** Returns merged flags for a given staff member */
  const getMergedFlags = useMemo(() => {
    const reqMap = new Map<string, any>();
    for (const r of allHouseReqs) reqMap.set(r.sil_house_id, r);

    return (staffId: string, personalFlags: RoleFlags): RoleFlags => {
      const houses = allHouseStaff.filter((h: any) => h.staff_id === staffId);
      const merged = { ...personalFlags };
      for (const h of houses) {
        const req = reqMap.get(h.sil_house_id);
        if (!req) continue;
        if (req.administers_medication) merged.administers_medication = true;
        if (req.supports_mealtime_assessed) merged.supports_mealtime_assessed = true;
        if (req.supports_bsp_participants) merged.supports_bsp_participants = true;
        if (req.delivers_high_intensity) merged.delivers_high_intensity = true;
        if (req.uses_restrictive_practices) merged.uses_restrictive_practices = true;
      }
      return merged;
    };
  }, [allHouseStaff, allHouseReqs]);

  return getMergedFlags;
}
