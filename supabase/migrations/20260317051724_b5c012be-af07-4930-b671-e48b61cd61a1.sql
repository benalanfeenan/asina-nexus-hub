
-- ============================================
-- PHASE 1: NDIS ALL IN ONE - COMPLETE SCHEMA
-- ============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'house_manager', 'support_worker');
CREATE TYPE public.shift_type AS ENUM ('morning', 'afternoon', 'night', 'sleepover', 'active_night');
CREATE TYPE public.shift_status AS ENUM ('draft', 'published', 'confirmed', 'completed', 'cancelled');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.risk_likelihood AS ENUM ('rare', 'unlikely', 'possible', 'likely', 'almost_certain');
CREATE TYPE public.risk_consequence AS ENUM ('insignificant', 'minor', 'moderate', 'major', 'catastrophic');
CREATE TYPE public.restrictive_practice_type AS ENUM ('chemical', 'mechanical', 'physical', 'seclusion', 'environmental');
CREATE TYPE public.complaint_status AS ENUM ('received', 'acknowledged', 'investigating', 'resolved', 'closed');
CREATE TYPE public.hazard_status AS ENUM ('identified', 'assessed', 'controlled', 'eliminated');
CREATE TYPE public.maintenance_status AS ENUM ('reported', 'scheduled', 'in_progress', 'completed');
CREATE TYPE public.contact_type AS ENUM ('emergency', 'guardian', 'gp', 'pharmacy', 'specialist', 'other');
CREATE TYPE public.goal_status AS ENUM ('not_started', 'in_progress', 'achieved', 'discontinued');
CREATE TYPE public.compliance_check_type AS ENUM ('ndis_wsc', 'wwcc', 'first_aid', 'cpr', 'police_check', 'drivers_license', 'other');
CREATE TYPE public.document_category AS ENUM ('policy', 'procedure', 'form', 'template', 'training', 'compliance', 'other');
CREATE TYPE public.rate_type AS ENUM ('standard', 'saturday', 'sunday', 'public_holiday', 'overtime', 'sleepover');

-- 2. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. HAS_ROLE SECURITY DEFINER FUNCTION
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SIL HOUSES
CREATE TABLE public.sil_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  capacity INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sil_houses ENABLE ROW LEVEL SECURITY;

-- 7. PARTICIPANTS
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  ndis_number TEXT,
  sil_house_id UUID REFERENCES public.sil_houses(id),
  phone TEXT,
  email TEXT,
  address TEXT,
  alerts JSONB DEFAULT '{}',
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- 8. PARTICIPANT CONTACTS
CREATE TABLE public.participant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  contact_type contact_type NOT NULL DEFAULT 'other',
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.participant_contacts ENABLE ROW LEVEL SECURITY;

-- 9. PARTICIPANT GOALS
CREATE TABLE public.participant_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  status goal_status NOT NULL DEFAULT 'not_started',
  target_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.participant_goals ENABLE ROW LEVEL SECURITY;

-- 10. PARTICIPANT DAILY ROUTINES
CREATE TABLE public.participant_daily_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  time_of_day TEXT NOT NULL,
  routine_description TEXT NOT NULL,
  support_required TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.participant_daily_routines ENABLE ROW LEVEL SECURITY;

-- 11. PARTICIPANT SUPPORT NEEDS
CREATE TABLE public.participant_support_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  support_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.participant_support_needs ENABLE ROW LEVEL SECURITY;

-- 12. MEDICATIONS
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT,
  frequency TEXT,
  route TEXT,
  prescriber TEXT,
  is_prn BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- 13. MAR RECORDS
CREATE TABLE public.mar_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  administered_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mar_records ENABLE ROW LEVEL SECURITY;

-- 14. PRN RECORDS
CREATE TABLE public.prn_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  administered_by UUID REFERENCES auth.users(id),
  administered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prn_records ENABLE ROW LEVEL SECURITY;

-- 15. STAFF
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position TEXT,
  employment_type TEXT DEFAULT 'casual',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id)
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- 16. STAFF TRAINING
CREATE TABLE public.staff_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  provider TEXT,
  completion_date DATE,
  expiry_date DATE,
  certificate_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_training ENABLE ROW LEVEL SECURITY;

-- 17. STAFF COMPLIANCE
CREATE TABLE public.staff_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  check_type compliance_check_type NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  reference_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_compliance ENABLE ROW LEVEL SECURITY;

