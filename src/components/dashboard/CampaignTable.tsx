import { cn } from "@/lib/utils";

const campaigns = [
  { name: "Lançamento Produto X", channel: "Meta Ads", status: "active", spend: "R$ 12.400", roas: "4.2x", leads: 342, trend: "up" },
  { name: "Retargeting Carrinho", channel: "Google Ads", status: "active", spend: "R$ 8.200", roas: "5.1x", leads: 189, trend: "up" },
  { name: "Brand Awareness Q2", channel: "TikTok", status: "pending", spend: "R$ 6.100", roas: "2.8x", leads: 421, trend: "down" },
  { name: "Geração de Leads B2B", channel: "LinkedIn", status: "active", spend: "R$ 4.300", roas: "3.1x", leads: 87, trend: "stable" },
  { name: "Promoção Sazonal", channel: "Meta Ads", status: "paused", spend: "R$ 11.350", roas: "3.9x", leads: 208, trend: "up" },
];

const statusMap = {
  active: { label: "Ativa", className: "bg-orion-success/15 text-orion-success" },
  pending: { label: "Pendente", className: "bg-orion-warning/15 text-orion-warning" },
  paused: { label: "Pausada", className: "bg-muted text-muted-foreground" },
};

export const CampaignTable = () => {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-heading text-foreground">Campanhas ativas</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <th className="text-left px-5 py-3 font-medium">Campanha</th>
            <th className="text-left px-5 py-3 font-medium">Canal</th>
            <th className="text-left px-5 py-3 font-medium">Status</th>
            <th className="text-right px-5 py-3 font-medium">Gasto</th>
            <th className="text-right px-5 py-3 font-medium">ROAS</th>
            <th className="text-right px-5 py-3 font-medium">Leads</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c, i) => {
            const status = statusMap[c.status as keyof typeof statusMap];
            return (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3 text-foreground font-medium">{c.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.channel}</td>
                <td className="px-5 py-3">
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full", status.className)}>
                    {status.label}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-foreground font-mono text-xs">{c.spend}</td>
                <td className="px-5 py-3 text-right text-orion-teal font-mono text-xs">{c.roas}</td>
                <td className="px-5 py-3 text-right text-foreground font-mono text-xs">{c.leads}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
