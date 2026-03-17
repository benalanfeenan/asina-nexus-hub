import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  COMPLIANCE_ITEMS, CATEGORIES, ROLE_FLAG_LABELS, ROLE_FLAG_KEYS,
  type RoleFlags, DEFAULT_ROLE_FLAGS, isItemApplicable, getItemStatus,
  calculateComplianceScore, type ComplianceItemDefinition,
} from "@/lib/compliance-definitions";
import {
  ChevronDown, ChevronRight, Upload, FileText, CheckCircle2,
  Clock, XCircle, AlertTriangle, Minus,
} from "lucide-react";

const STATUS_CONFIG = {
  completed: { label: "Completed", color: "bg-emerald-500/15 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  expiring_soon: { label: "Expiring Soon", color: "bg-amber-500/15 text-amber-700 border-amber-200", icon: AlertTriangle },
  expired: { label: "Expired", color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
  in_progress: { label: "In Progress", color: "bg-blue-500/15 text-blue-700 border-blue-200", icon: Clock },
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground border-border", icon: Minus },
  not_applicable: { label: "N/A", color: "bg-muted/50 text-muted-foreground/60 border-border/50", icon: Minus },
};

function expiryCountdown(expiryDate: string | null): string | null {
  if (!expiryDate) return null;
  const diff = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Expired ${Math.abs(diff)} days ago`;
  if (diff === 0) return "Expires today";
  return `Expires in ${diff} days`;
}

export function StaffComplianceTab({ staffId }: { staffId: string }) {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canEdit = role === "admin" || role === "house_manager";
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Fetch role flags
  const { data: roleFlags } = useQuery({
    queryKey: ["staff-role-flags", staffId],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff_role_flags")
        .select("*")
        .eq("staff_id", staffId)
        .maybeSingle();
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
      transports_participants: roleFlags.transports_participants,
      supports_under_18: roleFlags.supports_under_18,
    };
  }, [roleFlags]);

  // Fetch compliance items
  const { data: complianceRecords = [] } = useQuery({
    queryKey: ["staff-compliance-items", staffId],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff_compliance_items")
        .select("*")
        .eq("staff_id", staffId);
      return data || [];
    },
  });

  const recordsMap = useMemo(() => {
    const map = new Map<string, any>();
    complianceRecords.forEach((r) => map.set(r.item_key, r));
    return map;
  }, [complianceRecords]);

  const score = useMemo(() =>
    calculateComplianceScore(COMPLIANCE_ITEMS, recordsMap, flags),
    [recordsMap, flags]
  );

  const scoreColor = score === 100 ? "text-emerald-600" : score >= 80 ? "text-amber-600" : "text-destructive";

  // Toggle role flag mutation
  const toggleFlag = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      if (roleFlags) {
        const { error } = await supabase
          .from("staff_role_flags")
          .update({ [key]: value })
          .eq("staff_id", staffId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("staff_role_flags")
          .insert({ staff_id: staffId, [key]: value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-role-flags", staffId] });
    },
  });

  // Upsert compliance item
  const upsertItem = useMutation({
    mutationFn: async (payload: {
      item_key: string;
      status: string;
      date_completed?: string | null;
      expiry_date?: string | null;
      document_url?: string | null;
      verified_by?: string | null;
      verified_date?: string | null;
      notes?: string | null;
    }) => {
      const existing = recordsMap.get(payload.item_key);
      if (existing) {
        const { error } = await supabase
          .from("staff_compliance_items")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("staff_compliance_items")
          .insert({ staff_id: staffId, ...payload });
        if (error) throw error;
      }

      // Auto-sync linked items
      const def = COMPLIANCE_ITEMS.find((i) => i.item_key === payload.item_key);
      const linkedItems = COMPLIANCE_ITEMS.filter((i) => i.linked_to === payload.item_key);
      for (const linked of linkedItems) {
        const existingLinked = recordsMap.get(linked.item_key);
        const syncPayload = {
          item_key: linked.item_key,
          status: payload.status,
          date_completed: payload.date_completed,
          expiry_date: payload.expiry_date,
          document_url: payload.document_url,
          verified_by: payload.verified_by,
          verified_date: payload.verified_date,
        };
        if (existingLinked) {
          await supabase.from("staff_compliance_items")
            .update({ ...syncPayload, updated_at: new Date().toISOString() })
            .eq("id", existingLinked.id);
        } else {
          await supabase.from("staff_compliance_items")
            .insert({ staff_id: staffId, ...syncPayload });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-compliance-items", staffId] });
      setExpandedItem(null);
      toast({ title: "Compliance item updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  // Upload document
  const uploadDocument = async (file: File, itemKey: string) => {
    const path = `staff-compliance/${staffId}/${itemKey}/${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload error", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
    return urlData.publicUrl;
  };

  return (
    <div className="space-y-6">
      {/* Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${scoreColor}`}>{score}%</div>
              <p className="text-sm text-muted-foreground mt-1">Compliance Score</p>
            </div>
            <div className="flex-1">
              <Progress
                value={score}
                className="h-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Toggles */}
      {canEdit && (
        <Card>
          <CardHeader><CardTitle className="text-base">Role Flags</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLE_FLAG_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <Label className="text-sm font-normal cursor-pointer" htmlFor={`flag-${key}`}>
                    {ROLE_FLAG_LABELS[key]}
                  </Label>
                  <Switch
                    id={`flag-${key}`}
                    checked={(flags as any)[key] || false}
                    onCheckedChange={(v) => toggleFlag.mutate({ key, value: v })}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Items by Category */}
      {CATEGORIES.map((category) => {
        const items = COMPLIANCE_ITEMS.filter((i) => i.category === category);
        const applicableItems = items.filter((i) => isItemApplicable(i, flags));
        if (applicableItems.length === 0 && category === "Role-Specific") {
          return (
            <Card key={category}>
              <CardHeader><CardTitle className="text-base">{category}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No role-specific items apply. Enable role flags above to see relevant items.</p>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={category}>
            <CardHeader><CardTitle className="text-base">{category}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => {
                const applicable = isItemApplicable(item, flags);
                if (!applicable && category === "Role-Specific") return null;
                const record = recordsMap.get(item.item_key);
                const status = getItemStatus(item, record, flags);
                const cfg = STATUS_CONFIG[status];
                const Icon = cfg.icon;
                const isExpanded = expandedItem === item.item_key;
                const countdown = item.has_expiry ? expiryCountdown(record?.expiry_date) : null;

                return (
                  <Collapsible key={item.item_key} open={isExpanded} onOpenChange={() => setExpandedItem(isExpanded ? null : item.item_key)}>
                    <CollapsibleTrigger asChild>
                      <div className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors ${!applicable ? 'opacity-50' : ''}`}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          {countdown && <p className="text-xs text-muted-foreground">{countdown}</p>}
                        </div>
                        <Badge className={cfg.color + " hover:" + cfg.color.split(" ")[0]}>{cfg.label}</Badge>
                        {record?.document_url && <FileText className="h-4 w-4 text-emerald-600 shrink-0" />}
                        {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {canEdit && applicable && (
                        <ComplianceItemForm
                          item={item}
                          record={record}
                          isSaving={upsertItem.isPending}
                          onSave={(data) => upsertItem.mutate({ item_key: item.item_key, ...data })}
                          onUpload={async (file) => {
                            const url = await uploadDocument(file, item.item_key);
                            if (url) {
                              upsertItem.mutate({
                                item_key: item.item_key,
                                status: record?.status || "not_started",
                                document_url: url,
                              });
                            }
                          }}
                        />
                      )}
                      {!canEdit && (
                        <div className="p-3 ml-7 text-sm text-muted-foreground space-y-1">
                          <p>{item.description}</p>
                          {record?.date_completed && <p>Completed: {record.date_completed}</p>}
                          {record?.expiry_date && <p>Expiry: {record.expiry_date}</p>}
                          {record?.notes && <p>Notes: {record.notes}</p>}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ComplianceItemForm({
  item,
  record,
  isSaving,
  onSave,
  onUpload,
}: {
  item: ComplianceItemDefinition;
  record: any;
  isSaving?: boolean;
  onSave: (data: any) => void;
  onUpload: (file: File) => void;
}) {
  const [status, setStatus] = useState(record?.status || "not_started");
  const [dateCompleted, setDateCompleted] = useState(record?.date_completed || "");
  const [expiryDate, setExpiryDate] = useState(record?.expiry_date || "");
  const [notes, setNotes] = useState(record?.notes || "");
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="p-3 ml-7 space-y-3 border-l-2 border-border">
      <p className="text-xs text-muted-foreground">{item.description}</p>
      <div className="grid grid-cols-2 gap-3">
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
      </div>
      {item.has_expiry && (
        <div>
          <Label className="text-xs">Expiry Date</Label>
          <Input type="date" className="h-8 text-xs" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
      )}
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea className="text-xs min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf,.jpg,.jpeg,.png";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) onUpload(file);
            };
            input.click();
          }}
        >
          <Upload className="h-3 w-3 mr-1" />Upload Document
        </Button>
        {record?.document_url && (
          <a href={record.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
            <FileText className="h-3 w-3" />View Document
          </a>
        )}
      </div>
      <Button
        size="sm"
        onClick={() => onSave({
          status,
          date_completed: dateCompleted || null,
          expiry_date: expiryDate || null,
          notes: notes || null,
        })}
      >
        Save
      </Button>
    </div>
  );
}
