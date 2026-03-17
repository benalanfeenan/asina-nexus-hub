import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 	useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/PageHeader";

export default function NDISPriceList() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [itemCode, setItemCode] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [unit, setUnit] = useState("each");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: items = [] } = useQuery({
    queryKey: ["ndis-price-list"],
    queryFn: async () => {
      const { data } = await supabase.from("ndis_price_list").select("*").order("item_code");
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.item_code.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || (i.category || "").toLowerCase().includes(q));
  }, [items, search]);

  const openAdd = () => {
    setEditing(null);
    setItemCode(""); setDescription(""); setRate(""); setUnit("each"); setCategory(""); setIsActive(true);
    setShowDialog(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setItemCode(item.item_code); setDescription(item.description); setRate(String(item.rate)); setUnit(item.unit || "each"); setCategory(item.category || ""); setIsActive(item.is_active);
    setShowDialog(true);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { item_code: itemCode.trim(), description: description.trim(), rate: parseFloat(rate), unit: unit.trim() || "each", category: category.trim() || null, is_active: isActive };
      if (editing) {
        const { error } = await supabase.from("ndis_price_list").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ndis_price_list").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ndis-price-list"] });
      toast({ title: editing ? "Item updated" : "Item added" });
      setShowDialog(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ndis_price_list").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ndis-price-list"] }); toast({ title: "Item deleted" }); setDeleteId(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">NDIS Price List</h1>
        {isAdmin && <Button onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Item</Button>}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by code, description, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Description</TableHead><TableHead>Rate</TableHead><TableHead>Unit</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead>
            {isAdmin && <TableHead></TableHead>}
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No items found</TableCell></TableRow>
            ) : filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>${Number(item.rate).toFixed(2)}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.category || "—"}</TableCell>
                <TableCell><Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                {isAdmin && (
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Item" : "Add Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Item Code *</Label><Input value={itemCode} onChange={(e) => setItemCode(e.target.value)} placeholder="e.g. 01_011_0107_1_1" /></div>
              <div><Label>Rate *</Label><Input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.00" /></div>
            </div>
            <div><Label>Description *</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="each, hour, day" /></div>
              <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Core, Capacity Building" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />Active</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={!itemCode.trim() || !description.trim() || !rate || mutation.isPending}>
              {mutation.isPending ? "Saving…" : editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Item" description="Are you sure you want to delete this price list item?" onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} />
    </div>
  );
}
