import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SILHouseTable } from "@/components/sil-houses/SILHouseTable";
import { AddSILHouseDialog } from "@/components/sil-houses/AddSILHouseDialog";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default function SILHouses() {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const { data: houses = [] } = useQuery({
    queryKey: ["sil-houses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sil_houses")
        .select("*")
        .order("name");
      return data || [];
    },
  });

  const { data: participantCounts = [] } = useQuery({
    queryKey: ["sil-house-participant-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sil_house_participants")
        .select("sil_house_id")
        .eq("is_current", true);
      return data || [];
    },
  });

  const countsMap = useMemo(() => {
    const map: Record<string, number> = {};
    participantCounts.forEach((p) => {
      map[p.sil_house_id] = (map[p.sil_house_id] || 0) + 1;
    });
    return map;
  }, [participantCounts]);

  const filtered = useMemo(() => {
    return houses.filter((h) => {
      if (statusFilter === "active" && !h.is_active) return false;
      if (statusFilter === "inactive" && h.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!h.name.toLowerCase().includes(q) && !(h.address || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [houses, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">SIL Houses</h1>
        {canEdit && (
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="mr-1 h-4 w-4" />Add SIL House
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or address…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SILHouseTable houses={filtered} participantCounts={countsMap} />
      <AddSILHouseDialog open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}
