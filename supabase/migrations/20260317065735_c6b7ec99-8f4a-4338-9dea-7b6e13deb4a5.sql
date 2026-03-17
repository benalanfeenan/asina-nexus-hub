
-- ============================================
-- BATCH A: All remaining tables + storage bucket
-- ============================================

-- 1. Conflict of Interest Register
CREATE TABLE public.conflict_of_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  declaration_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  management_strategy text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.conflict_of_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage conflict_of_interest" ON public.conflict_of_interest FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage conflict_of_interest" ON public.conflict_of_interest FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view conflict_of_interest" ON public.conflict_of_interest FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert conflict_of_interest" ON public.conflict_of_interest FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Legislative Compliance Register
CREATE TABLE public.legislative_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_name text NOT NULL,
  description text,
  applicable_to text,
  review_date date,
  status text NOT NULL DEFAULT 'current',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.legislative_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage legislative_compliance" ON public.legislative_compliance FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view legislative_compliance" ON public.legislative_compliance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert legislative_compliance" ON public.legislative_compliance FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Insurance Register
CREATE TABLE public.insurance_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL,
  provider text,
  policy_number text,
  start_date date,
  expiry_date date,
  certificate_url text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage insurance_register" ON public.insurance_register FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view insurance_register" ON public.insurance_register FOR SELECT TO authenticated USING (true);

-- 4. Staff Supervisions
CREATE TABLE public.staff_supervisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  supervisor_id uuid,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL DEFAULT 'supervision',
  notes text,
  next_due date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_supervisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage staff_supervisions" ON public.staff_supervisions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage staff_supervisions" ON public.staff_supervisions FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view staff_supervisions" ON public.staff_supervisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert staff_supervisions" ON public.staff_supervisions FOR INSERT TO authenticated WITH CHECK (true);

-- 5. House Keys
CREATE TABLE public.house_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid REFERENCES public.sil_houses(id) ON DELETE CASCADE NOT NULL,
  key_number text NOT NULL,
  issued_to text,
  issued_date date,
  returned_date date,
  status text NOT NULL DEFAULT 'issued',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.house_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage house_keys" ON public.house_keys FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage house_keys" ON public.house_keys FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view house_keys" ON public.house_keys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert house_keys" ON public.house_keys FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Staff Competency Assessments
CREATE TABLE public.staff_competency_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  competency_type text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  assessor text,
  result text NOT NULL DEFAULT 'competent',
  next_due date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_competency_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage staff_competency_assessments" ON public.staff_competency_assessments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage staff_competency_assessments" ON public.staff_competency_assessments FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view staff_competency_assessments" ON public.staff_competency_assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert staff_competency_assessments" ON public.staff_competency_assessments FOR INSERT TO authenticated WITH CHECK (true);

-- 7. Staff Acknowledgements
CREATE TABLE public.staff_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  signed_date date NOT NULL DEFAULT CURRENT_DATE,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage staff_acknowledgements" ON public.staff_acknowledgements FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage staff_acknowledgements" ON public.staff_acknowledgements FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view staff_acknowledgements" ON public.staff_acknowledgements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert staff_acknowledgements" ON public.staff_acknowledgements FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Vehicle Inspections
CREATE TABLE public.vehicle_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  inspector_id uuid,
  checklist jsonb DEFAULT '{}',
  issues text,
  status text NOT NULL DEFAULT 'pass',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage vehicle_inspections" ON public.vehicle_inspections FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view vehicle_inspections" ON public.vehicle_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert vehicle_inspections" ON public.vehicle_inspections FOR INSERT TO authenticated WITH CHECK (true);

-- 9. Visitor Log
CREATE TABLE public.visitor_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid REFERENCES public.sil_houses(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  visitor_name text NOT NULL,
  purpose text,
  time_in time,
  time_out time,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.visitor_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage visitor_log" ON public.visitor_log FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage visitor_log" ON public.visitor_log FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view visitor_log" ON public.visitor_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert visitor_log" ON public.visitor_log FOR INSERT TO authenticated WITH CHECK (true);

-- 10. Hazardous Substances
CREATE TABLE public.hazardous_substances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid REFERENCES public.sil_houses(id) ON DELETE CASCADE NOT NULL,
  substance_name text NOT NULL,
  location text,
  sds_url text,
  risk_level text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hazardous_substances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage hazardous_substances" ON public.hazardous_substances FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage hazardous_substances" ON public.hazardous_substances FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view hazardous_substances" ON public.hazardous_substances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert hazardous_substances" ON public.hazardous_substances FOR INSERT TO authenticated WITH CHECK (true);

-- 11. Cleaning Schedules
CREATE TABLE public.cleaning_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid REFERENCES public.sil_houses(id) ON DELETE CASCADE NOT NULL,
  task text NOT NULL,
  frequency text NOT NULL DEFAULT 'daily',
  last_completed timestamptz,
  completed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cleaning_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage cleaning_schedules" ON public.cleaning_schedules FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage cleaning_schedules" ON public.cleaning_schedules FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view cleaning_schedules" ON public.cleaning_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert cleaning_schedules" ON public.cleaning_schedules FOR INSERT TO authenticated WITH CHECK (true);

-- 12. Participant Documents
CREATE TABLE public.participant_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  title text NOT NULL,
  file_url text,
  uploaded_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  version text DEFAULT '1.0',
  status text NOT NULL DEFAULT 'current',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.participant_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage participant_documents" ON public.participant_documents FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage participant_documents" ON public.participant_documents FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view participant_documents" ON public.participant_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert participant_documents" ON public.participant_documents FOR INSERT TO authenticated WITH CHECK (true);

-- 13. Staff Documents
CREATE TABLE public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  title text NOT NULL,
  file_url text,
  uploaded_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage staff_documents" ON public.staff_documents FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage staff_documents" ON public.staff_documents FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view staff_documents" ON public.staff_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert staff_documents" ON public.staff_documents FOR INSERT TO authenticated WITH CHECK (true);

-- 14. Meeting Minutes
CREATE TABLE public.meeting_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type text NOT NULL DEFAULT 'management',
  sil_house_id uuid REFERENCES public.sil_houses(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  attendees text,
  agenda text,
  minutes text NOT NULL,
  actions text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage meeting_minutes" ON public.meeting_minutes FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage meeting_minutes" ON public.meeting_minutes FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view meeting_minutes" ON public.meeting_minutes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert meeting_minutes" ON public.meeting_minutes FOR INSERT TO authenticated WITH CHECK (true);

-- 15. Participant Surveys
CREATE TABLE public.participant_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  survey_type text NOT NULL DEFAULT 'satisfaction',
  responses jsonb DEFAULT '{}',
  actions_taken text,
  actioned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.participant_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage participant_surveys" ON public.participant_surveys FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage participant_surveys" ON public.participant_surveys FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view participant_surveys" ON public.participant_surveys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert participant_surveys" ON public.participant_surveys FOR INSERT TO authenticated WITH CHECK (true);

-- 16. Alerts
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  message text NOT NULL,
  due_date date,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage alerts" ON public.alerts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage alerts" ON public.alerts FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view alerts" ON public.alerts FOR SELECT TO authenticated USING (true);

-- 17. Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Storage RLS policies
CREATE POLICY "Authenticated can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Authenticated can view documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Admins can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'));
