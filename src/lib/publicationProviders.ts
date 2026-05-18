import { supabase } from "@/integrations/supabase/client";

export type PublicationChannel =
  | "instagram"
  | "facebook"
  | "meta_ads"
  | "google_ads"
  | "tiktok"
  | "linkedin"
  | "email"
  | "whatsapp";

export type PublicationType =
  | "organic_post"
  | "paid_ad"
  | "story"
  | "reel"
  | "carousel"
  | "email"
  | "whatsapp_message"
  | "landing_page_update";

export type PublicationStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "canceled"
  | "expired";

export type PublicationAutonomyLevel =
  | "insight_only"
  | "assisted_execution"
  | "partial_automation"
  | "limited_autonomy";

export interface PublicationJobLike {
  id: string;
  company_id: string | null;
  channel: PublicationChannel;
  publication_type: PublicationType;
  title: string;
  caption: string | null;
  copy: string | null;
  scheduled_at: string | null;
  data_origin: string;
}

export interface PublicationProviderResult {
  ok: boolean;
  external_platform?: string;
  external_post_id?: string;
  error_message?: string;
  data_origin: "mock" | "demo" | "real";
}

export interface PublicationProvider {
  validateConnection(companyId: string | null, channel: PublicationChannel): Promise<PublicationProviderResult>;
  createDraft(publicationJob: PublicationJobLike): Promise<PublicationProviderResult>;
  schedule(publicationJob: PublicationJobLike): Promise<PublicationProviderResult>;
  publish(publicationJob: PublicationJobLike): Promise<PublicationProviderResult>;
  cancel(publicationJob: PublicationJobLike): Promise<PublicationProviderResult>;
  getStatus(publicationJob: PublicationJobLike): Promise<PublicationProviderResult>;
}

class MockPublicationProvider implements PublicationProvider {
  async validateConnection(_companyId: string | null, channel: PublicationChannel): Promise<PublicationProviderResult> {
    return {
      ok: true,
      external_platform: `${channel}_mock`,
      data_origin: "mock",
    };
  }

  async createDraft(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    return {
      ok: true,
      external_platform: `${publicationJob.channel}_mock`,
      external_post_id: `mock-draft-${publicationJob.id}`,
      data_origin: "mock",
    };
  }

  async schedule(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    return {
      ok: true,
      external_platform: `${publicationJob.channel}_mock`,
      external_post_id: `mock-scheduled-${publicationJob.id}`,
      data_origin: "mock",
    };
  }

  async publish(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    return {
      ok: false,
      external_platform: `${publicationJob.channel}_mock`,
      error_message: "Publicação real não está conectada. Use agendamento mock ou conecte o provider oficial.",
      data_origin: "mock",
    };
  }

  async cancel(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    return {
      ok: true,
      external_platform: `${publicationJob.channel}_mock`,
      external_post_id: `mock-canceled-${publicationJob.id}`,
      data_origin: "mock",
    };
  }

  async getStatus(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    return {
      ok: true,
      external_platform: `${publicationJob.channel}_mock`,
      external_post_id: publicationJob.id,
      data_origin: "mock",
    };
  }
}

class MetaPublicationProvider implements PublicationProvider {
  async validateConnection(companyId: string | null, channel: PublicationChannel): Promise<PublicationProviderResult> {
    const { data, error } = await supabase
      .from("ad_integrations")
      .select("id,status,platform,account_id,metadata")
      .in("platform", ["meta_ads", "facebook", "instagram"])
      .eq("status", "connected")
      .limit(1)
      .maybeSingle();

    if (error || !data?.id) {
      return {
        ok: false,
        external_platform: "meta",
        error_message: `Conexão Meta/Instagram não configurada para ${companyId || "esta empresa"} (${channel}).`,
        data_origin: "real",
      };
    }
    return {
      ok: true,
      external_platform: "meta",
      external_post_id: data.account_id || undefined,
      data_origin: "real",
    };
  }

  async createDraft(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    const connection = await this.validateConnection(publicationJob.company_id, publicationJob.channel);
    if (!connection.ok) return connection;
    return {
      ok: true,
      external_platform: "meta",
      external_post_id: `meta-draft-pending-${publicationJob.id}`,
      data_origin: "real",
    };
  }

  async schedule(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    const connection = await this.validateConnection(publicationJob.company_id, publicationJob.channel);
    if (!connection.ok) return connection;
    if (publicationJob.publication_type === "paid_ad") {
      return {
        ok: false,
        external_platform: "meta",
        error_message: "Paid ads não estão habilitados no provider Meta inicial.",
        data_origin: "real",
      };
    }
    return {
      ok: false,
      external_platform: "meta",
      error_message: "Provider Meta preparado, mas publicação/agendamento real permanece inativo até configurar Graph API e permissões.",
      data_origin: "real",
    };
  }

  async publish(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    const connection = await this.validateConnection(publicationJob.company_id, publicationJob.channel);
    if (!connection.ok) return connection;
    return {
      ok: false,
      external_platform: "meta",
      error_message: "Publicação real Meta/Instagram está preparada, mas inativa nesta fase.",
      data_origin: "real",
    };
  }

  async cancel(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    const connection = await this.validateConnection(publicationJob.company_id, publicationJob.channel);
    if (!connection.ok) return connection;
    return {
      ok: false,
      external_platform: "meta",
      error_message: "Cancelamento real Meta/Instagram ainda não está habilitado. Cancele localmente no Orion.",
      data_origin: "real",
    };
  }

  async getStatus(publicationJob: PublicationJobLike): Promise<PublicationProviderResult> {
    const connection = await this.validateConnection(publicationJob.company_id, publicationJob.channel);
    if (!connection.ok) return connection;
    return {
      ok: true,
      external_platform: "meta",
      external_post_id: publicationJob.id,
      data_origin: "real",
    };
  }
}

export const getPublicationProvider = (channel: PublicationChannel): PublicationProvider => {
  if (
    import.meta.env.VITE_ENABLE_META_PUBLICATION_PROVIDER === "true" &&
    (channel === "instagram" || channel === "facebook")
  ) {
    return new MetaPublicationProvider();
  }
  return new MockPublicationProvider();
};
