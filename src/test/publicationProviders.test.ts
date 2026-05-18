import { describe, expect, it } from "vitest";
import { getPublicationProvider } from "@/lib/publicationProviders";

const job = {
  id: "job-1",
  company_id: "company-1",
  channel: "instagram" as const,
  publication_type: "organic_post" as const,
  title: "Post de teste",
  caption: "Legenda",
  copy: "Copy",
  scheduled_at: "2026-05-14T12:00:00.000Z",
  data_origin: "mock",
};

describe("publication provider", () => {
  it("uses explicit mock data origin for scheduling", async () => {
    const provider = getPublicationProvider("instagram");
    const result = await provider.schedule(job);

    expect(result.ok).toBe(true);
    expect(result.data_origin).toBe("mock");
    expect(result.external_platform).toBe("instagram_mock");
  });

  it("does not fake real publishing while real integrations are unavailable", async () => {
    const provider = getPublicationProvider("instagram");
    const result = await provider.publish(job);

    expect(result.ok).toBe(false);
    expect(result.data_origin).toBe("mock");
    expect(result.error_message).toContain("não está conectada");
  });
});