-- 18. SIL HOUSE JUNCTIONS
CREATE TABLE public.sil_house_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id UUID NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  move_in_date DATE,
  move_out_date DATE,
  is_current BOOLEAN DEFAULT true,
  UNIQUE (sil_house_id, participant_id)
);
ALTER TABLE public.sil_house_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sil_house_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id UUID NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  UNIQUE (sil_house_id, staff_id)
);
ALTER TABLE public.sil_house_staff ENABLE ROW LEVEL SECURITY;

-- 19. PROPERTY MAINTENANCE
CREATE TABLE public.property_maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id UUID NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status maintenance_status NOT NULL DEFAULT 'reported',
  scheduled_date DATE,
  completed_date DATE,
  contractor TEXT,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.property_maintenance_log ENABLE ROW LEVEL SECURITY;

-- 20. SHIFTS
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id UUID NOT NULL REFERENCES public.sil_houses(id),
  staff_id UUID REFERENCES public.staff(id),
  date DATE NOT NULL,
  shift_type shift_type NOT NULL,
  start_time TIME,
  end_time TIME,
  status shift_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- 21. RECURRING ROSTER PATTERNS
CREATE TABLE public.recurring_roster_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id UUID NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff(id),
  day_of_week INTEGER NOT NULL,
  shift_type shift_type NOT NULL,
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_roster_patterns ENABLE ROW LEVEL SECURITY;

-- 22. TIMESHEETS
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id),
  staff_id UUID NOT NULL REFERENCES public.staff(id),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER DEFAULT 0,
  hours DECIMAL(5,2),
  rate_type rate_type NOT NULL DEFAULT 'standard',
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- 23. PUBLIC HOLIDAYS
CREATE TABLE public.public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  state TEXT DEFAULT 'VIC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

-- 24. PROGRESS NOTES
CREATE TABLE public.progress_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id),
  staff_id UUID NOT NULL REFERENCES auth.users(id),
  shift_id UUID REFERENCES public.shifts(id),
  content TEXT NOT NULL,
  goal_progress JSONB DEFAULT '[]',
  concerns_flagged BOOLEAN DEFAULT false,
  concern_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;

-- 25. NDIS PRICE LIST
CREATE TABLE public.ndis_price_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT DEFAULT 'each',
  rate DECIMAL(10,2) NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ndis_price_list ENABLE ROW LEVEL SECURITY;

-- 26. INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id),
  invoice_number TEXT NOT NULL UNIQUE,
  status invoice_status NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 27. INVOICE LINE ITEMS
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  ndis_line_item_code TEXT,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  service_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- 28. BOARD & LODGING INVOICES
CREATE TABLE public.board_lodging_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.board_lodging_invoices ENABLE ROW LEVEL SECURITY;

-- 29. AUTO REFERENCE SEQUENCES
CREATE TABLE public.auto_reference_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  UNIQUE (type, year)
);
ALTER TABLE public.auto_reference_sequences ENABLE ROW LEVEL SECURITY;

-- 30. FUNCTION TO GENERATE NEXT REFERENCE
CREATE OR REPLACE FUNCTION public.next_reference(ref_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER;
  next_num INTEGER;
  prefix TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO auto_reference_sequences (type, year, last_number)
  VALUES (ref_type, current_year, 1)
  ON CONFLICT (type, year)
  DO UPDATE SET last_number = auto_reference_sequences.last_number + 1
  RETURNING last_number INTO next_num;

  prefix := UPPER(LEFT(ref_type, 3));
  RETURN prefix || '-' || current_year || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$;

-- 31. INCIDENTS
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT public.next_reference('incident'),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_flags JSONB DEFAULT '{}',
  severity incident_severity NOT NULL DEFAULT 'low',
  is_reportable BOOLEAN DEFAULT false,
  participant_id UUID REFERENCES public.participants(id),
  sil_house_id UUID REFERENCES public.sil_houses(id),
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  date_occurred TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_reported TIMESTAMPTZ NOT NULL DEFAULT now(),
  immediate_actions TEXT,
  investigation_findings TEXT,
  root_cause TEXT,
  corrective_actions TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- 32. COMPLAINTS
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT public.next_reference('complaint'),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  complainant_name TEXT,
  complainant_contact TEXT,
  status complaint_status NOT NULL DEFAULT 'received',
  acknowledgement_date DATE,
  resolution_date DATE,
  resolution_details TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- 33. RISKS
CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  likelihood risk_likelihood NOT NULL DEFAULT 'possible',
  consequence risk_consequence NOT NULL DEFAULT 'moderate',
  risk_rating INTEGER GENERATED ALWAYS AS (
    (CASE likelihood
      WHEN 'rare' THEN 1
      WHEN 'unlikely' THEN 2
      WHEN 'possible' THEN 3
      WHEN 'likely' THEN 4
      WHEN 'almost_certain' THEN 5
    END) *
    (CASE consequence
      WHEN 'insignificant' THEN 1
      WHEN 'minor' THEN 2
      WHEN 'moderate' THEN 3
      WHEN 'major' THEN 4
      WHEN 'catastrophic' THEN 5
    END)
  ) STORED,
  existing_controls TEXT,
  additional_controls TEXT,
  responsible_person TEXT,
  review_date DATE,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- 34. HAZARDS
CREATE TABLE public.hazards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id UUID REFERENCES public.sil_houses(id),
  description TEXT NOT NULL,
  location TEXT,
  status hazard_status NOT NULL DEFAULT 'identified',
  risk_level TEXT DEFAULT 'medium',
  photo_url TEXT,
  reported_by UUID REFERENCES auth.users(id),
  control_measures TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hazards ENABLE ROW LEVEL SECURITY;

-- 35. RESTRICTIVE PRACTICES
CREATE TABLE public.restrictive_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id),
  practice_type restrictive_practice_type NOT NULL,
  description TEXT NOT NULL,
  antecedent TEXT,
  duration_minutes INTEGER,
  outcome TEXT,
  is_authorised BOOLEAN DEFAULT false,
  authorised_by TEXT,
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  date_occurred TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.restrictive_practices ENABLE ROW LEVEL SECURITY;

