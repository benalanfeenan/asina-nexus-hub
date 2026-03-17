import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  identified: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  assessed: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  controlled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  eliminated: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const riskColors: Record<string, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

export default function Hazards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [silHouse, setSilHouse] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [controls, setControls] = useState("");

  const { data: hazards = [] } = useQuery({
    queryKey: ["hazards"],
    queryFn: async () => {
      const { data } = await supabase.from("hazards").select("*, sil_houses(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["sil-houses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name").eq("is_active", true);
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("hazards").insert({
        description: desc,
        location: location || null,
        sil_house_id: silHouse || null,
        risk_level: riskLevel,
        control_measures: controls || null,
        reported_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hazards"] });
      setShowAdd(false);
      setDesc(""); setLocation(""); setSilHouse(""); setRiskLevel("medium"); setControls("");
      toast({ title: "Hazard reported" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "eliminated") updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("hazards").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hazards"] });
      toast({ title: "Hazard updated" });
    },
  });

  const filtered = useMemo(() => {
    return hazards.filter((h: any) => {
      if (statusFilter !== "all" && h.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!h.description.toLowerCase().includes(q) && !(h.location || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [hazards, search, statusFilter]);

  const nextStatus: Record<string, string> = { identified: "assessed", assessed: "controlled", controlled: "eliminated" };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hazards"
        action={<Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Report Hazard</Button>}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["identified", "assessed", "controlled", "eliminated"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Description</TableHead><TableHead>Location</TableHead><TableHead>House</TableHead>
            <TableHead>Risk</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hazards found</TableCell></TableRow>
            ) : filtered.map((h: any) => (
              <TableRow key={h.id}>
                <TableCell className="max-w-[300px] truncate">{h.description}</TableCell>
                <TableCell>{h.location || "—"}</TableCell>
                <TableCell>{(h.sil_houses as any)?.name || "—"}</TableCell>
                <TableCell><Badge variant="secondary" className={riskColors[h.risk_level] || ""}>{h.risk_level}</Badge></TableCell>
                <TableCell><Badge variant="secondary" className={statusColors[h.status] || ""}>{h.status}</Badge></TableCell>
                <TableCell>{format(new Date(h.created_at), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  {nextStatus[h.status] && (
                    <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: h.id, status: nextStatus[h.status] })}>
                      → {nextStatus[h.status]}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report Hazard</DialogTitle><DialogDescription>Report a new workplace hazard</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
              <div className="grid gap-2">
                <Label>SIL House</Label>
                <Select value={silHouse} onValueChange={setSilHouse}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{houses.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Risk Level</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["low", "medium", "high", "critical"].map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Control Measures</Label><Textarea value={controls} onChange={(e) => setControls(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!desc}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
