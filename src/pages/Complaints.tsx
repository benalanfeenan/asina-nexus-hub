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
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  acknowledged: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  investigating: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-muted text-muted-foreground",
};

export default function Complaints() {
  const { user, role } = useAuth();
  const canManage = role === "admin";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [complainantName, setComplainantName] = useState("");
  const [complainantContact, setComplainantContact] = useState("");

  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints"],
    queryFn: async () => {
      const { data } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("complaints").insert({
        title,
        description,
        complainant_name: complainantName || null,
        complainant_contact: complainantContact || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setShowAdd(false);
      setTitle(""); setDescription(""); setComplainantName(""); setComplainantContact("");
      toast({ title: "Complaint recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("complaints").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setSelected(null);
      toast({ title: "Complaint updated" });
    },
  });

  const filtered = useMemo(() => {
    return complaints.filter((c: any) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.title.toLowerCase().includes(q) && !c.reference_number.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [complaints, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        action={<Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Log Complaint</Button>}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by title or reference…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["received", "acknowledged", "investigating", "resolved", "closed"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Complainant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No complaints found</TableCell></TableRow>
            ) : filtered.map((c: any) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                <TableCell className="font-mono text-sm">{c.reference_number}</TableCell>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell>{c.complainant_name || "—"}</TableCell>
                <TableCell><Badge variant="secondary" className={statusColors[c.status] || ""}>{c.status}</Badge></TableCell>
                <TableCell>{format(new Date(c.created_at), "dd/MM/yyyy")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Complaint</DialogTitle><DialogDescription>Record a new complaint</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Complainant Name</Label><Input value={complainantName} onChange={(e) => setComplainantName(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Contact</Label><Input value={complainantContact} onChange={(e) => setComplainantContact(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!title || !description}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.reference_number}: {selected?.title}</DialogTitle><DialogDescription>Complaint details and workflow</DialogDescription></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div><Label className="text-muted-foreground">Description</Label><p className="text-sm mt-1">{selected.description}</p></div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className={statusColors[selected.status]}>{selected.status}</Badge></div>
                <div><span className="text-muted-foreground">Complainant:</span> {selected.complainant_name || "—"}</div>
              </div>
              {selected.resolution_details && <div><Label className="text-muted-foreground">Resolution</Label><p className="text-sm mt-1">{selected.resolution_details}</p></div>}
              {canManage && selected.status !== "closed" && (
                <div className="flex gap-2 pt-2">
                  {selected.status === "received" && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: selected.id, updates: { status: "acknowledged", acknowledgement_date: new Date().toISOString().slice(0, 10) } })}>
                      Acknowledge
                    </Button>
                  )}
                  {selected.status === "acknowledged" && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: selected.id, updates: { status: "investigating" } })}>
                      Start Investigation
                    </Button>
                  )}
                  {selected.status === "investigating" && (
                    <Button size="sm" onClick={() => {
                      const details = prompt("Enter resolution details:");
                      if (details) updateStatus.mutate({ id: selected.id, updates: { status: "resolved", resolution_details: details, resolution_date: new Date().toISOString().slice(0, 10) } });
                    }}>
                      Resolve
                    </Button>
                  )}
                  {selected.status === "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: selected.id, updates: { status: "closed" } })}>
                      Close
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
