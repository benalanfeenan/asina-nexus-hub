import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, ExternalLink, ShieldCheck } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UnifiedDoc {
  id: string;
  title: string;
  type: string;
  uploaded_date: string;
  expiry_date: string | null;
  file_url: string | null;
  source: "documents" | "compliance";
}

export function StaffDocumentsTab({ staffId }: { staffId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ document_type: "", title: "", expiry_date: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Query staff_documents
  const { data: staffDocs = [] } = useQuery({
    queryKey: ["staff-documents", staffId],
    queryFn: async () => {
      const { data } = await supabase.from("staff_documents").select("*").eq("staff_id", staffId).order("uploaded_date", { ascending: false });
      return data || [];
    },
  });

  // Query compliance items with documents
  const { data: complianceDocs = [] } = useQuery({
    queryKey: ["staff-compliance-docs", staffId],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff_compliance_items")
        .select("id, item_key, document_url, date_completed, expiry_date, updated_at")
        .eq("staff_id", staffId)
        .not("document_url", "is", null);
      return data || [];
    },
  });

  // Merge into unified list
  const allDocs = useMemo<UnifiedDoc[]>(() => {
    const docs: UnifiedDoc[] = staffDocs.map((r: any) => ({
      id: r.id,
      title: r.title,
      type: r.document_type?.replace(/_/g, " ") || "Other",
      uploaded_date: r.uploaded_date,
      expiry_date: r.expiry_date,
      file_url: r.file_url,
      source: "documents" as const,
    }));

    complianceDocs.forEach((r: any) => {
      docs.push({
        id: `compliance-${r.id}`,
        title: r.item_key.replace(/_/g, " "),
        type: "Compliance Evidence",
        uploaded_date: r.date_completed || r.updated_at?.slice(0, 10) || "",
        expiry_date: r.expiry_date,
        file_url: r.document_url,
        source: "compliance" as const,
      });
    });

    docs.sort((a, b) => new Date(b.uploaded_date).getTime() - new Date(a.uploaded_date).getTime());
    return docs;
  }, [staffDocs, complianceDocs]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    let file_url = null;
    if (file) {
      setUploading(true);
      const path = `staff/${staffId}/${Date.now()}_${file.name}`;
      const { error: ue } = await supabase.storage.from("documents").upload(path, file);
      if (ue) { toast.error(ue.message); setUploading(false); return; }
      const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
      file_url = pub.publicUrl;
      setUploading(false);
    }
    const { error } = await supabase.from("staff_documents").insert({
      staff_id: staffId, document_type: form.document_type, title: form.title, file_url, expiry_date: form.expiry_date || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["staff-documents", staffId] });
    setOpen(false);
    toast.success("Document added");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Staff Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Document Type</Label><Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v }))}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="employment_contract">Employment Contract</SelectItem><SelectItem value="position_description">Position Description</SelectItem><SelectItem value="qualification">Qualification</SelectItem><SelectItem value="clearance">Clearance</SelectItem><SelectItem value="certificate">Certificate</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
              <div><Label>File</Label><Input type="file" ref={fileRef} /></div>
              <Button onClick={handleUpload} disabled={!form.title || !form.document_type || uploading}>{uploading ? "Uploading..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {allDocs.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> : (
          <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Source</TableHead><TableHead>Uploaded</TableHead><TableHead>Expiry</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{allDocs.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="capitalize">{r.title}</TableCell>
                <TableCell className="capitalize">{r.type}</TableCell>
                <TableCell>
                  {r.source === "compliance" ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs gap-1">
                      <ShieldCheck className="h-3 w-3" />Compliance
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Direct</Badge>
                  )}
                </TableCell>
                <TableCell>{r.uploaded_date ? format(new Date(r.uploaded_date), "dd/MM/yyyy") : "—"}</TableCell>
                <TableCell>{r.expiry_date ? format(new Date(r.expiry_date), "dd/MM/yyyy") : "—"}</TableCell>
                <TableCell>{r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-primary" /></a>}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}
