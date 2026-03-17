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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";

const practiceTypes = ["chemical", "mechanical", "physical", "seclusion", "environmental"] as const;

const typeColors: Record<string, string> = {
  chemical: "bg-purple-100 text-purple-800", mechanical: "bg-blue-100 text-blue-800",
  physical: "bg-red-100 text-red-800", seclusion: "bg-orange-100 text-orange-800",
  environmental: "bg-green-100 text-green-800",
};

export default function RestrictivePractices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const [participantId, setParticipantId] = useState("");
  const [practiceType, setPracticeType] = useState<string>("physical");
  const [desc, setDesc] = useState("");
  const [antecedent, setAntecedent] = useState("");
  const [duration, setDuration] = useState("");
  const [outcome, setOutcome] = useState("");
  const [isAuthorised, setIsAuthorised] = useState(false);
  const [authorisedBy, setAuthorisedBy] = useState("");

  const { data: records = [] } = useQuery({
    queryKey: ["restrictive-practices"],
    queryFn: async () => {
      const { data } = await supabase.from("restrictive_practices")
        .select("*, participants(first_name, last_name)")
        .order("date_occurred", { ascending: false });
      return data || [];
    },
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["participants-list"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name").eq("is_active", true);
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("restrictive_practices").insert({
        participant_id: participantId,
        practice_type: practiceType as any,
        description: desc,
        antecedent: antecedent || null,
        duration_minutes: duration ? Number(duration) : null,
        outcome: outcome || null,
        is_authorised: isAuthorised,
        authorised_by: isAuthorised ? authorisedBy || null : null,
        reported_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restrictive-practices"] });
      setShowAdd(false);
      setParticipantId(""); setPracticeType("physical"); setDesc(""); setAntecedent("");
      setDuration(""); setOutcome(""); setIsAuthorised(false); setAuthorisedBy("");
      toast({ title: "Record added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return records.filter((r: any) => {
      if (typeFilter !== "all" && r.practice_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = `${(r.participants as any)?.first_name} ${(r.participants as any)?.last_name}`.toLowerCase();
        if (!name.includes(q) && !r.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, search, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Restrictive Practices</h1>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Record Practice</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {practiceTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Participant</TableHead><TableHead>Type</TableHead>
            <TableHead>Duration</TableHead><TableHead>Authorised</TableHead><TableHead>Description</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
            ) : filtered.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{format(new Date(r.date_occurred), "dd/MM/yyyy HH:mm")}</TableCell>
                <TableCell className="font-medium">{(r.participants as any)?.first_name} {(r.participants as any)?.last_name}</TableCell>
                <TableCell><Badge variant="secondary" className={typeColors[r.practice_type] || ""}>{r.practice_type}</Badge></TableCell>
                <TableCell>{r.duration_minutes ? `${r.duration_minutes}m` : "—"}</TableCell>
                <TableCell>{r.is_authorised ? <Badge variant="secondary" className="bg-green-100 text-green-800">Yes</Badge> : <Badge variant="secondary" className="bg-red-100 text-red-800">No</Badge>}</TableCell>
                <TableCell className="max-w-[300px] truncate">{r.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Restrictive Practice</DialogTitle><DialogDescription>Document the use of a restrictive practice</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>Participant</Label>
              <Select value={participantId} onValueChange={setParticipantId}>
                <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                <SelectContent>{participants.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={practiceType} onValueChange={setPracticeType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{practiceTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Duration (mins)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
            </div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Antecedent</Label><Textarea value={antecedent} onChange={(e) => setAntecedent(e.target.value)} placeholder="What happened before?" /></div>
            <div className="grid gap-2"><Label>Outcome</Label><Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <Checkbox checked={isAuthorised} onCheckedChange={(v) => setIsAuthorised(!!v)} />
              <Label>Authorised practice</Label>
            </div>
            {isAuthorised && <div className="grid gap-2"><Label>Authorised By</Label><Input value={authorisedBy} onChange={(e) => setAuthorisedBy(e.target.value)} /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!participantId || !desc}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
