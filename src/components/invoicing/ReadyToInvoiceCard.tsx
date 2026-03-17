import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Clock, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";

interface Props {
  group: {
    participant: { id: string; first_name: string; last_name: string };
    shifts: any[];
    totalHours: number;
    totalCost: number;
  };
  onGenerate: () => void;
  isPending: boolean;
  getHoursFromTime: (start: string, end: string) => number;
}

export function ReadyToInvoiceCard({ group, onGenerate, isPending, getHoursFromTime }: Props) {
  const [open, setOpen] = useState(false);
  const initials = `${group.participant.first_name[0]}${group.participant.last_name[0]}`;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-l-4 border-l-primary overflow-hidden bg-card">
        <CollapsibleTrigger asChild>
          <div className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {initials}
              </div>
              <div>
                <div className="font-semibold text-foreground">{group.participant.first_name} {group.participant.last_name}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {group.shifts.length} shift{group.shifts.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {group.totalHours.toFixed(1)}h
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    {group.totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                disabled={isPending}
                className="bg-primary hover:bg-primary/90"
              >
                <FileText className="h-4 w-4 mr-1" />
                {isPending ? "Generating…" : "Generate Invoice"}
              </Button>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">NDIS Code</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Hours</TableHead>
                  <TableHead className="text-xs text-right">Rate</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.shifts.map((s: any, idx: number) => {
                  const li = s.ndis_price_list;
                  const hours = s._hours ?? getHoursFromTime(s.start_time, s.end_time);
                  const cost = s._cost ?? (li ? (li.unit === "hour" || li.unit === "H" ? li.rate * hours : li.rate) : 0);
                  return (
                    <TableRow key={s.id} className={idx % 2 === 0 ? "" : "bg-muted/10"}>
                      <TableCell className="text-sm">{format(new Date(s.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-sm font-mono">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] px-1.5">{li?.item_code || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{li?.description || "—"}</TableCell>
                      <TableCell className="text-sm text-right">{hours.toFixed(1)}</TableCell>
                      <TableCell className="text-sm text-right">${Number(li?.rate || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-right font-semibold">${cost.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell colSpan={4} className="text-right text-sm">Total</TableCell>
                  <TableCell className="text-right text-sm">{group.totalHours.toFixed(1)}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right text-sm">${group.totalCost.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
