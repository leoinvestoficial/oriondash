import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Save,
  GitBranch,
  Megaphone,
  Mail,
  Globe,
  CreditCard,
  Shuffle,
  Trash2,
  GripVertical,
  CheckCircle2,
  Wand2,
  TrendingUp,
  TrendingDown,
  UserPlus,
  FileText,
  Package,
  ZapIcon,
  MoreVertical,
  Link2,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NodeDetailPanel } from "@/components/funnel/NodeDetailPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getNodeTypeConf } from "@/pages/Funnels";

// ─── Constants ────────────────────────────────────────────────────────────────

export const NODE_W = 210;
export const NODE_H = 90;
const V_STEP = 160;
const TOP_PAD = 60;
const CANVAS_CX = 370;
const CANVAS_W = 900;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunnelSummary {
  id: string;
  name: string;
  status: string;
  description?: string | null;
}

interface FunnelNode {
  id: string;
  title: string;
  description?: string | null;
  node_type?: string;
  step_order?: number;
  position?: { x?: number; y?: number };
  data?: Record<string, unknown>;
  metrics?: {
    spend?: number;
    revenue?: number;
    roas?: number | null;
    conversions?: number;
    people_7d?: number;
    exit_ticket_avg?: number | null;
  };
  alerts?: Array<{ id?: string; message?: string; severity?: string }>;
  next_steps?: Array<{ id?: string; label?: string | null; target_node_id?: string }>;
}

interface FunnelEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  label?: string | null;
  data?: Record<string, unknown>;
}

// ─── Node type icon map ───────────────────────────────────────────────────────

const NODE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  entry:    Megaphone,
  capture:  UserPlus,
  content:  FileText,
  sales:    TrendingUp,
  checkout: CreditCard,
  upsell:   ZapIcon,
  downsell: TrendingDown,
  delivery: Package,
  email:    Mail,
  decision: Shuffle,
  ad:       Megaphone,
  landing:  Globe,
  retention: CheckCircle2,
};

function NodeIcon({ type, className }: { type?: string; className?: string }) {
  const Icon = NODE_TYPE_ICONS[type ?? ""] ?? GitBranch;
  return <Icon className={className} />;
}

// ─── SVG edge (bezier curve) ──────────────────────────────────────────────────

function bezierPath(sx: number, sy: number, tx: number, ty: number): string {
  const dy = ty - sy;
  const cp = Math.max(60, Math.abs(dy) * 0.45);
  return `M ${sx} ${sy} C ${sx} ${sy + cp} ${tx} ${ty - cp} ${tx} ${ty}`;
}

interface EdgeProps {
  edge: FunnelEdge;
  nodes: FunnelNode[];
  selected: boolean;
  onClick: (e?: React.MouseEvent) => void;
}

