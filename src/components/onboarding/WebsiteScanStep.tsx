import { useState } from "react";
import { Globe, Loader2, CheckCircle2, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WebsiteScoreGauge } from "./WebsiteScoreGauge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface WebsiteScanStepProps {
  onComplete: () => void;
}

type ScanState = "idle" | "scanning" | "done" | "skipped" | "error";

interface ScanDimension {
  id: string;
  label: string;
  score: number;
  note: string;
}

interface ScanResult {
  score: number;
  score_label: string;
  dimensions: ScanDimension[];
  strengths: string[];
  improvements: string[];
  has_recommendations: boolean;
  detected_tone: string;
  detected_audience: string;
  detected_offer: string;
  brand_summary: string;
  market_position: string;
}

function getDimensionBarColor(score: number): string {
  if (score < 40) return "bg-red-500";
  if (score < 70) return "bg-amber-500";
  return "bg-green-500";
}

function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const WebsiteScanStep = ({ onComplete }: WebsiteScanStepProps) => {
  const [url, setUrl] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scan, setScan] = useState<ScanResult | null>(null);

  const handleScan = async () => {
    if (!isValidUrl(url)) {
      toast.error("Digite uma URL válida (ex: meusite.com.br)");
      return;
    }

    setScanState("scanning");

    try {
      const { data, error } = await supabase.functions.invoke("scan-website", {
        body: { website_url: url.trim() },
      });

      if (error) throw new Error(error.message ?? "Erro ao escanear o site");
      if (!data?.ok) throw new Error(data?.error ?? "Resposta inválida do servidor");

      setScan(data.scan as ScanResult);
      setScanState("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Falha no scan: ${msg}`);
      setScanState("error");
    }
  };

  const handleSkip = () => {
    setScanState("skipped");
    onComplete();
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Globe className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Scan do Site</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Analise seu site e receba um diagnóstico completo de branding, proposta de valor, conversão e mais.
        </p>
      </div>

      {/* Estado: idle ou error */}
      {(scanState === "idle" || scanState === "error") && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            URL do seu site
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="meusite.com.br ou https://meusite.com.br"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="flex-1"
            />
            <Button
              onClick={handleScan}
              disabled={!url.trim()}
              className="shrink-0"
            >
              Iniciar scan
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {scanState === "error" && (
            <p className="mt-3 text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Ocorreu um erro. Verifique a URL e tente novamente.
            </p>
          )}
        </div>
      )}

      {/* Estado: scanning */}
      {scanState === "scanning" && (
        <div className="bg-card border border-border rounded-xl p-10 mb-6 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          </div>
          <p className="text-foreground font-semibold mb-1">Analisando seu site...</p>
          <p className="text-xs text-muted-foreground">~20 segundos</p>
        </div>
      )}

      {/* Estado: done */}
      {scanState === "done" && scan && (
        <div className="space-y-5 mb-6">
          {/* Gauge */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center">
            <WebsiteScoreGauge score={scan.score} size={220} />
            <p className="mt-2 text-sm text-muted-foreground text-center">{scan.score_label}</p>
          </div>

          {/* Pontos fortes e melhorias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pontos fortes */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Pontos fortes</h3>
              </div>
              <ul className="space-y-2">
                {scan.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Melhorias */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Melhorias sugeridas</h3>
              </div>
              {scan.has_recommendations && scan.improvements.length > 0 ? (
                <ul className="space-y-2">
                  {scan.improvements.map((imp, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Seu site já está bem posicionado! Seguindo sem recomendações.
                </p>
              )}
            </div>
          </div>

          {/* Dimensões */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Avaliação por dimensão</h3>
            <div className="space-y-3">
              {scan.dimensions.map((dim) => (
                <div key={dim.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground font-medium">{dim.label}</span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        dim.score < 40
                          ? "text-red-500"
                          : dim.score < 70
                            ? "text-amber-500"
                            : "text-green-500",
                      )}
                    >
                      {dim.score}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={cn("h-1.5 rounded-full transition-all duration-700", getDimensionBarColor(dim.score))}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{dim.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Botão concluir */}
          <Button onClick={onComplete} className="w-full" size="lg">
            Concluir onboarding
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Botão Pular — sempre visível exceto quando já concluindo */}
      {scanState !== "done" && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
            disabled={scanState === "scanning"}
          >
            Pular esta etapa
          </Button>
        </div>
      )}
    </div>
  );
};
