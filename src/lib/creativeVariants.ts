const safe = (value?: string) => value?.trim() || "";

export interface GeneratedVariant {
  title: string;
  variant_type: string;
  angle: string;
  hook: string;
  primary_copy: string;
  cta: string;
  visual_prompt: string;
  test_focus: string;
  score: number;
  status: string;
}

// Score based on how many key brief fields are filled (40–95 range)
const calcScore = (brief: Record<string, any>, bonusFields: string[]): number => {
  const coreFields = ["objetivo", "publico", "mensagem_chave", "cta"];
  const coreFilled = coreFields.filter((f) => safe(brief[f])).length;
  const bonusFilled = bonusFields.filter((f) => safe(brief[f])).length;
  const base = Math.round((coreFilled / coreFields.length) * 55) + 40;
  const bonus = Math.round((bonusFilled / Math.max(bonusFields.length, 1)) * 10);
  return Math.min(95, base + bonus);
};

export const generateCreativeVariantsFromBrief = (brief: Record<string, any>): GeneratedVariant[] => {
  const objetivo = safe(brief.objetivo) || "Gerar resposta imediata";
  const publico = safe(brief.publico) || "ICP principal";
  const mensagem = safe(brief.mensagem_chave) || "Proposta de valor principal";
  const hookBase = safe(brief.hook_principal) || "Nova forma de resolver isso";
  const cta = safe(brief.cta) || "Quero ver isso";
  const visual = safe(brief.prompt_visual) || "Cena realista do problema e da transformação";

  return [
    {
      title: "Variante Prova",
      variant_type: "proof",
      angle: "Prova concreta",
      hook: `Como ${publico} conseguiu resultado sem complicação`,
      primary_copy: `${mensagem}. Traga um exemplo, dado ou prova visível para sustentar ${objetivo.toLowerCase()}.`,
      cta,
      visual_prompt: `${visual}. Mostrar prova, resultado, números ou antes/depois com clareza.`,
      test_focus: "Credibilidade e prova social",
      score: calcScore(brief, ["hook_principal", "referencias", "metricas_sucesso"]),
      status: "draft",
    },
    {
      title: "Variante Dor",
      variant_type: "pain",
      angle: "Dor latente",
      hook: safe(hookBase) || `O custo de continuar como está para ${publico}`,
      primary_copy: `Mostre a fricção atual de ${publico} e como ${mensagem.toLowerCase()} elimina a dor principal sem aumentar complexidade.`,
      cta,
      visual_prompt: `${visual}. Enfatizar frustração do cenário atual e contraste com a solução.`,
      test_focus: "Urgência e problema percebido",
      score: calcScore(brief, ["angulo_criativo", "roteiro_base", "testes_ab"]),
      status: "draft",
    },
    {
      title: "Variante Desejo",
      variant_type: "desire",
      angle: "Desejo aspiracional",
      hook: `O cenário ideal depois de aplicar ${mensagem}`,
      primary_copy: `Pinte o estado desejado para ${publico}, conectando transformação, ganho concreto e a promessa central do brief.`,
      cta,
      visual_prompt: `${visual}. Mostrar estado aspiracional, ganho percebido e contexto de uso real.`,
      test_focus: "Desejo, ganho e identidade",
      score: calcScore(brief, ["estrutura_peca", "prompt_visual", "hook_principal"]),
      status: "draft",
    },
  ];
};
