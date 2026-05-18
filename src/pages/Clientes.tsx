import { useCallback, useEffect, useState } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Star,
  ShoppingCart,
  RefreshCw,
  Heart,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: "new" | "active" | "at_risk" | "lost" | "vip";
  orders_count: number;
  total_revenue: number;
  average_order_value: number;
  predicted_ltv: number;
  last_order_at: string | null;
  first_order_at: string | null;
  consent_marketing: boolean;
  tags: string[];
}

interface Segment {
  id: string;
  name: string;
  segment_type: string;
  estimated_count: number;
  estimated_revenue_potential: number;
  description: string | null;
}

interface Opportunity {
  id: string;
  title: string;
  opportunity_type: string;
  expected_revenue: number;
  recommended_channel: string;
  recommended_message: string;
  status: string;
}

interface CustomerEvent {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  occurred_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  active: "Ativo",
  at_risk: "Em risco",
  lost: "Perdido",
  vip: "VIP",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  at_risk: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
  vip: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const SEGMENT_ICONS: Record<string, typeof RefreshCw> = {
  likely_repurchase: RefreshCw,
  cart_abandoned: ShoppingCart,
  winback: Heart,
};

const SEGMENT_COLORS: Record<string, string> = {
  likely_repurchase: "border-emerald-500/30 bg-emerald-500/5",
  cart_abandoned: "border-amber-500/30 bg-amber-500/5",
  winback: "border-purple-500/30 bg-purple-500/5",
};

function fmtCurrency(n: number) {
  return `R$${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function daysSince(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-2xl font-semibold", color)}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("rounded-lg p-2", color ? "bg-current/10" : "bg-muted/30")}>
          <Icon className={cn("w-4 h-4", color ?? "text-muted-foreground")} />
        </div>
      </div>
    </div>
  );
}

// ─── Segment Card ─────────────────────────────────────────────────────────────

function SegmentCard({
  seg,
  onAction,
}: {
  seg: Segment;
  onAction: (seg: Segment) => void;
}) {
  const Icon = SEGMENT_ICONS[seg.segment_type] ?? Users;
  const colorClass = SEGMENT_COLORS[seg.segment_type] ?? "border-white/10 bg-card";

  return (
    <div className={cn("rounded-xl border p-4 flex flex-col gap-3", colorClass)}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white/5 p-2">
          <Icon className="w-4 h-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{seg.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{seg.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{seg.estimated_count} clientes</span>
        <span className="text-emerald-400 font-medium">
          {fmtCurrency(seg.estimated_revenue_potential)} potencial
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs h-7"
        onClick={() => onAction(seg)}
      >
        Ver oportunidade
        <ChevronRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}

// ─── Customer Row ─────────────────────────────────────────────────────────────

function CustomerRow({
  customer,
  onClick,
}: {
  customer: Customer;
  onClick: (c: Customer) => void;
}) {
  const days = daysSince(customer.last_order_at);
  return (
    <button
      onClick={() => onClick(customer)}
      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors text-left border-b border-white/5 last:border-0"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
        {customer.name.charAt(0)}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{customer.name}</p>
        <p className="text-xs text-muted-foreground truncate">{customer.email ?? "—"}</p>
      </div>

      {/* Status */}
      <Badge className={cn("shrink-0 text-xs border", STATUS_COLORS[customer.status])}>
        {STATUS_LABELS[customer.status]}
      </Badge>

      {/* Revenue */}
      <div className="hidden sm:flex flex-col items-end shrink-0">
        <span className="text-sm font-medium">{fmtCurrency(customer.total_revenue)}</span>
        <span className="text-xs text-muted-foreground">{customer.orders_count} pedidos</span>
      </div>

      {/* Last order */}
      <div className="hidden md:block text-xs text-muted-foreground shrink-0 text-right">
        {days !== null ? (
          <span className={cn(days > 60 ? "text-red-400" : days > 30 ? "text-amber-400" : "text-emerald-400")}>
            há {days}d
          </span>
        ) : "—"}
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

// ─── Customer Detail Sheet ────────────────────────────────────────────────────

function CustomerDetailSheet({
  customer,
  open,
  onClose,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!customer || !user) { setEvents([]); return; }
    supabase
      .from("crm_events")
      .select("id, event_type, payload, occurred_at")
      .eq("user_id", user.id)
      .eq("customer_id", customer.id)
      .order("occurred_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setEvents((data ?? []) as CustomerEvent[]));
  }, [customer, user]);

  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-semibold text-white">
              {customer.name.charAt(0)}
            </div>
            <div>
              <SheetTitle className="text-base">{customer.name}</SheetTitle>
              <Badge className={cn("text-xs border mt-1", STATUS_COLORS[customer.status])}>
                {STATUS_LABELS[customer.status]}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Contact info */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Contato</p>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>Origem: {customer.source}</span>
            </div>
          </div>

          {/* Financial */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Receita total</p>
              <p className="text-lg font-semibold text-emerald-400">{fmtCurrency(customer.total_revenue)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">LTV previsto</p>
              <p className="text-lg font-semibold">{fmtCurrency(customer.predicted_ltv)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-lg font-semibold">{fmtCurrency(customer.average_order_value)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Pedidos</p>
              <p className="text-lg font-semibold">{customer.orders_count}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Histórico</p>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Primeira compra:</span>
              <span>{fmtDate(customer.first_order_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Última compra:</span>
              <span className={cn(
                daysSince(customer.last_order_at) !== null && daysSince(customer.last_order_at)! > 60
                  ? "text-red-400"
                  : "text-foreground",
              )}>
                {fmtDate(customer.last_order_at)}
                {daysSince(customer.last_order_at) !== null && (
                  <span className="text-muted-foreground ml-1">
                    (há {daysSince(customer.last_order_at)}d)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Events timeline */}
          {events.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Eventos recentes</p>
              <div className="space-y-2">
                {events.slice(0, 8).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <span className="font-medium capitalize">{ev.event_type.replace(/_/g, " ")}</span>
                      {ev.payload?.revenue && (
                        <span className="text-emerald-400 ml-1">{fmtCurrency(Number(ev.payload.revenue))}</span>
                      )}
                      <span className="text-muted-foreground ml-1">· {fmtDate(ev.occurred_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Clientes() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [custRes, segRes, oppRes] = await Promise.all([
        supabase
          .from("crm_customers")
          .select("*")
          .eq("user_id", user.id)
          .order("last_order_at", { ascending: false })
          .limit(200),
        supabase
          .from("crm_segments")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("crm_opportunities")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "open")
          .order("expected_revenue", { ascending: false }),
      ]);

      setCustomers((custRes.data ?? []) as Customer[]);
      setSegments((segRes.data ?? []) as Segment[]);
      setOpportunities((oppRes.data ?? []) as Opportunity[]);
    } catch (err) {
      console.error("Clientes fetch error:", err);
      toast.error("Erro ao carregar dados de clientes");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── KPI aggregations ──────────────────────────────────────────────────────
  const totalRevenue = customers.reduce((s, c) => s + c.total_revenue, 0);
  const vipCount = customers.filter((c) => c.status === "vip").length;
  const atRiskCount = customers.filter((c) => c.status === "at_risk").length;
  const avgLtv = customers.length > 0
    ? customers.reduce((s, c) => s + c.predicted_ltv, 0) / customers.length
    : 0;

  // ── Filtered customers ────────────────────────────────────────────────────
  const filtered = customers.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Segment action — show linked opportunity ───────────────────────────────
  const handleSegmentAction = (seg: Segment) => {
    const opp = opportunities.find((o) => o.opportunity_type === {
      likely_repurchase: "repurchase",
      cart_abandoned: "cart_recovery",
      winback: "winback",
    }[seg.segment_type]);
    if (opp) {
      setSelectedOpportunity(opp);
    } else {
      toast.info("Nenhuma oportunidade aberta para este segmento.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Clientes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              CRM inteligente · base de clientes, segmentos e oportunidades
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Users}
            label="Total de clientes"
            value={customers.length}
            sub="na base"
          />
          <KpiCard
            icon={DollarSign}
            label="Receita total"
            value={fmtCurrency(totalRevenue)}
            sub="histórica"
            color="text-emerald-400"
          />
          <KpiCard
            icon={Star}
            label="Clientes VIP"
            value={vipCount}
            sub={`${((vipCount / (customers.length || 1)) * 100).toFixed(0)}% da base`}
            color="text-purple-400"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Em risco"
            value={atRiskCount}
            sub={`LTV médio ${fmtCurrency(avgLtv)}`}
            color="text-amber-400"
          />
        </div>

        {/* Smart segments */}
        {segments.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Segmentos inteligentes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {segments.map((seg) => (
                <SegmentCard key={seg.id} seg={seg} onAction={handleSegmentAction} />
              ))}
            </div>
          </div>
        )}

        {/* Open opportunities */}
        {opportunities.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Oportunidades abertas
            </h2>
            <div className="space-y-2">
              {opportunities.map((opp) => (
                <button
                  key={opp.id}
                  onClick={() => setSelectedOpportunity(opp)}
                  className="w-full rounded-xl border border-white/5 bg-card p-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{opp.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {opp.recommended_message}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-emerald-400 font-semibold text-sm">
                        {fmtCurrency(opp.expected_revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        via {opp.recommended_channel}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Customer list */}
        <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
          {/* Filters */}
          <div className="flex items-center gap-3 p-4 border-b border-white/5 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="at_risk">Em risco</SelectItem>
                <SelectItem value="lost">Perdidos</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {filtered.length} de {customers.length}
            </span>
          </div>

          {/* List */}
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum cliente encontrado"
              description={
                search || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Importe seus clientes ou conecte sua plataforma de e-commerce."
              }
            />
          ) : (
            <div>
              {filtered.map((c) => (
                <CustomerRow key={c.id} customer={c} onClick={setSelectedCustomer} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer detail */}
      <CustomerDetailSheet
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      {/* Opportunity detail */}
      {selectedOpportunity && (
        <Sheet open={!!selectedOpportunity} onOpenChange={() => setSelectedOpportunity(null)}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-base">{selectedOpportunity.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-muted/20 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receita esperada</span>
                  <span className="text-emerald-400 font-semibold">
                    {fmtCurrency(selectedOpportunity.expected_revenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Canal recomendado</span>
                  <span className="capitalize">{selectedOpportunity.recommended_channel}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                  Mensagem sugerida
                </p>
                <div className="rounded-lg border border-white/5 bg-muted/10 p-3 text-sm text-foreground">
                  {selectedOpportunity.recommended_message}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  navigator.clipboard?.writeText(selectedOpportunity.recommended_message);
                  toast.success("Mensagem copiada!");
                }}
              >
                Copiar mensagem
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </AppLayout>
  );
}
