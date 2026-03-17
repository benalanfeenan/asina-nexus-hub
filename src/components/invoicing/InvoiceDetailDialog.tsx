import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Send, CheckCircle2, XCircle, AlertTriangle, Download } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  invoice: any;
  onClose: () => void;
  lineItems: any[];
  onAddLine: () => void;
  statusColors: Record<string, string>;
}

export function InvoiceDetailDialog({ invoice, onClose, lineItems, onAddLine, statusColors }: Props) {
  const queryClient = useQueryClient();

  const { data: orgSettings } = useQuery({
    queryKey: ["organisation-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("organisation_settings").select("*").limit(1).single();
      return data;
    },
  });

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

  const generatePDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header - Organisation details
    const orgName = orgSettings?.name || "Asina Disability Services";
    const orgAbn = orgSettings?.abn ? `ABN: ${orgSettings.abn}` : "";
    const orgAddress = orgSettings?.address || "";
    const orgPhone = orgSettings?.phone || "";
    const orgEmail = orgSettings?.email || "";

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(orgName, 14, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    if (orgAbn) { doc.text(orgAbn, 14, y); y += 4; }
    if (orgAddress) { doc.text(orgAddress, 14, y); y += 4; }
    if (orgPhone || orgEmail) { doc.text([orgPhone, orgEmail].filter(Boolean).join(" | "), 14, y); y += 4; }

    // "TAX INVOICE" title on right
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("TAX INVOICE", pageWidth - 14, 25, { align: "right" });

    // Divider
    y = Math.max(y, 40) + 4;
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y, pageWidth - 14, y);
    y += 10;

    // Invoice details - left column
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice Number:", 14, y);
    doc.text("Issue Date:", 14, y + 5);
    doc.text("Due Date:", 14, y + 10);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoice_number, 50, y);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(invoice.issue_date), "dd/MM/yyyy"), 50, y + 5);
    doc.text(invoice.due_date ? format(new Date(invoice.due_date), "dd/MM/yyyy") : "—", 50, y + 10);

    // Bill To - right column
    const participantName = `${(invoice.participants as any)?.first_name || ""} ${(invoice.participants as any)?.last_name || ""}`.trim();
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Bill To:", pageWidth / 2 + 10, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(participantName || "—", pageWidth / 2 + 10, y + 5);

    // Status
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Status:", pageWidth / 2 + 10, y + 12);
    doc.setTextColor(30, 30, 30);
    doc.text(invoice.status.toUpperCase(), pageWidth / 2 + 30, y + 12);

    y += 25;

    // Line items table
    const tableBody = lineItems.map((li: any) => [
      li.service_date ? format(new Date(li.service_date), "dd/MM/yyyy") : "—",
      li.description,
      li.ndis_line_item_code || "—",
      Number(li.quantity || 1).toFixed(2),
      `$${Number(li.rate).toFixed(2)}`,
      `$${Number(li.amount).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Date", "Description", "NDIS Code", "Qty", "Rate", "Amount"]],
      body: tableBody.length > 0 ? tableBody : [["", "No line items", "", "", "", ""]],
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 24 },
        2: { cellWidth: 28, fontStyle: "italic" },
        3: { halign: "right", cellWidth: 16 },
        4: { halign: "right", cellWidth: 22 },
        5: { halign: "right", cellWidth: 24, fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || y + 20;
    const total = Number(invoice.total || 0).toFixed(2);

    doc.setDrawColor(220, 220, 220);
    doc.line(pageWidth - 80, finalY + 4, pageWidth - 14, finalY + 4);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", pageWidth - 80, finalY + 12);
    doc.text("GST (N/A):", pageWidth - 80, finalY + 18);

    doc.setTextColor(30, 30, 30);
    doc.text(`$${total}`, pageWidth - 14, finalY + 12, { align: "right" });
    doc.text("$0.00", pageWidth - 14, finalY + 18, { align: "right" });

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 80, finalY + 22, pageWidth - 14, finalY + 22);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("TOTAL:", pageWidth - 80, finalY + 30);
    doc.text(`$${total}`, pageWidth - 14, finalY + 30, { align: "right" });

    // Bank details footer
    const bankDetails = orgSettings?.bank_details as any;
    let footerY = finalY + 50;

    if (bankDetails && (bankDetails.bsb || bankDetails.account_number || bankDetails.account_name)) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Payment Details", 14, footerY);
      footerY += 6;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      if (bankDetails.account_name) { doc.text(`Account Name: ${bankDetails.account_name}`, 14, footerY); footerY += 5; }
      if (bankDetails.bsb) { doc.text(`BSB: ${bankDetails.bsb}`, 14, footerY); footerY += 5; }
      if (bankDetails.account_number) { doc.text(`Account Number: ${bankDetails.account_number}`, 14, footerY); footerY += 5; }
    }

    // Notes
    if (invoice.notes) {
      footerY += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Notes:", 14, footerY);
      footerY += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(invoice.notes, pageWidth - 28);
      doc.text(lines, 14, footerY);
    }

    // Footer line
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 220, 220);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text("Thank you for your business", pageWidth / 2, pageHeight - 10, { align: "center" });

    doc.save(`${invoice.invoice_number}.pdf`);
    toast({ title: "PDF downloaded", description: `${invoice.invoice_number}.pdf` });
  };

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

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={generatePDF}>
              <Download className="h-3.5 w-3.5 mr-1" />Download PDF
            </Button>
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
