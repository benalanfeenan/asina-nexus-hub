
CREATE TABLE public.participant_compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  date_completed date,
  expiry_date date,
  document_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, item_key)
);

ALTER TABLE public.participant_compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage participant_compliance_items" ON public.participant_compliance_items
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HM can manage participant_compliance_items" ON public.participant_compliance_items
  FOR ALL TO public USING (has_role(auth.uid(), 'house_manager'::app_role));

CREATE POLICY "Authenticated can view participant_compliance_items" ON public.participant_compliance_items
  FOR SELECT TO authenticated USING (true);
