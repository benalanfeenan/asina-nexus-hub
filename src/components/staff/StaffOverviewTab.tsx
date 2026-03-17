import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StaffOverviewTabProps {
  staff: Record<string, any>;
  linkedHouses: any[];
  profile: { full_name: string; email: string | null; phone: string | null } | null;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

function BoolField({ label, value }: { label: string; value: boolean | undefined }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-sm">{value ? "Yes" : "No"}</p>
    </div>
  );
}

const GENDER_LABELS: Record<string, string> = {
  male: "Male", female: "Female", non_binary: "Non-Binary", other: "Other", prefer_not_to_say: "Prefer not to say",
};
const INDIGENOUS_LABELS: Record<string, string> = {
  non_indigenous: "Non-Indigenous", aboriginal: "Aboriginal", torres_strait_islander: "Torres Strait Islander", both: "Aboriginal & Torres Strait Islander", prefer_not_to_say: "Prefer not to say",
};

export function StaffOverviewTab({ staff, linkedHouses, profile }: StaffOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Personal */}
      <Card>
        <CardHeader><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="Email" value={staff.email || profile?.email} />
          <Field label="Phone" value={staff.phone || profile?.phone} />
          <Field label="Date of Birth" value={staff.date_of_birth} />
          <Field label="Gender" value={GENDER_LABELS[staff.gender] || staff.gender} />
          <Field label="Pronouns" value={staff.pronouns} />
          <Field label="Sexuality" value={staff.sexuality} />
          <Field label="Address" value={staff.address} />
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader><CardTitle className="text-base">Emergency Contact</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="Name" value={staff.emergency_contact_name} />
          <Field label="Phone" value={staff.emergency_contact_phone} />
          <Field label="Relationship" value={staff.emergency_contact_relationship} />
        </CardContent>
      </Card>

      {/* Cultural & Language */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cultural & Language</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <BoolField label="CALD" value={staff.is_cald} />
          <Field label="Country of Birth" value={staff.country_of_birth} />
          <Field label="Languages Spoken" value={staff.languages_spoken} />
          <BoolField label="Interpreter Required" value={staff.interpreter_required} />
          <Field label="Indigenous Status" value={INDIGENOUS_LABELS[staff.indigenous_status] || staff.indigenous_status} />
        </CardContent>
      </Card>

      {/* Employment */}
      <Card>
        <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="Position" value={staff.position} />
          <Field label="Employment Type" value={staff.employment_type?.replace("_", " ")} />
          <Field label="Start Date" value={staff.start_date} />
          <Field label="End Date" value={staff.end_date} />
          <Field label="Probation End" value={staff.probation_end_date} />
          <Field label="Pay Rate" value={staff.pay_rate ? `$${staff.pay_rate}/hr` : null} />
          <Field label="Award Level" value={staff.award_level} />
          <Field label="Super Fund" value={staff.superannuation_fund} />
          <BoolField label="TFN on File" value={staff.tax_file_number_on_file} />
          <BoolField label="Bank Details on File" value={staff.bank_details_on_file} />
        </CardContent>
      </Card>

      {/* NDIS & Screening */}
      <Card>
        <CardHeader><CardTitle className="text-base">NDIS & Screening</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="NDIS Worker ID" value={staff.ndis_worker_id} />
          <Field label="NDIS Screening #" value={staff.ndis_screening_number} />
          <Field label="WWCC #" value={staff.working_with_children_number} />
          <Field label="Disability Status" value={staff.disability_status} />
        </CardContent>
      </Card>

      {/* SIL Houses & Notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Linked SIL Houses</CardTitle></CardHeader>
        <CardContent>
          {linkedHouses.length === 0 ? (
            <p className="text-muted-foreground text-sm">Not assigned to any SIL houses.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {linkedHouses.map((h, i) => (
                <Badge key={i} variant="outline">{(h.sil_houses as any)?.name}</Badge>
              ))}
            </div>
          )}
          {staff.notes && (
            <div className="mt-4">
              <span className="text-muted-foreground text-xs">Notes</span>
              <p className="text-sm">{staff.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
