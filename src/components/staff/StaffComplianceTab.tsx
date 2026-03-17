import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  COMPLIANCE_ITEMS, CATEGORIES, ROLE_FLAG_LABELS, ROLE_FLAG_KEYS,
  type RoleFlags, DEFAULT_ROLE_FLAGS, isItemApplicable, getItemStatus,
  calculateComplianceScore, type ComplianceItemDefinition,
} from "@/lib/compliance-definitions";
import { Upload, FileText, ChevronRight, ChevronDown } from "lucide-react";

const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-500",
  expiring_soon: "bg-amber-500",
  expired: "bg-destructive",
  in_progress: "bg-blue-500",
  not_started: "bg-muted-foreground/40",
  not_applicable: "bg-muted-foreground/20",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Completed",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  in_progress: "In Progress",
  not_started: "Not Started",
  not_applicable: "N/A",
};

function expiryCountdown(expiryDate: string | null): string | null {
  if (!expiryDate) return null;
  const diff = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Expired ${Math.abs(diff)}d ago`;
  if (diff === 0) return "Today";
  return `${diff}d`;
}

export function StaffComplianceTab({ staffId }: { staffId: string }) {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canEdit = role === "admin" || role === "house_manager";
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const { data: roleFlags } = useQuery({
    queryKey: ["staff-role-flags", staffId],
    queryFn: async () => {
      const { data } = await supabase.from("staff_role_flags").select("*").eq("staff_id", staffId).maybeSingle();
      return data;
    },
  });

  const flags: RoleFlags = useMemo(() => {
    if (!roleFlags) return DEFAULT_ROLE_FLAGS;
    return {
      administers_medication: roleFlags.administers_medication,
      supports_mealtime_assessed: roleFlags.supports_mealtime_assessed,
      supports_bsp_participants: roleFlags.supports_bsp_participants,
      delivers_high_intensity: roleFlags.delivers_high_intensity,
      uses_restrictive_practices: roleFlags.uses_restrictive_practices,
      transports_in_own_vehicle: roleFlags.transports_in_own_vehicle,
      supports_under_18: roleFlags.supports_under_18,
    };
  }, [roleFlags]);

  const { data: complianceRecords = [] } = useQuery({
    queryKey: ["staff-compliance-items", staffId],
    queryFn: async () => {
      const { data } = await supabase.from("staff_compliance_items").select("*").eq("staff_id", staffId);
      return data || [];
    },
  });

  const recordsMap = useMemo(() => {
    const map = new Map<string, any>();
    complianceRecords.forEach((r) => map.set(r.item_key, r));
    return map;
  }, [complianceRecords]);

  const score = useMemo(() => calculateComplianceScore(COMPLIANCE_ITEMS, recordsMap, flags), [recordsMap, flags]);

  const toggleFlag = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      if (roleFlags) {
        const { error } = await supabase.from("staff_role_flags").update({ [key]: value }).eq("staff_id", staffId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_role_flags").insert({ staff_id: staffId, [key]: value });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-role-flags", staffId] }),
  });

  const upsertItem = useMutation({
    mutationFn: async (payload: {
      item_key: string; status: string; date_completed?: string | null;
      expiry_date?: string | null; document_url?: string | null;
      verified_by?: string | null; verified_date?: string | null; notes?: string | null;
    }) => {
      const existing = recordsMap.get(payload.item_key);
      if (existing) {
        const { error } = await supabase.from("staff_compliance_items").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_compliance_items").insert({ staff_id: staffId, ...payload });
        if (error) throw error;
      }
      // Sync parent → children
      const linkedChildren = COMPLIANCE_ITEMS.filter((i) => i.linked_to === payload.item_key);
      for (const linked of linkedChildren) {
        const existingLinked = recordsMap.get(linked.item_key);
        const syncPayload = {
          item_key: linked.item_key, status: payload.status, date_completed: payload.date_completed,
          expiry_date: payload.expiry_date, document_url: payload.document_url,
          verified_by: payload.verified_by, verified_date: payload.verified_date,
        };
        if (existingLinked) {
          await supabase.from("staff_compliance_items").update({ ...syncPayload, updated_at: new Date().toISOString() }).eq("id", existingLinked.id);
        } else {
          await supabase.from("staff_compliance_items").insert({ staff_id: staffId, ...syncPayload });
        }
      }
      // Sync child → parent
      const currentDef = COMPLIANCE_ITEMS.find((i) => i.item_key === payload.item_key);
      if (currentDef?.linked_to) {
        const parentKey = currentDef.linked_to;
        const existingParent = recordsMap.get(parentKey);
        const parentPayload = {
          item_key: parentKey, status: payload.status, date_completed: payload.date_completed,
          expiry_date: payload.expiry_date, document_url: payload.document_url,
          verified_by: payload.verified_by, verified_date: payload.verified_date,
        };
        if (existingParent) {
          await supabase.from("staff_compliance_items").update({ ...parentPayload, updated_at: new Date().toISOString() }).eq("id", existingParent.id);
        } else {
          await supabase.from("staff_compliance_items").insert({ staff_id: staffId, ...parentPayload });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-compliance-items", staffId] });
      setExpandedItem(null);
      toast({ title: "Compliance item updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const uploadDocument = async (file: File, itemKey: string) => {
    const path = `staff-compliance/${staffId}/${itemKey}/${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload error", description: error.message, variant: "destructive" }); return null; }
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const scoreColor = score === 100 ? "text-emerald-600" : score >= 80 ? "text-amber-600" : "text-destructive";

  return (
    <div className="space-y-4">
      {/* Slim Score Bar */}
      <div className="flex items-center gap-3 px-1">
        <span className={`text-sm font-semibold ${scoreColor} min-w-[3rem]`}>{score}%</span>
        <Progress value={score} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground">Compliance</span>
      </div>

      {/* Role Flags — compact inline strip */}
      {canEdit && (
        <div className="border-b border-border pb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Role Flags</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 px-1">
            {ROLE_FLAG_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                <Switch
                  className="h-4 w-8 [&>span]:h-3 [&>span]:w-3 data-[state=checked]:[&>span]:translate-x-4"
                  checked={(flags as any)[key] || false}
                  onCheckedChange={(v) => toggleFlag.mutate({ key, value: v })}
                />
                <span className="text-xs text-foreground">{ROLE_FLAG_LABELS[key]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Matrix Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Item</TableHead>
            <TableHead className="w-[15%]">Status</TableHead>
            <TableHead className="w-[15%]">Completed</TableHead>
            <TableHead className="w-[15%]">Expiry</TableHead>
            <TableHead className="w-[8%] text-center">Doc</TableHead>
            <TableHead className="w-[7%]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CATEGORIES.map((category) => {
            const items = COMPLIANCE_ITEMS.filter((i) => i.category === category);
            const visibleItems = items.filter((i) => {
              if (category === "Role-Specific") return isItemApplicable(i, flags);
              return true;
            });

            if (category === "Role-Specific" && visibleItems.length === 0) {
              return [
                <TableRow key={`cat-${category}`} className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={6} className="py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    {category}
                  </TableCell>
                </TableRow>,
                <TableRow key={`cat-${category}-empty`} className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-2 text-xs text-muted-foreground italic">
                    No role-specific items apply. Enable role flags above.
                  </TableCell>
                </TableRow>,
              ];
            }

            return [
              <TableRow key={`cat-${category}`} className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={6} className="py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  {category}
                </TableCell>
              </TableRow>,
              ...visibleItems.map((item) => {
                const applicable = isItemApplicable(item, flags);
                const record = recordsMap.get(item.item_key);
                const status = getItemStatus(item, record, flags);
                const isExpanded = expandedItem === item.item_key;
                const countdown = item.has_expiry ? expiryCountdown(record?.expiry_date) : null;

                return [
                  <TableRow
                    key={item.item_key}
                    className={`cursor-pointer ${!applicable ? "opacity-40" : ""} ${isExpanded ? "bg-muted/20" : ""}`}
                    onClick={() => canEdit && applicable && setExpandedItem(isExpanded ? null : item.item_key)}
                  >
                    <TableCell className="py-2 text-sm">{item.name}</TableCell>
                    <TableCell className="py-2">
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                        <span className="text-xs">{STATUS_LABEL[status]}</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {record?.date_completed || "—"}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {record?.expiry_date ? (
                        <span className={status === "expired" ? "text-destructive" : status === "expiring_soon" ? "text-amber-600" : "text-muted-foreground"}>
                          {record.expiry_date}
                          {countdown && <span className="ml-1 text-[10px]">({countdown})</span>}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      {record?.document_url ? (
                        <a
                          href={record.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <FileText className="h-3.5 w-3.5 inline" />
                        </a>
                      ) : <span className="text-muted-foreground/30">—</span>}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {canEdit && applicable && (
                        isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground inline" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground inline" />
                      )}
                    </TableCell>
                  </TableRow>,
                  isExpanded && canEdit && applicable && (
                    <TableRow key={`${item.item_key}-form`} className="hover:bg-transparent">
                      <TableCell colSpan={6} className="p-0">
                        <ComplianceItemForm
                          item={item}
                          record={record}
                          isSaving={upsertItem.isPending}
                          onSave={(data) => upsertItem.mutate({ item_key: item.item_key, ...data })}
                          onUpload={async (file) => {
                            const url = await uploadDocument(file, item.item_key);
                            if (url) {
                              upsertItem.mutate({ item_key: item.item_key, status: record?.status || "not_started", document_url: url });
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ),
                ];
              }),
            ];
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ComplianceItemForm({
  item, record, isSaving, onSave, onUpload,
}: {
  item: ComplianceItemDefinition; record: any; isSaving?: boolean;
  onSave: (data: any) => void; onUpload: (file: File) => void;
}) {
  const [status, setStatus] = useState(record?.status || "not_started");
  const [dateCompleted, setDateCompleted] = useState(record?.date_completed || "");
  const [expiryDate, setExpiryDate] = useState(record?.expiry_date || "");
  const [notes, setNotes] = useState(record?.notes || "");
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="px-4 py-3 bg-muted/10 border-t border-border space-y-3">
      <p className="text-xs text-muted-foreground">{item.description}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="not_applicable">N/A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Date Completed</Label>
          <Input type="date" className="h-8 text-xs" value={dateCompleted} onChange={(e) => setDateCompleted(e.target.value)} />
        </div>
        {item.has_expiry && (
          <div>
            <Label className="text-xs">Expiry Date</Label>
            <Input type="date" className="h-8 text-xs" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
        )}
        <div className="flex items-end gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8" disabled={isUploading}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file"; input.accept = ".pdf,.jpg,.jpeg,.png";
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) { setIsUploading(true); await onUpload(file); setIsUploading(false); }
              };
              input.click();
            }}
          >
            <Upload className="h-3 w-3 mr-1" />{isUploading ? "Uploading..." : "Upload"}
          </Button>
          {record?.document_url && (
            <a href={record.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 h-8 items-center">
              <FileText className="h-3 w-3" />View
            </a>
          )}
        </div>
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea className="text-xs min-h-[50px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button size="sm" disabled={isSaving} onClick={() => onSave({ status, date_completed: dateCompleted || null, expiry_date: expiryDate || null, notes: notes || null })}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
