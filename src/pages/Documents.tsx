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
import { Plus, Search, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";

const categories = ["policy", "procedure", "form", "template", "training", "compliance", "other"] as const;

export default function Documents() {
  const { user, role } = useAuth();
  const canManage = role === "admin";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [version, setVersion] = useState("1.0");
  const [reviewDate, setReviewDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const { data: docs = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documents").insert({
        title,
        category: category as any,
        version: version || "1.0",
        review_date: reviewDate || null,
        notes: notes || null,
        file_url: fileUrl || null,
        uploaded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowAdd(false);
      setTitle(""); setCategory("other"); setVersion("1.0"); setReviewDate(""); setNotes(""); setFileUrl("");
      toast({ title: "Document added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return docs.filter((d: any) => {
      if (catFilter !== "all" && d.category !== catFilter) return false;
      if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [docs, search, catFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Documents</h1>
        {canManage && <Button onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Document</Button>}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Version</TableHead>
            <TableHead>Review Date</TableHead><TableHead>Updated</TableHead><TableHead>Link</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No documents found</TableCell></TableRow>
            ) : filtered.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell><Badge variant="secondary" className="capitalize">{d.category}</Badge></TableCell>
                <TableCell>{d.version || "—"}</TableCell>
                <TableCell>{d.review_date ? format(new Date(d.review_date), "dd/MM/yyyy") : "—"}</TableCell>
                <TableCell>{format(new Date(d.updated_at), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  {d.file_url ? (
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />Open
                    </a>
                  ) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Document</DialogTitle><DialogDescription>Register a new document</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Version</Label><Input value={version} onChange={(e) => setVersion(e.target.value)} /></div>
            </div>
            <div className="grid gap-2"><Label>Review Date</Label><Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>File URL</Label><Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://…" /></div>
            <div className="grid gap-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!title}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
