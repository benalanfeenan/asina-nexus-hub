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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Eye } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800", overdue: "bg-red-100 text-red-800", cancelled: "bg-muted text-muted-foreground",
};

export default function Invoicing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showAddLine, setShowAddLine] = useState(false);

  const [participantId, setParticipantId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Line item state
  const [lineDesc, setLineDesc] = useState("");
  const [lineCode, setLineCode] = useState("");
  const [lineQty, setLineQty] = useState("1");
  const [lineRate, setLineRate] = useState("");

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("*, participants(first_name, last_name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["invoice-line-items", selectedInvoice?.id],
    enabled: !!selectedInvoice,
    queryFn: async () => {
      const { data } = await supabase.from("invoice_line_items").select("*").eq("invoice_id", selectedInvoice.id);
      return data || [];
    },
  });

  const { data: boardLodging = [] } = useQuery({
    queryKey: ["board-lodging"],
    queryFn: async () => {
      const { data } = await supabase.from("board_lodging_invoices").select("*, participants(first_name, last_name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["participants-list"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name").eq("is_active", true);
      return data || [];
    },
  });

  const { data: priceList = [] } = useQuery({
    queryKey: ["ndis-price-list-active"],
    queryFn: async () => {
      const { data } = await supabase.from("ndis_price_list").select("item_code, description, rate").eq("is_active", true).order("item_code");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").insert({ participant_id: participantId, invoice_number: invoiceNumber, due_date: dueDate || null, notes: notes || null, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowAdd(false); setParticipantId(""); setInvoiceNumber(""); setDueDate(""); setNotes("");
      toast({ title: "Invoice created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addLineMutation = useMutation({
    mutationFn: async () => {
      const qty = parseFloat(lineQty) || 1;
      const r = parseFloat(lineRate);
      const { error } = await supabase.from("invoice_line_items").insert({
        invoice_id: selectedInvoice.id, description: lineDesc, ndis_line_item_code: lineCode || null, quantity: qty, rate: r, amount: qty * r,
      });
      if (error) throw error;
      // Update invoice total
      const { data: items } = await supabase.from("invoice_line_items").select("amount").eq("invoice_id", selectedInvoice.id);
      const total = (items || []).reduce((sum: number, i: any) => sum + Number(i.amount), 0);
      await supabase.from("invoices").update({ total }).eq("id", selectedInvoice.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-line-items"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowAddLine(false); setLineDesc(""); setLineCode(""); setLineQty("1"); setLineRate("");
      toast({ title: "Line item added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleNdisCodeSelect = (code: string) => {
    const item = priceList.find((p) => p.item_code === code);
    if (item) { setLineCode(item.item_code); setLineDesc(item.description); setLineRate(String(item.rate)); }
  };

  const filtered = useMemo(() => {
    return invoices.filter((i: any) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = `${(i.participants as any)?.first_name} ${(i.participants as any)?.last_name}`.toLowerCase();
        if (!name.includes(q) && !i.invoice_number.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [invoices, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoicing"
        action={<Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Create Invoice</Button>}
      />

      <Tabs defaultValue="ndis">
        <TabsList><TabsTrigger value="ndis">NDIS Invoices</TabsTrigger><TabsTrigger value="board">Board & Lodging</TabsTrigger></TabsList>

        <TabsContent value="ndis" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["draft", "sent", "paid", "overdue", "cancelled"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Invoice #</TableHead><TableHead>Participant</TableHead><TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No invoices found</TableCell></TableRow>
                ) : filtered.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono">{i.invoice_number}</TableCell>
                    <TableCell className="font-medium">{(i.participants as any)?.first_name} {(i.participants as any)?.last_name}</TableCell>
                    <TableCell>{format(new Date(i.issue_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{i.due_date ? format(new Date(i.due_date), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell>${Number(i.total || 0).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="secondary" className={statusColors[i.status] || ""}>{i.status}</Badge></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => setSelectedInvoice(i)}><Eye className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="board" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Participant</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {boardLodging.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No board & lodging invoices</TableCell></TableRow>
                ) : boardLodging.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{(b.participants as any)?.first_name} {(b.participants as any)?.last_name}</TableCell>
                    <TableCell>{format(new Date(b.period_start), "dd/MM")} – {format(new Date(b.period_end), "dd/MM/yyyy")}</TableCell>
                    <TableCell>${Number(b.amount).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="secondary" className={statusColors[b.status] || ""}>{b.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Invoice Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle><DialogDescription>Create a new NDIS invoice</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Participant</Label>
              <Select value={participantId} onValueChange={setParticipantId}>
                <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                <SelectContent>{participants.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Invoice Number</Label><Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!participantId || !invoiceNumber}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoice_number}</DialogTitle>
            <DialogDescription>{(selectedInvoice?.participants as any)?.first_name} {(selectedInvoice?.participants as any)?.last_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className={statusColors[selectedInvoice?.status] || ""}>{selectedInvoice?.status}</Badge></div>
              <div><span className="text-muted-foreground">Total:</span> ${Number(selectedInvoice?.total || 0).toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Line Items</h4>
              <Button size="sm" variant="outline" onClick={() => { setLineDesc(""); setLineCode(""); setLineQty("1"); setLineRate(""); setShowAddLine(true); }}>
                <Plus className="mr-1 h-3 w-3" />Add Line
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Description</TableHead><TableHead>Code</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead>Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No line items</TableCell></TableRow>
                  ) : lineItems.map((li: any) => (
                    <TableRow key={li.id}>
                      <TableCell>{li.description}</TableCell>
                      <TableCell className="font-mono text-xs">{li.ndis_line_item_code || "—"}</TableCell>
                      <TableCell>{li.quantity}</TableCell>
                      <TableCell>${Number(li.rate).toFixed(2)}</TableCell>
                      <TableCell>${Number(li.amount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {selectedInvoice?.notes && <div><Label className="text-muted-foreground">Notes</Label><p className="text-sm mt-1">{selectedInvoice.notes}</p></div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Line Item Dialog */}
      <Dialog open={showAddLine} onOpenChange={setShowAddLine}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Line Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>NDIS Code (auto-fill)</Label>
              <Select value={lineCode} onValueChange={handleNdisCodeSelect}>
                <SelectTrigger><SelectValue placeholder="Select NDIS code or enter manually" /></SelectTrigger>
                <SelectContent>
                  {priceList.map((p) => <SelectItem key={p.item_code} value={p.item_code}>{p.item_code} — {p.description} (${Number(p.rate).toFixed(2)})</SelectItem>)}
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
            <Button variant="outline" onClick={() => setShowAddLine(false)}>Cancel</Button>
            <Button onClick={() => addLineMutation.mutate()} disabled={!lineDesc || !lineRate || addLineMutation.isPending}>
              {addLineMutation.isPending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
