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
import { Plus, Search, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-muted text-muted-foreground",
};

export default function QualityImprovement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const [desc, setDesc] = useState("");
  const [action, setAction] = useState("");
  const [responsible, setResponsible] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sourceType, setSourceType] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["quality-improvements"],
    queryFn: async () => {
      const { data } = await supabase.from("quality_improvements").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("quality_improvements").insert({
        description: desc,
        action_required: action || null,
        responsible_person: responsible || null,
        due_date: dueDate || null,
        source_type: sourceType || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-improvements"] });
      setShowAdd(false);
      setDesc(""); setAction(""); setResponsible(""); setDueDate(""); setSourceType("");
      toast({ title: "QI action added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quality_improvements").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-improvements"] });
      toast({ title: "Marked as completed" });
    },
  });

  const filtered = useMemo(() => {
    return items.filter((i: any) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Quality Improvement</h1>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add QI Action</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["open", "in_progress", "completed", "closed"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Description</TableHead><TableHead>Action Required</TableHead><TableHead>Responsible</TableHead>
            <TableHead>Due</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No QI actions found</TableCell></TableRow>
            ) : filtered.map((i: any) => (
              <TableRow key={i.id}>
                <TableCell className="max-w-[250px] truncate">{i.description}</TableCell>
                <TableCell className="max-w-[200px] truncate">{i.action_required || "—"}</TableCell>
                <TableCell>{i.responsible_person || "—"}</TableCell>
                <TableCell>{i.due_date ? format(new Date(i.due_date), "dd/MM/yyyy") : "—"}</TableCell>
                <TableCell className="capitalize">{i.source_type || "—"}</TableCell>
                <TableCell><Badge variant="secondary" className={statusColors[i.status] || ""}>{i.status?.replace("_", " ")}</Badge></TableCell>
                <TableCell>
                  {i.status !== "completed" && i.status !== "closed" && (
                    <Button size="sm" variant="ghost" onClick={() => completeMutation.mutate(i.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />Complete
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
          <DialogHeader><DialogTitle>Add QI Action</DialogTitle><DialogDescription>Create a quality improvement action item</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Action Required</Label><Textarea value={action} onChange={(e) => setAction(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Responsible Person</Label><Input value={responsible} onChange={(e) => setResponsible(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            </div>
            <div className="grid gap-2">
              <Label>Source Type</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {["incident", "complaint", "audit", "feedback", "other"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!desc}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
