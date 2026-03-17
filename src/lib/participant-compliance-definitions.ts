export interface ParticipantComplianceItem {
  item_key: string;
  name: string;
  description: string;
  category: "Pre-Support" | "Onboarding" | "Higher Needs" | "Ongoing Review";
  requires_document: boolean;
  has_expiry: boolean;
  expiry_months: number | null;
  is_mandatory: boolean;
  conditional_on: string | null; // key in participant.alerts JSON
  display_order: number;
}

export const PARTICIPANT_COMPLIANCE_ITEMS: ParticipantComplianceItem[] = [
  // Pre-Support
  { item_key: "service_agreement", name: "Signed Service Agreement", description: "Service agreement signed by participant/nominee before supports commence", category: "Pre-Support", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 1 },
  { item_key: "consent_form", name: "Consent Form", description: "General consent form signed by participant/nominee", category: "Pre-Support", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 2 },
  { item_key: "ndis_plan_copy", name: "NDIS Plan Copy on File", description: "Copy of participant's current NDIS plan on file", category: "Pre-Support", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 3 },
  { item_key: "privacy_consent", name: "Privacy & Consent Notice", description: "Privacy and consent notice provided and acknowledged", category: "Pre-Support", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 4 },
  { item_key: "rights_responsibilities", name: "Rights & Responsibilities Explained", description: "Participant rights and responsibilities explained and acknowledged", category: "Pre-Support", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 5 },
  { item_key: "schedule_of_supports", name: "Schedule of Supports", description: "Schedule of supports document on file before service delivery begins", category: "Pre-Support", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 6 },
  { item_key: "consent_to_share", name: "Consent to Share Information", description: "Signed consent to share information with relevant parties (support coordinators, allied health, etc.)", category: "Pre-Support", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 7 },

  // Onboarding
  { item_key: "support_plan", name: "Individual Support Plan Developed", description: "Individual support plan developed in collaboration with participant", category: "Onboarding", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 10 },
  { item_key: "risk_assessment", name: "Risk Assessment Completed", description: "Individual risk assessment completed", category: "Onboarding", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 11 },
  { item_key: "communication_plan", name: "Communication Plan", description: "Communication plan developed for participant", category: "Onboarding", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 12 },
  { item_key: "emergency_plan", name: "Emergency Plan", description: "Individual emergency plan on file", category: "Onboarding", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 13 },
  { item_key: "key_contacts_verified", name: "Key Contact Details Verified", description: "Key contact details verified and up to date", category: "Onboarding", requires_document: false, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 14 },
  { item_key: "consent_for_media", name: "Consent for Media", description: "Signed media consent form (photos, videos for promotional or internal use)", category: "Onboarding", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, display_order: 15 },

  // Higher Needs (conditional)
  { item_key: "bsp_on_file", name: "Behaviour Support Plan on File", description: "Current BSP on file and accessible to all relevant staff", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "bsp", display_order: 20 },
  { item_key: "bsp_staff_briefing", name: "BSP Staff Briefing Completed", description: "All relevant staff briefed on participant's BSP", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "bsp", display_order: 21 },
  { item_key: "restrictive_practice_auth", name: "Restrictive Practice Authorisation", description: "Restrictive practice authorisation documentation on file", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "restrictive_practices", display_order: 22 },
  { item_key: "mealtime_plan_on_file", name: "Mealtime Management Plan on File", description: "Current mealtime management plan on file", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "mealtime_plan", display_order: 23 },
  { item_key: "iddsi_documented", name: "IDDSI Level Documented", description: "IDDSI texture level documented and communicated to staff", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "mealtime_plan", display_order: 24 },
  { item_key: "allergy_action_plan", name: "Allergy Action Plan on File", description: "Allergy action plan on file with emergency protocols", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "allergies", display_order: 25 },
  { item_key: "epipen_protocols", name: "Medication/EpiPen Protocols", description: "EpiPen and medication emergency protocols documented", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "allergies", display_order: 26 },
  { item_key: "high_intensity_plan", name: "High Intensity Support Plan", description: "High intensity support plan on file", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "high_intensity", display_order: 27 },
  { item_key: "medication_prescriptions", name: "Medication Authority/Prescriptions on File", description: "Current prescriptions and medication authority on file", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "medications", display_order: 28 },
  { item_key: "medication_admin_plan", name: "Medication Administration Plan", description: "Medication administration plan documented with dose, route, frequency", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "medications", display_order: 29 },
  { item_key: "medication_staff_signoff", name: "Medication Competency Staff Sign-Off", description: "Staff competency sign-off for administering participant's medications", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "medications", display_order: 30 },
  { item_key: "medication_storage", name: "Medication Storage Requirements Documented", description: "Safe storage requirements documented (e.g. fridge, locked cupboard)", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "medications", display_order: 31 },
  { item_key: "prn_protocol", name: "PRN Protocol on File", description: "PRN (as needed) medication protocol documented with triggers and limits", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "medications", display_order: 32 },
  { item_key: "manual_handling_risk_assessment", name: "Manual Handling Risk Assessment", description: "Individual manual handling risk assessment on file", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "manual_handling", display_order: 33 },
  { item_key: "manual_handling_plan", name: "Manual Handling Plan on File", description: "Documented manual handling/transfer plan for the participant", category: "Higher Needs", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "manual_handling", display_order: 34 },

  // Ongoing Review
  { item_key: "service_agreement_review", name: "Service Agreement Review (annual)", description: "Annual review of service agreement", category: "Ongoing Review", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, display_order: 35 },
  { item_key: "support_plan_review", name: "Support Plan Review (6-monthly)", description: "6-monthly review of individual support plan", category: "Ongoing Review", requires_document: true, has_expiry: true, expiry_months: 6, is_mandatory: true, conditional_on: null, display_order: 36 },
  { item_key: "risk_assessment_review", name: "Risk Assessment Review (annual)", description: "Annual review of risk assessment", category: "Ongoing Review", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, display_order: 37 },
  { item_key: "goal_progress_review", name: "Goal Progress Review (quarterly)", description: "Quarterly review of participant goal progress", category: "Ongoing Review", requires_document: false, has_expiry: true, expiry_months: 3, is_mandatory: true, conditional_on: null, display_order: 38 },
];