-- 36. QUALITY IMPROVEMENTS
CREATE TABLE public.quality_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT,
  source_id UUID,
  description TEXT NOT NULL,
  action_required TEXT,
  responsible_person TEXT,
  due_date DATE,
  status TEXT DEFAULT 'open',
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quality_improvements ENABLE ROW LEVEL SECURITY;

-- 37. DOCUMENTS
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category document_category NOT NULL DEFAULT 'other',
  file_url TEXT,
  version TEXT DEFAULT '1.0',
  review_date DATE,
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 38. SHIFT HANDOVERS
CREATE TABLE public.shift_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id),
  sil_house_id UUID NOT NULL REFERENCES public.sil_houses(id),
  outgoing_staff_id UUID NOT NULL REFERENCES auth.users(id),
  incoming_staff_id UUID REFERENCES auth.users(id),
  content JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shift_handovers ENABLE ROW LEVEL SECURITY;

-- 39. SLEEPOVER LOGS
CREATE TABLE public.sleepover_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id),
  participant_id UUID REFERENCES public.participants(id),
  staff_id UUID NOT NULL REFERENCES auth.users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  reason TEXT,
  active_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sleepover_logs ENABLE ROW LEVEL SECURITY;

-- 40. ORGANISATION SETTINGS
CREATE TABLE public.organisation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Asina Disability Services',
  abn TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  bank_details JSONB DEFAULT '{}',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organisation_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: users can read own, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- User roles: only admins manage, users can read own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- For all other tables, admins get full access, authenticated users get read
-- SIL Houses
CREATE POLICY "Authenticated users can view sil_houses" ON public.sil_houses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sil_houses" ON public.sil_houses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "House managers can manage sil_houses" ON public.sil_houses FOR ALL USING (public.has_role(auth.uid(), 'house_manager'));

-- Participants
CREATE POLICY "Authenticated can view participants" ON public.participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage participants" ON public.participants FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "House managers can manage participants" ON public.participants FOR ALL USING (public.has_role(auth.uid(), 'house_manager'));

-- Participant contacts
CREATE POLICY "Authenticated can view participant_contacts" ON public.participant_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage participant_contacts" ON public.participant_contacts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "House managers can manage participant_contacts" ON public.participant_contacts FOR ALL USING (public.has_role(auth.uid(), 'house_manager'));

-- Participant goals
CREATE POLICY "Authenticated can view participant_goals" ON public.participant_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage participant_goals" ON public.participant_goals FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "House managers can manage participant_goals" ON public.participant_goals FOR ALL USING (public.has_role(auth.uid(), 'house_manager'));

-- Participant daily routines
CREATE POLICY "Authenticated can view daily_routines" ON public.participant_daily_routines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage daily_routines" ON public.participant_daily_routines FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Participant support needs
CREATE POLICY "Authenticated can view support_needs" ON public.participant_support_needs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage support_needs" ON public.participant_support_needs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Medications
CREATE POLICY "Authenticated can view medications" ON public.medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage medications" ON public.medications FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "House managers can manage medications" ON public.medications FOR ALL USING (public.has_role(auth.uid(), 'house_manager'));

