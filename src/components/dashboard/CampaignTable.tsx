import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  roas: number | null;
  ctr: number | null;
  cpa: number | null;
}

interface CampaignTableProps {
  campaigns?: Campaign[];
}

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: "Ativa", className: "bg-orion-success/15 text-orion-success" },
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  paused: { label: "Pausada", className: "bg-orion-warning/15 text-orion-warning" },
  completed: { label: "Concluída", className: "bg-primary/15 text-primary" },
};

const platformNames: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
};

export const CampaignTable = ({ campaigns }: CampaignTableProps) => {
  const items = campaigns || [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-heading text-foreground">Campanhas ({items.length})</h3>
      </div>
      {items.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-medium">Campanha</th>
              <th className="text-left px-5 py-3 font-medium">Canal</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-right px-5 py-3 font-medium">Gasto</th>
              <th className="text-right px-5 py-3 font-medium">ROAS</th>
              <th className="text-right px-5 py-3 font-medium">Conversões</th>
              <th className="text-right px-5 py-3 font-medium">CPA</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const status = statusMap[c.status] || statusMap.draft;
              return (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-foreground font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{platformNames[c.platform] || c.platform}</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full", status.className)}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-foreground font-mono text-xs">
                    R$ {c.spend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-right text-orion-teal font-mono text-xs">
                    {c.roas ? `${c.roas.toFixed(1)}x` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-foreground font-mono text-xs">
                    {c.conversions.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-5 py-3 text-right text-foreground font-mono text-xs">
                    {c.cpa ? `R$ ${c.cpa.toFixed(2)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="px-5 py-8 text-center text-muted-foreground text-sm">
          Nenhuma campanha encontrada
        </div>
      )}
    </div>
  );
};
