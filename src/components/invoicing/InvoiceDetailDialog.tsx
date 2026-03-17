import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Send, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  invoice: any;
  onClose: () => void;
  lineItems: any[];
  onAddLine: () => void;
  statusColors: Record<string, string>;
}

export function InvoiceDetailDialog({ invoice, onClose, lineItems, onAddLine, statusColors }: Props) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase.from("invoices").update({ status: newStatus as any }).eq("id", invoice.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onClose();
      toast({ title: "Invoice status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!invoice) return null;

  const statusActions: { label: string; status: string; icon: any; className: string }[] = [];
  if (invoice.status === "draft") statusActions.push({ label: "Mark as Sent", status: "sent", icon: Send, className: "bg-blue-600 hover:bg-blue-700 text-white" });
  if (invoice.status === "sent") {
    statusActions.push({ label: "Mark as Paid", status: "paid", icon: CheckCircle2, className: "bg-green-600 hover:bg-green-700 text-white" });
    statusActions.push({ label: "Mark Overdue", status: "overdue", icon: AlertTriangle, className: "bg-amber-600 hover:bg-amber-700 text-white" });
  }
  if (invoice.status !== "cancelled" && invoice.status !== "paid") {
    statusActions.push({ label: "Cancel", status: "cancelled", icon: XCircle, className: "bg-destructive hover:bg-destructive/90 text-destructive-foreground" });
  }

  return (
    <Dialog open={!!invoice} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
          <DialogDescription>{(invoice.participants as any)?.first_name} {(invoice.participants as any)?.last_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className={statusColors[invoice.status] || ""}>{invoice.status}</Badge></div>
            <div><span className="text-muted-foreground">Total:</span> <span className="font-bold text-lg">${Number(invoice.total || 0).toFixed(2)}</span></div>
          </div>

          {/* Status transition buttons */}
          {statusActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {statusActions.map((a) => (
                <Button
                  key={a.status}
                  size="sm"
                  className={a.className}
                  onClick={() => statusMutation.mutate(a.status)}
                  disabled={statusMutation.isPending}
                >
                  <a.icon className="h-3.5 w-3.5 mr-1" />{a.label}
                </Button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">Line Items</h4>
            <Button size="sm" variant="outline" onClick={onAddLine}>
              <Plus className="mr-1 h-3 w-3" />Add Line
            </Button>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/30">
                <TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Code</TableHead><TableHead className="text-xs">Qty</TableHead><TableHead className="text-xs">Rate</TableHead><TableHead className="text-xs">Amount</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No line items</TableCell></TableRow>
                ) : lineItems.map((li: any) => (
                  <TableRow key={li.id}>
                    <TableCell className="text-sm">{li.description}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-[10px] px-1.5">{li.ndis_line_item_code || "—"}</Badge></TableCell>
                    <TableCell className="text-sm">{li.quantity}</TableCell>
                    <TableCell className="text-sm">${Number(li.rate).toFixed(2)}</TableCell>
                    <TableCell className="text-sm font-semibold">${Number(li.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {invoice.notes && <div><Label className="text-muted-foreground">Notes</Label><p className="text-sm mt-1">{invoice.notes}</p></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
