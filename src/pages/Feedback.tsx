import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, ThumbsUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";

const typeColors: Record<string, string> = {
  compliment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  suggestion: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  general: "bg-muted text-muted-foreground",
};

export default function Feedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [type, setType] = useState("compliment");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");

  const { data: feedback = [] } = useQuery({
    queryKey: ["feedback"],
    queryFn: async () => {
      const { data } = await supabase.from("feedback").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feedback").insert({
        type,
        source: source || null,
        description,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setShowAdd(false);
      setType("compliment"); setSource(""); setDescription("");
      toast({ title: "Feedback recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("feedback").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setSelected(null);
      toast({ title: "Feedback updated" });
    },
  });

  const filtered = useMemo(() => {
    return feedback.filter((f: any) => {
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      if (search && !f.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [feedback, search, typeFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback Register"
        action={<Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Log Feedback</Button>}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search feedback…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="compliment">Compliment</SelectItem>
            <SelectItem value="suggestion">Suggestion</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No feedback recorded</TableCell></TableRow>
            ) : filtered.map((f: any) => (
              <TableRow key={f.id} className="cursor-pointer" onClick={() => setSelected(f)}>
                <TableCell>{format(new Date(f.date), "dd/MM/yyyy")}</TableCell>
                <TableCell><Badge variant="secondary" className={typeColors[f.type] || ""}>{f.type}</Badge></TableCell>
                <TableCell>{f.source || "—"}</TableCell>
                <TableCell className="max-w-[300px] truncate">{f.description}</TableCell>
                <TableCell className="capitalize">{f.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Feedback</DialogTitle><DialogDescription>Record compliments, suggestions, or general feedback</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliment">Compliment</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Source</Label><Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Who provided the feedback" /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details of the feedback" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!description}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Feedback Details</DialogTitle><DialogDescription>View and action feedback</DialogDescription></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="secondary" className={typeColors[selected.type]}>{selected.type}</Badge>
                <Badge variant="outline">{selected.status}</Badge>
              </div>
              <div><Label className="text-muted-foreground">Source</Label><p className="text-sm mt-1">{selected.source || "—"}</p></div>
              <div><Label className="text-muted-foreground">Description</Label><p className="text-sm mt-1">{selected.description}</p></div>
              {selected.action_taken && <div><Label className="text-muted-foreground">Action Taken</Label><p className="text-sm mt-1">{selected.action_taken}</p></div>}
              {selected.status === "open" && (
                <div className="pt-2">
                  <Button size="sm" onClick={() => {
                    const action = prompt("What action was taken?");
                    if (action) updateMutation.mutate({ id: selected.id, updates: { action_taken: action, status: "actioned", updated_at: new Date().toISOString() } });
                  }}>
                    Mark as Actioned
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
