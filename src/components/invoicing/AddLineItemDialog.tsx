import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoiceId?: string;
  priceList: any[];
}

export function AddLineItemDialog({ open, onOpenChange, invoiceId, priceList }: Props) {
  const queryClient = useQueryClient();
  const [lineDesc, setLineDesc] = useState("");
  const [lineCode, setLineCode] = useState("");
  const [lineQty, setLineQty] = useState("1");
  const [lineRate, setLineRate] = useState("");

  const handleNdisCodeSelect = (code: string) => {
    const item = priceList.find((p: any) => p.item_code === code);
    if (item) { setLineCode(item.item_code); setLineDesc(item.description); setLineRate(String(item.rate)); }
  };

  const addLineMutation = useMutation({
    mutationFn: async () => {
      if (!invoiceId) throw new Error("No invoice selected");
      const qty = parseFloat(lineQty) || 1;
      const r = parseFloat(lineRate);
      const { error } = await supabase.from("invoice_line_items").insert({
        invoice_id: invoiceId, description: lineDesc, ndis_line_item_code: lineCode || null, quantity: qty, rate: r, amount: qty * r,
      });
      if (error) throw error;
      const { data: items } = await supabase.from("invoice_line_items").select("amount").eq("invoice_id", invoiceId);
      const total = (items || []).reduce((sum: number, i: any) => sum + Number(i.amount), 0);
      await supabase.from("invoices").update({ total }).eq("id", invoiceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-line-items"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onOpenChange(false);
      setLineDesc(""); setLineCode(""); setLineQty("1"); setLineRate("");
      toast({ title: "Line item added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Line Item</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>NDIS Code (auto-fill)</Label>
            <Select value={lineCode} onValueChange={handleNdisCodeSelect}>
              <SelectTrigger><SelectValue placeholder="Select NDIS code or enter manually" /></SelectTrigger>
              <SelectContent>
                {priceList.map((p: any) => <SelectItem key={p.item_code} value={p.item_code}>{p.item_code} — {p.description} (${Number(p.rate).toFixed(2)})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Description *</Label><Input value={lineDesc} onChange={(e) => setLineDesc(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantity</Label><Input type="number" step="0.01" value={lineQty} onChange={(e) => setLineQty(e.target.value)} /></div>
            <div><Label>Rate *</Label><Input type="number" step="0.01" value={lineRate} onChange={(e) => setLineRate(e.target.value)} /></div>
          </div>
          {lineRate && lineQty && <p className="text-sm text-muted-foreground">Amount: ${(parseFloat(lineQty || "0") * parseFloat(lineRate || "0")).toFixed(2)}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => addLineMutation.mutate()} disabled={!lineDesc || !lineRate || addLineMutation.isPending}>
            {addLineMutation.isPending ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
