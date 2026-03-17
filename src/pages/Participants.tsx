import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ParticipantTable } from "@/components/participants/ParticipantTable";
import { AddParticipantDialog } from "@/components/participants/AddParticipantDialog";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default function Participants() {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [houseFilter, setHouseFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const { data: participants = [] } = useQuery({
    queryKey: ["participants"],
    queryFn: async () => {
      const { data } = await supabase
        .from("participants")
        .select("*, sil_houses(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: silHouses = [] } = useQuery({
    queryKey: ["sil-houses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      if (houseFilter !== "all" && p.sil_house_id !== houseFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = `${p.first_name} ${p.last_name}`.toLowerCase();
        const ndis = p.ndis_number?.toLowerCase() || "";
        const email = p.email?.toLowerCase() || "";
        if (!name.includes(q) && !ndis.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [participants, search, statusFilter, houseFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participants"
        action={canEdit ? (
          <Button variant="accent" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1 h-4 w-4" />Add Participant
          </Button>
        ) : undefined}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, NDIS number, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={houseFilter} onValueChange={setHouseFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="SIL House" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Houses</SelectItem>
            {silHouses.map((h) => (
              <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ParticipantTable participants={filtered} />
      <AddParticipantDialog open={showAdd} onOpenChange={setShowAdd} silHouses={silHouses} />
    </div>
  );
}
