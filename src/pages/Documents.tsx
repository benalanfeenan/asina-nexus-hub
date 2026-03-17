import { useState, useMemo, useRef, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, ExternalLink, CheckCircle2, Clock, Users, Upload } from "lucide-react";
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
  const [showBulk, setShowBulk] = useState(false);
  const [ackStatusDocId, setAckStatusDocId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [version, setVersion] = useState("1.0");
  const [reviewDate, setReviewDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);

  // Get current user's staff record
  const { data: currentStaff } = useQuery({
    queryKey: ["current-staff", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id").eq("profile_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  // All acknowledgements for docs that require it
  const { data: allAcks = [] } = useQuery({
    queryKey: ["document-acknowledgements"],
    queryFn: async () => {
      const { data } = await supabase.from("document_acknowledgements").select("*");
      return data || [];
    },
  });

  // Staff list for admin ack status view
  const { data: allStaff = [] } = useQuery({
    queryKey: ["all-active-staff"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, first_name, last_name").eq("is_active", true).order("first_name");
      return data || [];
    },
    enabled: canManage,
  });

  const myAckSet = useMemo(() => {
    if (!currentStaff) return new Set<string>();
    return new Set(allAcks.filter((a: any) => a.staff_id === currentStaff.id).map((a: any) => a.document_id));
  }, [allAcks, currentStaff]);

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
        requires_acknowledgement: requiresAck,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowAdd(false);
      setTitle(""); setCategory("other"); setVersion("1.0"); setReviewDate(""); setNotes(""); setFileUrl(""); setRequiresAck(false);
      toast({ title: "Document added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const ackMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!currentStaff) throw new Error("Staff record not found for current user");
      const { error } = await supabase.from("document_acknowledgements").insert({
        document_id: documentId,
        staff_id: currentStaff.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-acknowledgements"] });
      toast({ title: "Document acknowledged" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkCategory, setBulkCategory] = useState<string>("policy");
  const [bulkReviewDate, setBulkReviewDate] = useState("");
  const [bulkRequiresAck, setBulkRequiresAck] = useState(true);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkFiles = useCallback((files: FileList | null) => {
    if (files) setBulkFiles(Array.from(files));
  }, []);

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const total = bulkFiles.length;
      let uploaded = 0;
      for (const file of bulkFiles) {
        setBulkProgress({ current: uploaded + 1, total });
        const ts = Date.now();
        const path = `bulk/${ts}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
        if (uploadErr) throw new Error(`Failed to upload ${file.name}: ${uploadErr.message}`);
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        const title = file.name.replace(/\.[^/.]+$/, "");
        const { error: insertErr } = await supabase.from("documents").insert({
          title,
          category: bulkCategory as any,
          version: "1.0",
          review_date: bulkReviewDate || null,
          file_url: urlData.publicUrl,
          uploaded_by: user?.id,
          requires_acknowledgement: bulkRequiresAck,
        } as any);
        if (insertErr) throw new Error(`Failed to save ${file.name}: ${insertErr.message}`);
        uploaded++;
      }
      setBulkProgress({ current: total, total });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowBulk(false);
      setBulkFiles([]);
      setBulkCategory("policy");
      setBulkReviewDate("");
      setBulkRequiresAck(true);
      setBulkProgress(null);
      toast({ title: `${bulkFiles.length} documents uploaded` });
    },
    onError: (e: any) => {
      setBulkProgress(null);
      toast({ title: "Bulk upload error", description: e.message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    return docs.filter((d: any) => {
      if (catFilter !== "all" && d.category !== catFilter) return false;
      if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [docs, search, catFilter]);

  // Ack status for a specific document
  const ackStatusDoc = docs.find((d: any) => d.id === ackStatusDocId);
  const ackStatusAcks = allAcks.filter((a: any) => a.document_id === ackStatusDocId);
  const ackedStaffIds = new Set(ackStatusAcks.map((a: any) => a.staff_id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        action={canManage ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulk(true)}><Upload className="mr-1 h-4 w-4" />Bulk Upload</Button>
            <Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Document</Button>
          </div>
        ) : undefined}
      />

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
            <TableHead>Acknowledgement</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No documents found</TableCell></TableRow>
            ) : filtered.map((d: any) => {
              const reqAck = d.requires_acknowledgement;
              const acked = myAckSet.has(d.id);
              const docAckCount = allAcks.filter((a: any) => a.document_id === d.id).length;

              return (
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
                  <TableCell>
                    {!reqAck ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : canManage ? (
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setAckStatusDocId(d.id)}>
                        <Users className="h-3 w-3" />
                        {docAckCount}/{allStaff.length}
                      </Button>
                    ) : acked ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" />Acknowledged</span>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => ackMutation.mutate(d.id)} disabled={ackMutation.isPending}>
                        <Clock className="h-3 w-3" />Acknowledge
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add Document Dialog */}
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
            <div className="flex items-center gap-2">
              <Checkbox id="requires-ack" checked={requiresAck} onCheckedChange={(v) => setRequiresAck(!!v)} />
              <Label htmlFor="requires-ack" className="text-sm font-normal">Requires staff acknowledgement</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!title}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Acknowledgement Status Dialog (admin) */}
      <Dialog open={!!ackStatusDocId} onOpenChange={(o) => !o && setAckStatusDocId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledgement Status</DialogTitle>
            <DialogDescription>{ackStatusDoc?.title}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Staff Member</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {allStaff.map((s: any) => {
                  const ack = ackStatusAcks.find((a: any) => a.staff_id === s.id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{[s.first_name, s.last_name].filter(Boolean).join(" ") || "Unknown"}</TableCell>
                      <TableCell>
                        {ack ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />{format(new Date(ack.acknowledged_at), "dd/MM/yyyy")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <Clock className="h-3 w-3" />Pending
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