function CanvasEdge({ edge, nodes, selected, onClick }: EdgeProps) {
  const src = nodes.find((n) => n.id === edge.source_node_id);
  const tgt = nodes.find((n) => n.id === edge.target_node_id);
  if (!src || !tgt) return null;

  const sx = (src.position?.x ?? CANVAS_CX - NODE_W / 2) + NODE_W / 2;
  const sy = (src.position?.y ?? 0) + NODE_H;
  const tx = (tgt.position?.x ?? CANVAS_CX - NODE_W / 2) + NODE_W / 2;
  const ty = tgt.position?.y ?? 0;

  const d = bezierPath(sx, sy, tx, ty);
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  const handleClick = (e: React.MouseEvent<SVGPathElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <g>
      {/* Hit area (wider, transparent) */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="cursor-pointer"
        onClick={handleClick}
      />
      {/* Visible path */}
      <path
        d={d}
        fill="none"
        stroke={selected ? "hsl(var(--primary))" : "hsl(var(--border))"}
        strokeWidth={selected ? 2.5 : 1.5}
        markerEnd={selected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
        className="transition-colors pointer-events-none"
      />
      {/* Conversion label bubble */}
      {edge.label && (
        <foreignObject x={midX - 40} y={midY - 12} width={80} height={24}>
          <div className="flex items-center justify-center h-full">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground whitespace-nowrap">
              {edge.label}
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

// ─── Canvas node card ─────────────────────────────────────────────────────────

interface CanvasNodeProps {
  node: FunnelNode;
  index: number;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function CanvasNode({ node, selected, onClick, onDelete }: CanvasNodeProps) {
  const conf = getNodeTypeConf(node.node_type);
  const x = node.position?.x ?? CANVAS_CX - NODE_W / 2;
  const y = node.position?.y ?? 0;
  const hasAlert = (node.alerts?.length ?? 0) > 0;
  const roas = node.metrics?.roas;

  return (
    <div
      className={cn(
        "absolute cursor-pointer rounded-xl border bg-card transition-all duration-150 hover:shadow-lg group",
        selected
          ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
          : "border-border hover:border-primary/40",
      )}
      style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
      onClick={onClick}
    >
      {/* Top accent bar */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5 rounded-t-xl", conf.bg)} />

      <div className="p-3 flex items-start gap-3 h-full">
        {/* Type icon */}
        <div
          className={cn(
            "rounded-lg p-1.5 shrink-0 border mt-0.5",
            conf.bg,
            conf.border,
          )}
        >
          <NodeIcon type={node.node_type} className={cn("w-3.5 h-3.5", conf.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-semibold text-foreground line-clamp-1">{node.title}</p>
          <p className={cn("text-[10px] mt-0.5", conf.color)}>{conf.label}</p>
          {roas != null && (
            <p className="text-[10px] text-emerald-400 mt-1">ROAS {roas.toFixed(1)}x</p>
          )}
        </div>

        {/* Alert dot + delete */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {hasAlert && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Alerta" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Output connector dot */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-border bg-background z-10" />
      {/* Input connector dot */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-border bg-background z-10" />
    </div>
  );
}

// ─── Step list item (left panel) ──────────────────────────────────────────────

function StepListItem({
  node,
  index,
  selected,
  onClick,
  onDelete,
}: {
  node: FunnelNode;
  index: number;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const conf = getNodeTypeConf(node.node_type);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all",
        selected
          ? "border-primary/50 bg-primary/5"
          : "border-border/60 bg-card hover:border-border hover:bg-card/80",
      )}
    >
      {/* Step number */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
            selected ? "border-primary text-primary" : "border-border text-muted-foreground",
          )}
        >
          {index + 1}
        </div>
      </div>

      {/* Node info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground line-clamp-1">{node.title}</p>
        <p className={cn("text-[10px] mt-0.5", conf.color)}>{conf.label}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Add Node Form ─────────────────────────────────────────────────────────────

const ADDABLE_NODE_TYPES = [
  { value: "entry",    label: "Tráfego / Anúncio" },
  { value: "capture",  label: "Captura de Lead" },
  { value: "content",  label: "Conteúdo / VSL" },
  { value: "sales",    label: "Página de Vendas" },
  { value: "checkout", label: "Checkout / Pedido" },
  { value: "upsell",   label: "Upsell / OTO" },
  { value: "downsell", label: "Downsell" },
  { value: "delivery", label: "Entrega / Obrigado" },
  { value: "email",    label: "Sequência de Email" },
  { value: "decision", label: "Divisão A/B" },
];

function AddNodeForm({ onAdd, onCancel }: {
  onAdd: (node: { title: string; description?: string; node_type: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nodeType, setNodeType] = useState("entry");

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("Nome do passo é obrigatório"); return; }
    onAdd({ title: title.trim(), description: description.trim() || undefined, node_type: nodeType });
    setTitle(""); setDescription(""); setNodeType("entry");
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
      <p className="text-xs font-semibold text-foreground">Novo passo</p>
      <Select value={nodeType} onValueChange={setNodeType}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {ADDABLE_NODE_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Nome do passo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-8 text-xs"
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
      />
      <Textarea
        placeholder="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="text-xs min-h-14 resize-none"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} className="h-7 text-xs gap-1">
          <CheckCircle2 className="w-3 h-3" /> Adicionar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancelar</Button>
      </div>
    </div>
  );
}

// ─── Edge connect panel ───────────────────────────────────────────────────────

function ConnectEdgeForm({ nodes, onConnect, onCancel }: {
  nodes: FunnelNode[];
  onConnect: (sourceId: string, targetId: string, label?: string) => void;
  onCancel: () => void;
}) {
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [label, setLabel] = useState("");

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      <p className="text-xs font-semibold text-foreground">Conectar passos</p>
      <Select value={sourceId} onValueChange={setSourceId}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Origem" /></SelectTrigger>
        <SelectContent>
          {nodes.map((n) => <SelectItem key={n.id} value={n.id} className="text-xs">{n.title}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={targetId} onValueChange={setTargetId}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Destino" /></SelectTrigger>
        <SelectContent>
          {nodes.map((n) => <SelectItem key={n.id} value={n.id} className="text-xs">{n.title}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        placeholder="Rótulo (ex: 35% converte)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={!sourceId || !targetId || sourceId === targetId}
          onClick={() => { onConnect(sourceId, targetId, label.trim() || undefined); }}
        >
          <Link2 className="w-3 h-3" /> Conectar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancelar</Button>
      </div>
    </div>
  );
}

// ─── Main editor page ─────────────────────────────────────────────────────────

export default function FunnelEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [funnel, setFunnel] = useState<FunnelSummary | null>(null);
  const [nodes, setNodes] = useState<FunnelNode[]>([]);
  const [edges, setEdges] = useState<FunnelEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingNode, setAddingNode] = useState(false);
  const [connectingEdge, setConnectingEdge] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [funnelName, setFunnelName] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const canvasHeight = Math.max(600, TOP_PAD + nodes.length * V_STEP + 120);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchFunnel = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-funnel-with-metrics", {
        body: { funnel_id: id },
      });
      if (error) throw error;

      if (data?.funnel) {
        setFunnel(data.funnel as FunnelSummary);
        setFunnelName(data.funnel.name ?? "Funil sem nome");
      }

      if (data?.nodes) {
        const sorted = [...(data.nodes as FunnelNode[])].sort(
          (a, b) => (a.step_order ?? 0) - (b.step_order ?? 0),
        );
        // Auto-layout: assign positions to any node without one
        const layouted = sorted.map((node, i) => ({
          ...node,
          position: node.position?.x != null
            ? node.position
            : { x: CANVAS_CX - NODE_W / 2, y: TOP_PAD + i * V_STEP },
        }));
        setNodes(layouted);
        if (layouted.length > 0 && !selectedNodeId) {
          setSelectedNodeId(layouted[0].id);
        }
      }

      if (data?.edges) {
        setEdges(data.edges as FunnelEdge[]);
      } else {
        // Fallback: load edges directly
        const { data: edgeData } = await (supabase
          .from("funnel_edges" as any)
          .select("*")
          .eq("funnel_id", id)
          .eq("user_id", user.id) as any);
        setEdges((edgeData ?? []) as FunnelEdge[]);
      }
    } catch (err) {
      console.error("FunnelEditor fetch error:", err);
      // Fallback to direct DB queries
      await fetchDirect();
    } finally {
      setLoading(false);
    }
  }, [id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDirect = useCallback(async () => {
    if (!id || !user) return;
    const [funnelRes, nodesRes, edgesRes] = await Promise.all([
      (supabase.from("marketing_funnels" as any).select("*").eq("id", id).eq("user_id", user.id).single() as any),
      (supabase.from("funnel_nodes" as any).select("*").eq("funnel_id", id).eq("user_id", user.id).order("step_order") as any),
      (supabase.from("funnel_edges" as any).select("*").eq("funnel_id", id).eq("user_id", user.id) as any),
    ]);

    if (funnelRes.data) {
      const f = funnelRes.data as FunnelSummary;
      setFunnel(f);
      setFunnelName(f.name ?? "Funil");
    }
    if (nodesRes.data) {
      const sorted = (nodesRes.data as FunnelNode[]).map((node, i) => ({
        ...node,
        position: node.position?.x != null
          ? node.position
          : { x: CANVAS_CX - NODE_W / 2, y: TOP_PAD + i * V_STEP },
      }));
      setNodes(sorted);
      if (sorted.length > 0) setSelectedNodeId(sorted[0].id);
    }
    if (edgesRes.data) {
      setEdges(edgesRes.data as FunnelEdge[]);
    }
  }, [id, user]);

  useEffect(() => {
    fetchFunnel();
  }, [fetchFunnel]);

  // ── Funnel name ─────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    if (!funnel || !funnelName.trim()) return;
    setSaving(true);
    try {
      const { error } = await (supabase
        .from("marketing_funnels" as any)
        .update({ name: funnelName.trim() })
        .eq("id", funnel.id)
        .eq("user_id", user?.id) as any);
      if (error) throw error;
      setFunnel((p) => p ? { ...p, name: funnelName.trim() } : p);
      setEditingName(false);
      toast.success("Nome atualizado");
    } catch {
      toast.error("Erro ao salvar nome");
    } finally {
      setSaving(false);
    }
  };

  // ── Node operations ──────────────────────────────────────────────────────

  const handleAddNode = async (nodeData: { title: string; description?: string; node_type: string }) => {
    if (!funnel || !user) return;
    setSaving(true);
    try {
      const stepOrder = nodes.length;
      const { data, error } = await (supabase
        .from("funnel_nodes" as any)
        .insert({
          user_id: user.id,
          funnel_id: funnel.id,
          title: nodeData.title,
          description: nodeData.description ?? null,
          node_type: nodeData.node_type,
          step_order: stepOrder,
          position: { x: CANVAS_CX - NODE_W / 2, y: TOP_PAD + stepOrder * V_STEP },
          status: "draft",
          data: {},
        })
        .select()
        .single() as any);

      if (error) throw error;
      const newNode = data as FunnelNode;
      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
      setAddingNode(false);

      // Auto-connect to previous node
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        await handleConnectEdge(lastNode.id, newNode.id);
      }

      toast.success("Passo adicionado");
    } catch (err) {
      toast.error("Erro ao adicionar passo");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm("Remover este passo do funil?")) return;
    try {
      // Delete associated edges first
      await (supabase
        .from("funnel_edges" as any)
        .delete()
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`)
        .eq("user_id", user?.id) as any);

      const { error } = await (supabase
        .from("funnel_nodes" as any)
        .delete()
        .eq("id", nodeId)
        .eq("user_id", user?.id) as any);
      if (error) throw error;

      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((e) => e.source_node_id !== nodeId && e.target_node_id !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      toast.success("Passo removido");
    } catch {
      toast.error("Erro ao remover passo");
    }
  };

  const handleNodeUpdated = useCallback(async () => {
    // Refresh nodes after AI regeneration
    if (!id || !user) return;
    const { data } = await (supabase
      .from("funnel_nodes" as any)
      .select("*")
      .eq("funnel_id", id)
      .eq("user_id", user.id)
      .order("step_order") as any);
    if (data) {
      const sorted = (data as FunnelNode[]).map((node, i) => ({
        ...node,
        position: node.position?.x != null
          ? node.position
          : { x: CANVAS_CX - NODE_W / 2, y: TOP_PAD + i * V_STEP },
      }));
      setNodes(sorted);
      toast.success("Passo atualizado pela IA");
    }
  }, [id, user]);

  // ── Edge operations ──────────────────────────────────────────────────────

  const handleConnectEdge = async (sourceId: string, targetId: string, label?: string) => {
    if (!funnel || !user) return;
    // Avoid duplicate edges
    const exists = edges.some(
      (e) => e.source_node_id === sourceId && e.target_node_id === targetId,
    );
    if (exists) return;

    try {
      const { data, error } = await (supabase
        .from("funnel_edges" as any)
        .insert({
          user_id: user.id,
          funnel_id: funnel.id,
          source_node_id: sourceId,
          target_node_id: targetId,
          label: label ?? null,
          data: {},
        })
        .select()
        .single() as any);
      if (error) throw error;
      setEdges((prev) => [...prev, data as FunnelEdge]);
      setConnectingEdge(false);
      toast.success("Passos conectados");
    } catch {
      toast.error("Erro ao conectar passos");
    }
  };

  const handleDeleteEdge = async (edgeId: string) => {
    try {
      await (supabase
        .from("funnel_edges" as any)
        .delete()
        .eq("id", edgeId)
        .eq("user_id", user?.id) as any);
      setEdges((prev) => prev.filter((e) => e.id !== edgeId));
      setSelectedEdgeId(null);
      toast.success("Conexão removida");
    } catch {
      toast.error("Erro ao remover conexão");
    }
  };

  // ── Approve funnel ────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (!funnel) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("approve-funnel", {
        body: { funnel_id: funnel.id },
      });
      if (error) throw error;
      toast.success(`Funil aprovado: ${data?.ad_nodes ?? 0} nó(s) de anúncio processados.`);
      await fetchFunnel();
    } catch {
      toast.error("Erro ao aprovar funil");
    } finally {
      setSaving(false);
    }
  };

  // ── Status helpers ────────────────────────────────────────────────────────

  const statusConf: Record<string, { label: string; className: string }> = {
    draft:    { label: "Rascunho", className: "bg-muted/50 text-muted-foreground border-border" },
    active:   { label: "Ativo",    className: "bg-green-500/10 text-green-400 border-green-500/20" },
    paused:   { label: "Pausado",  className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    archived: { label: "Arquivado",className: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const sc = statusConf[funnel?.status ?? "draft"] ?? statusConf.draft;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!funnel) {
    return (
      <AppLayout>
        <div className="p-6 text-center space-y-3">
          <p className="text-muted-foreground">Funil não encontrado.</p>
          <Link to="/funnels">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar para Funis
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card shrink-0 flex-wrap">
          {/* Back */}
          <Link to="/funnels">
            <Button variant="ghost" size="sm" className="gap-1.5 px-2 h-8">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Funis</span>
            </Button>
          </Link>

          <div className="w-px h-5 bg-border hidden sm:block" />

          {/* Funnel name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GitBranch className="w-4 h-4 text-muted-foreground shrink-0" />
            {editingName ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                  value={funnelName}
                  onChange={(e) => setFunnelName(e.target.value)}
                  className="h-7 text-sm max-w-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={handleSaveName} disabled={saving}>
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingName(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-sm font-semibold truncate hover:text-primary transition-colors text-left max-w-[200px]"
              >
                {funnel.name}
              </button>
            )}
          </div>

          {/* Status */}
          <Badge className={cn("shrink-0 text-xs border", sc.className)}>{sc.label}</Badge>

          {/* Approve */}
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 hidden sm:flex"
            onClick={handleApprove}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Aprovar funil
          </Button>

          {/* Regenerate with AI (menu) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              <DropdownMenuItem onClick={() => setEditingName(true)}>
                Renomear funil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleApprove} className="sm:hidden">
                Aprovar funil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  if (!confirm("Excluir este funil? Esta ação não pode ser desfeita.")) return;
                  await (supabase.from("marketing_funnels" as any).delete().eq("id", funnel.id).eq("user_id", user?.id) as any);
                  navigate("/funnels");
                }}
              >
                Excluir funil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Editor layout ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left: steps list ─────────────────────────────────────────────── */}
          <div className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto p-3 space-y-2 hidden md:flex md:flex-col">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Passos ({nodes.length})
              </p>
              <div className="flex items-center gap-1">
                {!connectingEdge && (
                  <button
                    onClick={() => { setConnectingEdge(true); setAddingNode(false); }}
                    title="Conectar passos"
                    className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!addingNode && (
                  <button
                    onClick={() => { setAddingNode(true); setConnectingEdge(false); }}
                    className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Vertical connector lines + step items */}
            <div className="relative">
              {nodes.length > 1 && (
                <div className="absolute left-[19px] top-7 bottom-7 w-px bg-border/60 z-0" />
              )}
              <div className="space-y-2 relative z-10">
                {nodes.map((node, i) => (
                  <StepListItem
                    key={node.id}
                    node={node}
                    index={i}
                    selected={selectedNodeId === node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}
                    onDelete={() => handleDeleteNode(node.id)}
                  />
                ))}
              </div>
            </div>

            {nodes.length === 0 && !addingNode && (
              <div className="rounded-xl border border-dashed border-border p-4 text-center">
                <GitBranch className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum passo</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs gap-1"
                  onClick={() => setAddingNode(true)}
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </div>
            )}

            {addingNode && (
              <AddNodeForm onAdd={handleAddNode} onCancel={() => setAddingNode(false)} />
            )}

            {connectingEdge && nodes.length >= 2 && (
              <ConnectEdgeForm
                nodes={nodes}
                onConnect={(srcId, tgtId, label) => handleConnectEdge(srcId, tgtId, label)}
                onCancel={() => setConnectingEdge(false)}
              />
            )}

            {/* Selected edge actions */}
            {selectedEdgeId && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Conexão selecionada</p>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full h-7 text-xs gap-1"
                  onClick={() => handleDeleteEdge(selectedEdgeId)}
                >
                  <Trash2 className="w-3 h-3" /> Remover conexão
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-7 text-xs"
                  onClick={() => setSelectedEdgeId(null)}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          {/* ── Center: SVG canvas ────────────────────────────────────────────── */}
          <div
            ref={canvasRef}
            className="flex-1 overflow-auto bg-background/40 relative"
            style={{
              backgroundImage: "radial-gradient(hsl(var(--border) / 0.4) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
            onClick={() => { setSelectedEdgeId(null); }}
          >
            <div
              className="relative"
              style={{ width: CANVAS_W, height: canvasHeight, minWidth: "100%" }}
            >
              {/* SVG layer for edges */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: Math.max(CANVAS_W, 900), height: canvasHeight }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 8 3, 0 6"
                      fill="hsl(var(--border))"
                    />
                  </marker>
                  <marker
                    id="arrowhead-selected"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 8 3, 0 6"
                      fill="hsl(var(--primary))"
                    />
                  </marker>
                </defs>

                {edges.map((edge) => (
                  <CanvasEdge
                    key={edge.id}
                    edge={edge}
                    nodes={nodes}
                    selected={selectedEdgeId === edge.id}
                    onClick={() => {
                      setSelectedEdgeId((prev) => prev === edge.id ? null : edge.id);
                      setSelectedNodeId(null);
                    }}
                  />
                ))}
              </svg>

              {/* Node cards layer */}
              {nodes.map((node, i) => (
                <CanvasNode
                  key={node.id}
                  node={node}
                  index={i}
                  selected={selectedNodeId === node.id}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    setSelectedEdgeId(null);
                  }}
                  onDelete={() => handleDeleteNode(node.id)}
                />
              ))}

              {/* Empty canvas state */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="rounded-2xl border-2 border-dashed border-border p-8">
                    <GitBranch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">Canvas vazio</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Adicione passos pela coluna esquerda para construir seu funil
                    </p>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setAddingNode(true)}
                    >
                      <Plus className="w-4 h-4" /> Adicionar primeiro passo
                    </Button>
                  </div>
                </div>
              )}

              {/* Watermark */}
              {nodes.length > 0 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-muted-foreground/20 pointer-events-none select-none">
                  <Wand2 className="w-3 h-3" />
                  <span className="text-[10px] font-medium">Orion Funnels</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: node detail panel ──────────────────────────────────────── */}
          <div className="w-72 xl:w-80 shrink-0 border-l border-border overflow-y-auto hidden lg:block">
            <NodeDetailPanel
              node={selectedNode}
              onNodeUpdated={handleNodeUpdated}
            />
          </div>
        </div>

        {/* Mobile bottom bar: show detail for selected node */}
        {selectedNode && (
          <div className="lg:hidden border-t border-border bg-card p-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedNode.title}</p>
                <p className="text-xs text-muted-foreground">{getNodeTypeConf(selectedNode.node_type).label}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNodeId(null)}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
