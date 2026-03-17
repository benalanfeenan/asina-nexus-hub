import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown } from "lucide-react";

interface StaffRecord {
  id: string;
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  position: string | null;
  employment_type: string | null;
  start_date: string | null;
  notes: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  pronouns?: string | null;
  sexuality?: string | null;
  address?: string | null;
  email?: string | null;
  is_cald?: boolean;
  country_of_birth?: string | null;
  languages_spoken?: string | null;
  interpreter_required?: boolean;
  indigenous_status?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  end_date?: string | null;
  probation_end_date?: string | null;
  pay_rate?: number | null;
  award_level?: string | null;
  tax_file_number_on_file?: boolean;
  superannuation_fund?: string | null;
  bank_details_on_file?: boolean;
  ndis_worker_id?: string | null;
  disability_status?: string | null;
  working_with_children_number?: string | null;
  ndis_screening_number?: string | null;
}

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editStaff?: StaffRecord | null;
}

function SectionHeader({ children, open }: { children: React.ReactNode; open?: boolean }) {
  return (
    <div className="flex items-center justify-between w-full py-2 font-medium text-sm">
      {children}
      <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
    </div>
  );
}

export function AddStaffDialog({ open, onOpenChange, editStaff }: AddStaffDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editStaff;

  const [form, setForm] = useState({
    firstName: "", lastName: "", profileId: "", phone: "", email: "",
    position: "", employmentType: "casual", startDate: "", endDate: "",
    dateOfBirth: "", gender: "", pronouns: "", sexuality: "", address: "",
    isCald: false, countryOfBirth: "", languagesSpoken: "", interpreterRequired: false, indigenousStatus: "",
    emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
    probationEndDate: "", payRate: "", awardLevel: "",
    taxFileNumberOnFile: false, superannuationFund: "", bankDetailsOnFile: false,
    ndisWorkerId: "", disabilityStatus: "", workingWithChildrenNumber: "", ndisScreeningNumber: "",
    notes: "",
  });

  useEffect(() => {
    if (editStaff) {
      setForm({
        firstName: editStaff.first_name || "",
        lastName: editStaff.last_name || "",
        profileId: editStaff.profile_id || "",
        phone: editStaff.phone || "",
        email: editStaff.email || "",
        position: editStaff.position || "",
        employmentType: editStaff.employment_type || "casual",
        startDate: editStaff.start_date || "",
        endDate: editStaff.end_date || "",
        dateOfBirth: editStaff.date_of_birth || "",
        gender: editStaff.gender || "",
        pronouns: editStaff.pronouns || "",
        sexuality: editStaff.sexuality || "",
        address: editStaff.address || "",
        isCald: editStaff.is_cald || false,
        countryOfBirth: editStaff.country_of_birth || "",
        languagesSpoken: editStaff.languages_spoken || "",
        interpreterRequired: editStaff.interpreter_required || false,
        indigenousStatus: editStaff.indigenous_status || "",
        emergencyContactName: editStaff.emergency_contact_name || "",
        emergencyContactPhone: editStaff.emergency_contact_phone || "",
        emergencyContactRelationship: editStaff.emergency_contact_relationship || "",
        probationEndDate: editStaff.probation_end_date || "",
        payRate: editStaff.pay_rate?.toString() || "",
        awardLevel: editStaff.award_level || "",
        taxFileNumberOnFile: editStaff.tax_file_number_on_file || false,
        superannuationFund: editStaff.superannuation_fund || "",
        bankDetailsOnFile: editStaff.bank_details_on_file || false,
        ndisWorkerId: editStaff.ndis_worker_id || "",
        disabilityStatus: editStaff.disability_status || "",
        workingWithChildrenNumber: editStaff.working_with_children_number || "",
        ndisScreeningNumber: editStaff.ndis_screening_number || "",
        notes: editStaff.notes || "",
      });
    } else {
      setForm({
        firstName: "", lastName: "", profileId: "", phone: "", email: "",
        position: "", employmentType: "casual", startDate: "", endDate: "",
        dateOfBirth: "", gender: "", pronouns: "", sexuality: "", address: "",
        isCald: false, countryOfBirth: "", languagesSpoken: "", interpreterRequired: false, indigenousStatus: "",
        emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
        probationEndDate: "", payRate: "", awardLevel: "",
        taxFileNumberOnFile: false, superannuationFund: "", bankDetailsOnFile: false,
        ndisWorkerId: "", disabilityStatus: "", workingWithChildrenNumber: "", ndisScreeningNumber: "",
        notes: "",
      });
    }
  }, [editStaff, open]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setBool = (key: string) => (val: boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));
  const setSelect = (key: string) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-staff"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data || [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        profile_id: form.profileId,
        first_name: form.firstName || null,
        last_name: form.lastName || null,
        phone: form.phone || null,
        email: form.email || null,
        position: form.position || null,
        employment_type: form.employmentType,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        date_of_birth: form.dateOfBirth || null,
        gender: form.gender || null,
        pronouns: form.pronouns || null,
        sexuality: form.sexuality || null,
        address: form.address || null,
        is_cald: form.isCald,
        country_of_birth: form.countryOfBirth || null,
        languages_spoken: form.languagesSpoken || null,
        interpreter_required: form.interpreterRequired,
        indigenous_status: form.indigenousStatus || null,
        emergency_contact_name: form.emergencyContactName || null,
        emergency_contact_phone: form.emergencyContactPhone || null,
        emergency_contact_relationship: form.emergencyContactRelationship || null,
        probation_end_date: form.probationEndDate || null,
        pay_rate: form.payRate ? parseFloat(form.payRate) : null,
        award_level: form.awardLevel || null,
        tax_file_number_on_file: form.taxFileNumberOnFile,
        superannuation_fund: form.superannuationFund || null,
        bank_details_on_file: form.bankDetailsOnFile,
        ndis_worker_id: form.ndisWorkerId || null,
        disability_status: form.disabilityStatus || null,
        working_with_children_number: form.workingWithChildrenNumber || null,
        ndis_screening_number: form.ndisScreeningNumber || null,
        notes: form.notes || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("staff").update(payload).eq("id", editStaff!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff").insert(payload as any);
        if (error) throw error;
      }
      if (form.profileId && (form.firstName || form.lastName)) {
        const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ");
        await supabase.from("profiles").update({ full_name: fullName }).eq("id", form.profileId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({ title: isEdit ? "Staff updated" : "Staff added" });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true, cultural: false, emergency: false, employment: false, ndis: false, notes: false,
  });
  const toggle = (s: string) => setOpenSections((p) => ({ ...p, [s]: !p[s] }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {/* Basic Info */}
          <Collapsible open={openSections.basic} onOpenChange={() => toggle("basic")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.basic}>Basic Information</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={form.firstName} onChange={set("firstName")} /></div>
                <div><Label>Last Name *</Label><Input value={form.lastName} onChange={set("lastName")} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} /></div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={setSelect("gender")}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non_binary">Non-Binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Pronouns</Label><Input value={form.pronouns} onChange={set("pronouns")} placeholder="e.g. she/her" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Sexuality</Label>
                  <Select value={form.sexuality} onValueChange={setSelect("sexuality")}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heterosexual">Heterosexual</SelectItem>
                      <SelectItem value="homosexual">Homosexual</SelectItem>
                      <SelectItem value="bisexual">Bisexual</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>User Profile (Login)</Label>
                  <Select value={form.profileId} onValueChange={setSelect("profileId")} disabled={isEdit}>
                    <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                    <SelectContent>
                      {profiles?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || p.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Address</Label><Input value={form.address} onChange={set("address")} /></div>
            </CollapsibleContent>
          </Collapsible>

          {/* Cultural & Language */}
          <Collapsible open={openSections.cultural} onOpenChange={() => toggle("cultural")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.cultural}>Cultural & Language</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.isCald} onCheckedChange={setBool("isCald")} />
                <Label>Culturally & Linguistically Diverse (CALD)</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Country of Birth</Label><Input value={form.countryOfBirth} onChange={set("countryOfBirth")} /></div>
                <div><Label>Languages Spoken</Label><Input value={form.languagesSpoken} onChange={set("languagesSpoken")} placeholder="e.g. English, Arabic" /></div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.interpreterRequired} onCheckedChange={setBool("interpreterRequired")} />
                <Label>Interpreter Required</Label>
              </div>
              <div>
                <Label>Indigenous Status</Label>
                <Select value={form.indigenousStatus} onValueChange={setSelect("indigenousStatus")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_indigenous">Non-Indigenous</SelectItem>
                    <SelectItem value="aboriginal">Aboriginal</SelectItem>
                    <SelectItem value="torres_strait_islander">Torres Strait Islander</SelectItem>
                    <SelectItem value="both">Aboriginal & Torres Strait Islander</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Emergency Contact */}
          <Collapsible open={openSections.emergency} onOpenChange={() => toggle("emergency")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.emergency}>Emergency Contact</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact Name</Label><Input value={form.emergencyContactName} onChange={set("emergencyContactName")} /></div>
                <div><Label>Contact Phone</Label><Input value={form.emergencyContactPhone} onChange={set("emergencyContactPhone")} /></div>
              </div>
              <div><Label>Relationship</Label><Input value={form.emergencyContactRelationship} onChange={set("emergencyContactRelationship")} placeholder="e.g. Spouse, Parent" /></div>
            </CollapsibleContent>
          </Collapsible>

          {/* Employment */}
          <Collapsible open={openSections.employment} onOpenChange={() => toggle("employment")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.employment}>Employment Details</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Position</Label><Input value={form.position} onChange={set("position")} placeholder="e.g. Support Worker" /></div>
                <div>
                  <Label>Employment Type</Label>
                  <Select value={form.employmentType} onValueChange={setSelect("employmentType")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="full_time">Full Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={set("startDate")} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={set("endDate")} /></div>
                <div><Label>Probation End</Label><Input type="date" value={form.probationEndDate} onChange={set("probationEndDate")} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Pay Rate ($/hr)</Label><Input type="number" step="0.01" value={form.payRate} onChange={set("payRate")} /></div>
                <div><Label>Award Level</Label><Input value={form.awardLevel} onChange={set("awardLevel")} placeholder="e.g. SCHADS Level 2.1" /></div>
              </div>
              <div><Label>Superannuation Fund</Label><Input value={form.superannuationFund} onChange={set("superannuationFund")} /></div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.taxFileNumberOnFile} onCheckedChange={setBool("taxFileNumberOnFile")} />
                  <Label>TFN on File</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.bankDetailsOnFile} onCheckedChange={setBool("bankDetailsOnFile")} />
                  <Label>Bank Details on File</Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* NDIS */}
          <Collapsible open={openSections.ndis} onOpenChange={() => toggle("ndis")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.ndis}>NDIS & Screening</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>NDIS Worker ID</Label><Input value={form.ndisWorkerId} onChange={set("ndisWorkerId")} /></div>
                <div><Label>NDIS Screening Number</Label><Input value={form.ndisScreeningNumber} onChange={set("ndisScreeningNumber")} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>WWCC Number</Label><Input value={form.workingWithChildrenNumber} onChange={set("workingWithChildrenNumber")} /></div>
                <div>
                  <Label>Disability Status</Label>
                  <Select value={form.disabilityStatus} onValueChange={setSelect("disabilityStatus")}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="disability">Has Disability</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Notes */}
          <Collapsible open={openSections.notes} onOpenChange={() => toggle("notes")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.notes}>Notes</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 pb-4">
              <Textarea value={form.notes} onChange={set("notes")} placeholder="Optional notes" rows={3} />
            </CollapsibleContent>
          </Collapsible>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.profileId || !form.firstName || !form.lastName || mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
