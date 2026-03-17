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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Eye, FileText, ChevronLeft, ChevronRight, ChevronDown, Clock, DollarSign, Send, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { InvoicingStatsBar } from "@/components/invoicing/InvoicingStatsBar";
import { ReadyToInvoiceCard } from "@/components/invoicing/ReadyToInvoiceCard";
import { InvoiceDetailDialog } from "@/components/invoicing/InvoiceDetailDialog";
import { AddInvoiceDialog } from "@/components/invoicing/AddInvoiceDialog";
import { AddLineItemDialog } from "@/components/invoicing/AddLineItemDialog";

function getHoursFromTime(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

export default function Invoicing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showAddLine, setShowAddLine] = useState(false);
  const [invoiceWeekStart, setInvoiceWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const invoiceWeekEnd = endOfWeek(invoiceWeekStart, { weekStartsOn: 1 });

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
      const { data } = await supabase.from("ndis_price_list").select("id, item_code, description, rate").eq("is_active", true).order("item_code");
      return data || [];
    },
  });

  const { data: completedShifts = [] } = useQuery({
    queryKey: ["ready-to-invoice-shifts", format(invoiceWeekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const from = format(invoiceWeekStart, "yyyy-MM-dd");
      const to = format(invoiceWeekEnd, "yyyy-MM-dd");
      const { data } = await supabase
        .from("scheduler_shifts")
        .select("*, participants(first_name, last_name), ndis_price_list(id, item_code, description, rate, unit)")
        .eq("status", "completed")
        .is("invoice_id", null)
        .not("participant_id", "is", null)
        .not("ndis_line_item_id", "is", null)
        .gte("date", from)
        .lte("date", to)
        .order("date");
      return (data || []) as any[];
    },
  });

  const readyByParticipant = useMemo(() => {
    const map: Record<string, { participant: { id: string; first_name: string; last_name: string }; shifts: any[]; totalHours: number; totalCost: number }> = {};
    for (const s of completedShifts) {
      const pid = s.participant_id;
      if (!map[pid]) {
        map[pid] = { participant: s.participants, shifts: [], totalHours: 0, totalCost: 0 };
      }
      const hours = getHoursFromTime(s.start_time, s.end_time);
      const li = s.ndis_price_list;
      const cost = li ? (li.unit === "hour" || li.unit === "H" ? li.rate * hours : li.rate) : 0;
      map[pid].shifts.push({ ...s, _hours: hours, _cost: cost });
      map[pid].totalHours += hours;
      map[pid].totalCost += cost;
    }
    return Object.values(map);
  }, [completedShifts]);

  // Stats
  const stats = useMemo(() => {
    const paid = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.total || 0), 0);
    const outstanding = invoices.filter((i: any) => i.status === "sent" || i.status === "overdue").reduce((s: number, i: any) => s + Number(i.total || 0), 0);
    const draftCount = invoices.filter((i: any) => i.status === "draft").length;
    return { paid, outstanding, draftCount, readyCount: completedShifts.length };
  }, [invoices, completedShifts]);

  const generateInvoiceMutation = useMutation({
    mutationFn: async (group: { participant: { id: string; first_name: string; last_name: string }; shifts: any[]; totalCost: number }) => {
      const { data: refData, error: refError } = await supabase.rpc("next_reference", { ref_type: "invoice" });
      if (refError) throw refError;
      const { data: invData, error: invError } = await supabase.from("invoices").insert({
        participant_id: group.participant.id, invoice_number: refData as string, created_by: user?.id, status: "draft" as any, total: 0,
      }).select("id").single();
      if (invError) throw invError;
      const invoiceId = invData.id;
      const lineItemRows = group.shifts.map((s: any) => {
        const li = s.ndis_price_list;
        const hours = getHoursFromTime(s.start_time, s.end_time);
        const isHourly = li.unit === "hour" || li.unit === "H";
        const qty = isHourly ? hours : 1;
        return { invoice_id: invoiceId, description: li.description, ndis_line_item_code: li.item_code, quantity: qty, rate: li.rate, amount: qty * li.rate, service_date: s.date };
      });
      const { error: liError } = await supabase.from("invoice_line_items").insert(lineItemRows);
      if (liError) throw liError;
      const total = lineItemRows.reduce((sum, li) => sum + li.amount, 0);
      await supabase.from("invoices").update({ total }).eq("id", invoiceId);
      const shiftIds = group.shifts.map((s: any) => s.id);
      const { error: updateError } = await supabase.from("scheduler_shifts").update({ invoice_id: invoiceId } as any).in("id", shiftIds);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ready-to-invoice-shifts"] });
      toast({ title: "Invoice generated successfully" });
    },
    onError: (e: any) => toast({ title: "Error generating invoice", description: e.message, variant: "destructive" }),
  });

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-muted text-muted-foreground",
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

      {/* Stats Bar */}
      <InvoicingStatsBar stats={stats} />

      <Tabs defaultValue="ready">
        <TabsList>
          <TabsTrigger value="ready">Ready to Invoice</TabsTrigger>
          <TabsTrigger value="ndis">NDIS Invoices</TabsTrigger>
          <TabsTrigger value="board">Board & Lodging</TabsTrigger>
        </TabsList>

        {/* Ready to Invoice Tab */}
        <TabsContent value="ready" className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setInvoiceWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This Week</Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setInvoiceWeekStart(w => subWeeks(w, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setInvoiceWeekStart(w => addWeeks(w, 1))}><ChevronRight className="h-4 w-4" /></Button>
              <span className="text-sm font-medium text-muted-foreground">
                {format(invoiceWeekStart, "d MMM")} – {format(invoiceWeekEnd, "d MMM yyyy")}
              </span>
            </div>
            {readyByParticipant.length > 1 && (
              <Button
                size="sm"
                onClick={() => readyByParticipant.forEach(g => generateInvoiceMutation.mutate(g))}
                disabled={generateInvoiceMutation.isPending}
              >
                <FileText className="h-4 w-4 mr-1" />Generate All ({readyByParticipant.length})
              </Button>
            )}
          </div>

          {readyByParticipant.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              No completed shifts ready to invoice for this week.
            </div>
          ) : (
            <div className="space-y-3">
              {readyByParticipant.map((group) => (
                <ReadyToInvoiceCard
                  key={group.participant.id}
                  group={group}
                  onGenerate={() => generateInvoiceMutation.mutate(group)}
                  isPending={generateInvoiceMutation.isPending}
                  getHoursFromTime={getHoursFromTime}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ndis" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search invoices…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["draft", "sent", "paid", "overdue", "cancelled"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/50">
                <TableHead>Invoice #</TableHead><TableHead>Participant</TableHead><TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No invoices found</TableCell></TableRow>
                ) : filtered.map((i: any, idx: number) => (
                  <TableRow key={i.id} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                    <TableCell className="font-mono text-sm">{i.invoice_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {(i.participants as any)?.first_name?.[0]}{(i.participants as any)?.last_name?.[0]}
                        </div>
                        <span className="font-medium">{(i.participants as any)?.first_name} {(i.participants as any)?.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(i.issue_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-sm">{i.due_date ? format(new Date(i.due_date), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell className="font-semibold">${Number(i.total || 0).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="secondary" className={statusColors[i.status] || ""}>{i.status}</Badge></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => setSelectedInvoice(i)}><Eye className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="board" className="space-y-4">
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead>Participant</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {boardLodging.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No board & lodging invoices</TableCell></TableRow>
                ) : boardLodging.map((b: any, idx: number) => (
                  <TableRow key={b.id} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {(b.participants as any)?.first_name?.[0]}{(b.participants as any)?.last_name?.[0]}
                        </div>
                        <span className="font-medium">{(b.participants as any)?.first_name} {(b.participants as any)?.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(b.period_start), "dd/MM")} – {format(new Date(b.period_end), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-semibold">${Number(b.amount).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="secondary" className={statusColors[b.status] || ""}>{b.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AddInvoiceDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        participants={participants}
        userId={user?.id}
      />

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        lineItems={lineItems}
        onAddLine={() => setShowAddLine(true)}
        statusColors={statusColors}
      />

      <AddLineItemDialog
        open={showAddLine}
        onOpenChange={setShowAddLine}
        invoiceId={selectedInvoice?.id}
        priceList={priceList}
      />
    </div>
  );
}