-- MAR records
CREATE POLICY "Authenticated can view mar_records" ON public.mar_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert mar_records" ON public.mar_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage mar_records" ON public.mar_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PRN records
CREATE POLICY "Authenticated can view prn_records" ON public.prn_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert prn_records" ON public.prn_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage prn_records" ON public.prn_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Staff
CREATE POLICY "Authenticated can view staff" ON public.staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage staff" ON public.staff FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Staff training
CREATE POLICY "Authenticated can view staff_training" ON public.staff_training FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage staff_training" ON public.staff_training FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Staff compliance
CREATE POLICY "Authenticated can view staff_compliance" ON public.staff_compliance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage staff_compliance" ON public.staff_compliance FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- SIL house junctions
CREATE POLICY "Authenticated can view sil_house_participants" ON public.sil_house_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sil_house_participants" ON public.sil_house_participants FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view sil_house_staff" ON public.sil_house_staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sil_house_staff" ON public.sil_house_staff FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Property maintenance
CREATE POLICY "Authenticated can view maintenance" ON public.property_maintenance_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert maintenance" ON public.property_maintenance_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage maintenance" ON public.property_maintenance_log FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Shifts
CREATE POLICY "Authenticated can view shifts" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage shifts" ON public.shifts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "House managers can manage shifts" ON public.shifts FOR ALL USING (public.has_role(auth.uid(), 'house_manager'));

-- Recurring roster patterns
CREATE POLICY "Authenticated can view roster_patterns" ON public.recurring_roster_patterns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roster_patterns" ON public.recurring_roster_patterns FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Timesheets
CREATE POLICY "Staff can view own timesheets" ON public.timesheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert timesheets" ON public.timesheets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage timesheets" ON public.timesheets FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "House managers can manage timesheets" ON public.timesheets FOR ALL USING (public.has_role(auth.uid(), 'house_manager'));

-- Public holidays
CREATE POLICY "Authenticated can view public_holidays" ON public.public_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage public_holidays" ON public.public_holidays FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Progress notes
CREATE POLICY "Authenticated can view progress_notes" ON public.progress_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert progress_notes" ON public.progress_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage progress_notes" ON public.progress_notes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- NDIS price list
CREATE POLICY "Authenticated can view ndis_price_list" ON public.ndis_price_list FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ndis_price_list" ON public.ndis_price_list FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Invoices
CREATE POLICY "Authenticated can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Invoice line items
CREATE POLICY "Authenticated can view invoice_line_items" ON public.invoice_line_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage invoice_line_items" ON public.invoice_line_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Board lodging invoices
CREATE POLICY "Authenticated can view board_lodging" ON public.board_lodging_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage board_lodging" ON public.board_lodging_invoices FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto reference sequences (admin only)
CREATE POLICY "Admins can manage sequences" ON public.auto_reference_sequences FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Incidents
CREATE POLICY "Authenticated can view incidents" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert incidents" ON public.incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage incidents" ON public.incidents FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Complaints
CREATE POLICY "Authenticated can view complaints" ON public.complaints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage complaints" ON public.complaints FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Risks
CREATE POLICY "Authenticated can view risks" ON public.risks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage risks" ON public.risks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Hazards
CREATE POLICY "Authenticated can view hazards" ON public.hazards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert hazards" ON public.hazards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage hazards" ON public.hazards FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Restrictive practices
CREATE POLICY "Authenticated can view restrictive_practices" ON public.restrictive_practices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert restrictive_practices" ON public.restrictive_practices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage restrictive_practices" ON public.restrictive_practices FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Quality improvements
CREATE POLICY "Authenticated can view quality_improvements" ON public.quality_improvements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quality_improvements" ON public.quality_improvements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Documents
CREATE POLICY "Authenticated can view documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage documents" ON public.documents FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Shift handovers
CREATE POLICY "Authenticated can view shift_handovers" ON public.shift_handovers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert shift_handovers" ON public.shift_handovers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage shift_handovers" ON public.shift_handovers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sleepover logs
CREATE POLICY "Authenticated can view sleepover_logs" ON public.sleepover_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sleepover_logs" ON public.sleepover_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage sleepover_logs" ON public.sleepover_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Organisation settings
CREATE POLICY "Authenticated can view org_settings" ON public.organisation_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage org_settings" ON public.organisation_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default organisation settings
INSERT INTO public.organisation_settings (name) VALUES ('Asina Disability Services');