export const PARTICIPANT_COMPLIANCE_CATEGORIES = ["Pre-Support", "Onboarding", "Higher Needs", "Ongoing Review"] as const;

export const PARTICIPANT_NEEDS_FLAG_LABELS: Record<string, string> = {
  allergies: "Allergies",
  bsp: "Behaviour Support Plan (BSP)",
  mealtime_plan: "Mealtime Plan",
  restrictive_practices: "Restrictive Practices",
  high_intensity: "High Intensity Supports",
  medications: "Medications",
  manual_handling: "Manual Handling",
};

export const PARTICIPANT_NEEDS_FLAG_KEYS = Object.keys(PARTICIPANT_NEEDS_FLAG_LABELS);

export type ParticipantNeedsFlags = Record<string, boolean>;

export function isParticipantItemApplicable(item: ParticipantComplianceItem, flags: ParticipantNeedsFlags): boolean {
  if (!item.conditional_on) return true;
  return !!flags[item.conditional_on];
}

export function getParticipantItemStatus(
  item: ParticipantComplianceItem,
  record: { status: string; expiry_date: string | null } | undefined,
  flags: ParticipantNeedsFlags
): "completed" | "expired" | "expiring_soon" | "in_progress" | "not_started" | "not_applicable" {
  if (!isParticipantItemApplicable(item, flags)) return "not_applicable";
  if (!record || record.status === "not_started") return "not_started";
  if (record.status === "not_applicable") return "not_applicable";
  if (record.status === "in_progress") return "in_progress";
  if (record.status === "completed" || record.status === "expired") {
    if (item.has_expiry && record.expiry_date) {
      const diff = (new Date(record.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (diff < 0) return "expired";
      if (diff <= 30) return "expiring_soon";
    }
    if (record.status === "expired") return "expired";
    return "completed";
  }
  return "not_started";
}

export function calculateParticipantComplianceScore(
  items: ParticipantComplianceItem[],
  records: Map<string, { status: string; expiry_date: string | null }>,
  flags: ParticipantNeedsFlags
): number {
  const applicable = items.filter((i) => i.is_mandatory && isParticipantItemApplicable(i, flags));
  if (applicable.length === 0) return 100;
  const compliant = applicable.filter((i) => {
    const status = getParticipantItemStatus(i, records.get(i.item_key), flags);
    return status === "completed";
  });
  return Math.round((compliant.length / applicable.length) * 100);
}
