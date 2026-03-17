import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AddProgressNoteDialog } from "@/components/progress-notes/AddProgressNoteDialog";

export default function ProgressNotes() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [participantFilter, setParticipantFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const { data: notes = [] } = useQuery({
    queryKey: ["progress-notes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("progress_notes")
        .select("*, participants(first_name, last_name), staff(profiles(full_name))")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["participants-select"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name").eq("is_active", true).order("first_name");
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (participantFilter !== "all" && n.participant_id !== participantFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const pName = `${(n.participants as any)?.first_name || ""} ${(n.participants as any)?.last_name || ""}`.toLowerCase();
        const staffName = ((n.staff as any)?.profiles?.full_name || "").toLowerCase();
        if (!pName.includes(q) && !staffName.includes(q) && !n.content.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [notes, search, participantFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Progress Notes</h1>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Note</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={participantFilter} onValueChange={setParticipantFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Participant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Participants</SelectItem>
            {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Participant</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead>Concerns</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No progress notes found.</TableCell></TableRow>
          ) : (
            filtered.map((n) => {
              const p = n.participants as any;
              const s = n.staff as any;
              return (
                <TableRow key={n.id}>
                  <TableCell>{new Date(n.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{p ? `${p.first_name} ${p.last_name}` : "—"}</TableCell>
                  <TableCell>{s?.profiles?.full_name || "—"}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{n.content}</TableCell>
                  <TableCell>
                    {n.concerns_flagged && (
                      <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Flagged</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <AddProgressNoteDialog open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}
