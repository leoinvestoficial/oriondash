import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BarChart3, DollarSign, Loader2, MousePointer, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  objective: string | null;
  budget_daily: number | null;
  budget_total: number | null;
  start_date: string | null;
  end_date: string | null;
}

interface MetricRow {
  date: string;
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

const fmtCurrency = (value?: number | null) =>
  value == null ? "-" : `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNumber = (value?: number | null) => value == null ? "-" : value.toLocaleString("pt-BR");
const fmtPercent = (value?: number | null) => value == null ? "-" : `${value.toFixed(2)}%`;
const fmtMultiplier = (value?: number | null) => value == null ? "-" : `${value.toFixed(2)}x`;

const platformNames: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
  meta: "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
};

const MetricCard = ({ label, value, icon: Icon }: { label: string; value: string; icon: typeof DollarSign }) => (
  <Card className="p-4 bg-card border-border">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <p className="text-xl font-semibold text-foreground">{value}</p>
  </Card>
);

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const sinceDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const [campaignRes, metricsRes] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", id).maybeSingle(),
      supabase.from("campaign_metrics").select("*").eq("campaign_id", id).gte("date", sinceDate).order("date"),
    ]);

    if (campaignRes.error) {
      toast.error("Campanha não encontrada");
      console.error(campaignRes.error);
    } else {
      setCampaign(campaignRes.data as Campaign | null);
    }

    if (metricsRes.error) {
      console.error(metricsRes.error);
    } else {
      setMetrics((metricsRes.data as MetricRow[]) || []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totals = useMemo(() => {
    const spend = metrics.reduce((sum, row) => sum + Number(row.spend || 0), 0);
    const revenue = metrics.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
    const clicks = metrics.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
    const impressions = metrics.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
    const conversions = metrics.reduce((sum, row) => sum + Number(row.conversions || 0), 0);
    return {
      spend,
      revenue,
      clicks,
      impressions,
      conversions,
      roas: spend > 0 ? revenue / spend : null,
      roi: spend > 0 ? ((revenue - spend) / spend) * 100 : null,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
      cpc: clicks > 0 ? spend / clicks : null,
      cpa: conversions > 0 ? spend / conversions : null,
    };
  }, [metrics]);

  const handleAnalyze = async () => {
    if (!campaign) return;
    setAnalyzing(true);
    setAnalysis("");
    try {
      const { data, error } = await supabase.functions.invoke("interpret-metrics", {
        body: { campaign_id: campaign.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Falha ao analisar campanha");
      setAnalysis(
        data?.executive_read ||
        "O Orion gerou recomendações a partir desta campanha. Veja a tela Recomendações IA para evidências e próximos passos."
      );
      toast.success("Análise gerada");
    } catch (err: any) {
      toast.error(err.message || "Erro ao analisar");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-muted-foreground">Campanha não encontrada.</p>
          <Button variant="outline" onClick={() => navigate("/campaigns")}>Voltar para campanhas</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <button
            onClick={() => navigate("/campaigns")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Campanhas
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                {platformNames[campaign.platform] || campaign.platform} • {campaign.status}
              </p>
              <h1 className="text-display text-foreground">{campaign.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {campaign.objective || "Sem objetivo informado"} — análise dos últimos 30 dias.
              </p>
            </div>
            <Button onClick={handleAnalyze} disabled={analyzing} className="orion-gradient text-primary-foreground gap-2">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Analisar com IA
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Investimento" value={fmtCurrency(totals.spend)} icon={DollarSign} />
          <MetricCard label="Receita" value={fmtCurrency(totals.revenue)} icon={TrendingUp} />
          <MetricCard label="ROAS" value={fmtMultiplier(totals.roas)} icon={BarChart3} />
          <MetricCard label="ROI" value={fmtPercent(totals.roi)} icon={Target} />
          <MetricCard label="CPC" value={fmtCurrency(totals.cpc)} icon={MousePointer} />
          <MetricCard label="CPA" value={fmtCurrency(totals.cpa)} icon={Target} />
          <MetricCard label="CTR" value={fmtPercent(totals.ctr)} icon={MousePointer} />
          <MetricCard label="Conversões" value={fmtNumber(totals.conversions)} icon={Sparkles} />
        </div>

        <Card className="p-5 bg-card border-border">
          <h2 className="text-heading text-foreground mb-4">Histórico diário</h2>
          {metrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem métricas sincronizadas para esta campanha.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                    <th className="text-left py-3">Data</th>
                    <th className="text-right py-3">Gasto</th>
                    <th className="text-right py-3">Receita</th>
                    <th className="text-right py-3">Cliques</th>
                    <th className="text-right py-3">Conversões</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((row) => (
                    <tr key={row.date} className="border-b border-border/50">
                      <td className="py-3 text-foreground">{new Date(row.date).toLocaleDateString("pt-BR")}</td>
                      <td className="py-3 text-right font-mono">{fmtCurrency(Number(row.spend || 0))}</td>
                      <td className="py-3 text-right font-mono">{fmtCurrency(Number(row.revenue || 0))}</td>
                      <td className="py-3 text-right font-mono">{fmtNumber(Number(row.clicks || 0))}</td>
                      <td className="py-3 text-right font-mono">{fmtNumber(Number(row.conversions || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {analysis && (
          <Card className="p-5 bg-primary/5 border-primary/20">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">Leitura IA</p>
            <p className="text-sm text-foreground leading-relaxed">{analysis}</p>
            <Link to="/decisoes" className="inline-flex mt-4">
              <Button variant="outline" size="sm">Abrir recomendações</Button>
            </Link>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default CampaignDetail;
