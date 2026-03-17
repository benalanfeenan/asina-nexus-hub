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

const likelihoodValues = ["rare", "unlikely", "possible", "likely", "almost_certain"] as const;
const consequenceValues = ["insignificant", "minor", "moderate", "major", "catastrophic"] as const;

function calcRating(l: string, c: string): number {
  const li = likelihoodValues.indexOf(l as any) + 1;
  const ci = consequenceValues.indexOf(c as any) + 1;
  return li * ci;
}

function ratingColor(r: number): string {
  if (r <= 4) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (r <= 9) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  if (r <= 15) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

function ratingLabel(r: number): string {
  if (r <= 4) return "Low";
  if (r <= 9) return "Medium";
  if (r <= 15) return "High";
  return "Extreme";
}

export default function RiskRegister() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [likelihood, setLikelihood] = useState("possible");
  const [consequence, setConsequence] = useState("moderate");
  const [existingControls, setExistingControls] = useState("");
  const [additionalControls, setAdditionalControls] = useState("");
  const [responsible, setResponsible] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  const { data: risks = [] } = useQuery({
    queryKey: ["risks"],
    queryFn: async () => {
      const { data } = await supabase.from("risks").select("*").order("risk_rating", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const rating = calcRating(likelihood, consequence);
      const { error } = await supabase.from("risks").insert({
        title, description: desc, category: category || null,
        likelihood: likelihood as any, consequence: consequence as any,
        risk_rating: rating,
        existing_controls: existingControls || null,
        additional_controls: additionalControls || null,
        responsible_person: responsible || null,
        review_date: reviewDate || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks"] });
      setShowAdd(false);
      setTitle(""); setDesc(""); setCategory(""); setLikelihood("possible"); setConsequence("moderate");
      setExistingControls(""); setAdditionalControls(""); setResponsible(""); setReviewDate("");
      toast({ title: "Risk added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    if (!search) return risks;
    const q = search.toLowerCase();
    return risks.filter((r: any) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [risks, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Register"
        action={<Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Risk</Button>}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search risks…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Likelihood</TableHead>
            <TableHead>Consequence</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead>
            <TableHead>Responsible</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No risks found</TableCell></TableRow>
            ) : filtered.map((r: any) => {
              const rating = r.risk_rating || calcRating(r.likelihood, r.consequence);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="capitalize">{r.category || "—"}</TableCell>
                  <TableCell className="capitalize">{r.likelihood.replace("_", " ")}</TableCell>
                  <TableCell className="capitalize">{r.consequence}</TableCell>
                  <TableCell><Badge variant="secondary" className={ratingColor(rating)}>{rating} – {ratingLabel(rating)}</Badge></TableCell>
                  <TableCell className="capitalize">{r.status || "active"}</TableCell>
                  <TableCell>{r.responsible_person || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Risk</DialogTitle><DialogDescription>Add a new risk to the register</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Operational, Financial" /></div>
              <div className="grid gap-2"><Label>Responsible Person</Label><Input value={responsible} onChange={(e) => setResponsible(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Likelihood</Label>
                <Select value={likelihood} onValueChange={setLikelihood}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{likelihoodValues.map((v) => <SelectItem key={v} value={v} className="capitalize">{v.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Consequence</Label>
                <Select value={consequence} onValueChange={setConsequence}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{consequenceValues.map((v) => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 rounded-md border text-center">
              <span className="text-sm text-muted-foreground">Risk Rating: </span>
              <Badge variant="secondary" className={ratingColor(calcRating(likelihood, consequence))}>
                {calcRating(likelihood, consequence)} – {ratingLabel(calcRating(likelihood, consequence))}
              </Badge>
            </div>
            <div className="grid gap-2"><Label>Existing Controls</Label><Textarea value={existingControls} onChange={(e) => setExistingControls(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Additional Controls</Label><Textarea value={additionalControls} onChange={(e) => setAdditionalControls(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Review Date</Label><Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!title || !desc}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
