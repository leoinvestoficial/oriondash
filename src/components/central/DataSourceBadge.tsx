import { cn } from "@/lib/utils";

export type DataSourceKind = "real" | "imported" | "inferred" | "estimated" | "demo" | "mock" | "unknown";

const SOURCE_LABELS: Record<DataSourceKind, string> = {
  real: "Dado real",
  imported: "Dado importado",
  inferred: "Dado inferido",
  estimated: "Dado estimado",
  demo: "Dado demo",
  mock: "Dado mock - nao real",
  unknown: "Origem desconhecida",
};

const SOURCE_TITLES: Record<DataSourceKind, string> = {
  real: "Dado vindo de fonte real conectada.",
  imported: "Dado importado pelo usuario ou por integracao.",
  inferred: "Dado inferido por regra do Orion.",
  estimated: "Dado estimado; confirme antes de tomar decisoes sensiveis.",
  demo: "Dado demonstrativo; nao representa resultado real.",
  mock: "Dado mock/demonstrativo; nenhuma acao foi enviada para canal real.",
  unknown: "Origem do dado nao confirmada.",
};

const SOURCE_STYLES: Record<DataSourceKind, string> = {
  real: "bg-orion-success/15 text-orion-success border-orion-success/30",
  imported: "bg-orion-info/15 text-orion-info border-orion-info/30",
  inferred: "bg-orion-violet/15 text-orion-violet-light border-orion-violet/30",
  estimated: "bg-orion-warning/15 text-orion-warning border-orion-warning/30",
  demo: "bg-orion-amber/15 text-orion-amber border-orion-amber/30",
  mock: "bg-orion-coral/15 text-orion-coral border-orion-coral/30",
  unknown: "bg-muted/40 text-muted-foreground border-border",
};

export const DataSourceBadge = ({ source, className }: { source: DataSourceKind; className?: string }) => (
  <span
    title={SOURCE_TITLES[source]}
    className={cn("inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-medium", SOURCE_STYLES[source], className)}
  >
    {SOURCE_LABELS[source]}
  </span>
);
