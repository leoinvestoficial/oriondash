import { cn } from "@/lib/utils";

interface WebsiteScoreGaugeProps {
  score: number;
  size?: number;
}

function getScoreLabel(score: number): string {
  if (score < 30) return "Precisa de atenção";
  if (score < 50) return "Abaixo do esperado";
  if (score < 70) return "Em desenvolvimento";
  if (score < 85) return "Boa base";
  return "Excelente";
}

function getArcColor(score: number): string {
  if (score < 40) return "#ef4444";
  if (score < 70) return "#f59e0b";
  return "#22c55e";
}

// Converte graus para coordenadas no SVG (semicírculo de 180° a 0°, centro em 110,110, r=90)
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// Gera um path SVG de arco
// start e end em graus (convenção SVG: 0°=direita, 180°=esquerda)
function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArcFlag = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  // Sentido anti-horário (sweep-flag=0) para ir de 180° (esquerda) a 0° (direita)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export const WebsiteScoreGauge = ({ score, size = 220 }: WebsiteScoreGaugeProps) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const label = getScoreLabel(clampedScore);
  const arcColor = getArcColor(clampedScore);

  // Semicírculo: de 180° (esquerda) a 0° (direita) no plano SVG
  // Ângulo da agulha: -90° (score=0, apontando para esquerda) a +90° (score=100, direita)
  // No SVG: 180° (esquerda) até 0° (direita) — mapear score para esse intervalo
  const needleAngleDeg = 180 - (clampedScore / 100) * 180; // 180→0 conforme score sobe

  const cx = 110;
  const cy = 110;
  const r = 90;
  const trackWidth = 12;
  const needleLength = 72;

  // Trilha de fundo (arco completo cinza, de 180° a 0°)
  const trackPath = describeArc(cx, cy, r, 180, 0);

  // Arco de progresso (de 180° até o ponto do score)
  const progressEndDeg = 180 - (clampedScore / 100) * 180;
  const progressPath = clampedScore > 0 ? describeArc(cx, cy, r, 180, progressEndDeg) : "";

  // Ponta da agulha
  const needleRad = (needleAngleDeg * Math.PI) / 180;
  const needleTipX = cx + needleLength * Math.cos(needleRad);
  const needleTipY = cy + needleLength * Math.sin(needleRad);

  // Escala do SVG para o size solicitado
  const viewBox = "0 0 220 130";

  return (
    <div className={cn("flex flex-col items-center select-none")} style={{ width: size }}>
      <svg
        viewBox={viewBox}
        width={size}
        height={size * (130 / 220)}
        aria-label={`Score ${clampedScore} — ${label}`}
        role="img"
      >
        {/* Trilha de fundo */}
        <path
          d={trackPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={trackWidth}
          strokeLinecap="round"
          className="text-muted-foreground/20"
        />

        {/* Arco de progresso */}
        {progressPath && (
          <path
            d={progressPath}
            fill="none"
            stroke={arcColor}
            strokeWidth={trackWidth}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        )}

        {/* Marcadores de zona: vermelho, âmbar, verde */}
        {/* Ponto 0% (esquerda) */}
        <circle cx={cx - r} cy={cy} r={3} fill="#ef4444" opacity={0.5} />
        {/* Ponto 40% */}
        {(() => {
          const p40 = polarToCartesian(cx, cy, r, 180 - 0.4 * 180);
          return <circle cx={p40.x} cy={p40.y} r={3} fill="#f59e0b" opacity={0.5} />;
        })()}
        {/* Ponto 70% */}
        {(() => {
          const p70 = polarToCartesian(cx, cy, r, 180 - 0.7 * 180);
          return <circle cx={p70.x} cy={p70.y} r={3} fill="#22c55e" opacity={0.5} />;
        })()}
        {/* Ponto 100% (direita) */}
        <circle cx={cx + r} cy={cy} r={3} fill="#22c55e" opacity={0.5} />

        {/* Agulha */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTipX}
          y2={needleTipY}
          stroke={arcColor}
          strokeWidth={3}
          strokeLinecap="round"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transition: "transform 1s ease-out",
          }}
        />

        {/* Pivô central */}
        <circle cx={cx} cy={cy} r={6} fill={arcColor} />
        <circle cx={cx} cy={cy} r={3} fill="white" />

        {/* Score numérico no centro */}
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          fontSize="28"
          fontWeight="bold"
          fill="currentColor"
          className="fill-foreground"
        >
          {clampedScore}
        </text>

        {/* Label abaixo do número */}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontSize="9"
          fill="currentColor"
          className="fill-muted-foreground"
        >
          {label}
        </text>
      </svg>
    </div>
  );
};
