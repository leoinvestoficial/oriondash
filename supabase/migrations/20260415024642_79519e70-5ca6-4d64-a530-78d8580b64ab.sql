-- Business context on company_dna
ALTER TABLE public.company_dna ADD COLUMN IF NOT EXISTS business_context jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Ad integrations
CREATE TABLE public.ad_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL, -- meta_ads, google_ads
  access_token text,
  refresh_token text,
  account_id text,
  account_name text,
  status text NOT NULL DEFAULT 'disconnected', -- connected, disconnected, expired
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own integrations" ON public.ad_integrations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_ad_integrations_updated_at BEFORE UPDATE ON public.ad_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Campaigns
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  integration_id uuid REFERENCES public.ad_integrations(id) ON DELETE SET NULL,
  platform text NOT NULL,
  external_id text,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  objective text,
  budget_daily numeric,
  budget_total numeric,
  start_date date,
  end_date date,
  targeting jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Campaign metrics (daily snapshots)
CREATE TABLE public.campaign_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  date date NOT NULL,
  spend numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  ctr numeric GENERATED ALWAYS AS (CASE WHEN impressions > 0 THEN (clicks::numeric / impressions * 100) ELSE 0 END) STORED,
  cpc numeric GENERATED ALWAYS AS (CASE WHEN clicks > 0 THEN (spend / clicks) ELSE 0 END) STORED,
  cpa numeric GENERATED ALWAYS AS (CASE WHEN conversions > 0 THEN (spend / conversions) ELSE 0 END) STORED,
  roas numeric GENERATED ALWAYS AS (CASE WHEN spend > 0 THEN (revenue / spend) ELSE 0 END) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own metrics" ON public.campaign_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own metrics" ON public.campaign_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaign_metrics_date ON public.campaign_metrics (campaign_id, date DESC);

-- Creative briefs & strategy guides
CREATE TABLE public.creative_briefs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  title text NOT NULL,
  brief_type text NOT NULL DEFAULT 'creative', -- creative, strategy, image_prompt, planning
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft', -- draft, approved, archived
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own briefs" ON public.creative_briefs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_creative_briefs_updated_at BEFORE UPDATE ON public.creative_briefs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for campaigns
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;