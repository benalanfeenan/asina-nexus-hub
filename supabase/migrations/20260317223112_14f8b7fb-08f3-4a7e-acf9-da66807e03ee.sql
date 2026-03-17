
CREATE TABLE public.participant_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL DEFAULT 'phone_call',
  direction text NOT NULL DEFAULT 'outbound',
  contact_name text,
  contact_role text,
  subject text NOT NULL,
  summary text NOT NULL,
  follow_up_required boolean NOT NULL DEFAULT false,
  follow_up_date date,
  follow_up_completed boolean NOT NULL DEFAULT false,
  document_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.participant_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view communications"
  ON public.participant_communications FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert communications"
  ON public.participant_communications FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update communications"
  ON public.participant_communications FOR UPDATE
  TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'house_manager')
  );

CREATE POLICY "Admins can delete communications"
  ON public.participant_communications FOR DELETE
  TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'house_manager')
  );
