export type OrionDataSource = "real" | "imported" | "inferred" | "estimated" | "demo" | "mock";

export interface ProviderSyncMeta {
  source: OrionDataSource;
  period_start: string;
  period_end: string;
  last_updated: string;
  confidence_score: number;
}

export interface StandardCampaignMetric {
  campaign_id: string;
  campaign_name: string;
  channel: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  meta: ProviderSyncMeta;
}

export interface StandardLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  lifecycle_stage: string;
  source: string;
  created_at: string;
  meta: ProviderSyncMeta;
}

export interface StandardOrder {
  id: string;
  customer_id: string | null;
  revenue: number;
  margin: number | null;
  source: string;
  created_at: string;
  meta: ProviderSyncMeta;
}

export interface MarketingDataProvider {
  id: string;
  label: string;
  healthcheck: () => Promise<boolean>;
}

export interface AdsDataProvider extends MarketingDataProvider {
  fetchCampaignMetrics: (input: { period_start: string; period_end: string }) => Promise<StandardCampaignMetric[]>;
}

export interface AnalyticsDataProvider extends MarketingDataProvider {
  fetchTrafficSummary: (input: { period_start: string; period_end: string }) => Promise<Record<string, unknown>>;
}

export interface CRMDataProvider extends MarketingDataProvider {
  fetchLeads: (input: { period_start: string; period_end: string }) => Promise<StandardLead[]>;
}

export interface CommerceDataProvider extends MarketingDataProvider {
  fetchOrders: (input: { period_start: string; period_end: string }) => Promise<StandardOrder[]>;
}
