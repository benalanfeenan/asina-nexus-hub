
-- Add requires_acknowledgement flag to documents
ALTER TABLE public.documents ADD COLUMN requires_acknowledgement boolean NOT NULL DEFAULT false;

-- Create document_acknowledgements table
CREATE TABLE public.document_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, staff_id)
);

-- Enable RLS
ALTER TABLE public.document_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage document_acknowledgements"
ON public.document_acknowledgements FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view document_acknowledgements"
ON public.document_acknowledgements FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert document_acknowledgements"
ON public.document_acknowledgements FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "HM can manage document_acknowledgements"
ON public.document_acknowledgements FOR ALL
USING (has_role(auth.uid(), 'house_manager'::app_role));
