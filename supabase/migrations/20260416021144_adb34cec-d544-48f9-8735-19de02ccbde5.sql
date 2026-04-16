
-- Content calendar items linked to campaigns
CREATE TABLE public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'post',
  channel TEXT NOT NULL DEFAULT 'instagram',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'draft',
  copy_text TEXT,
  visual_description TEXT,
  hashtags TEXT,
  cta TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own content" ON public.content_calendar FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable realtime for content_calendar
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_calendar;
