// Orchestrator — lê a mensagem do user e decide qual agente chamar.
//
// V1 (F1): heurística de keywords. Default: Strategist.
// Se a mensagem é claramente "gera copy / variantes / headlines / hooks", roteia pro Copywriter.
//
// V2 (FB-2 / F2 madura): orchestrator vira um pequeno LLM call (Haiku) que classifica
// a intenção. Por ora, regex é suficiente e zero-cost.

import type { AgentChoice, ChatMessage } from "./types.ts";

// Padrões que sinalizam pedido de copy.
const COPYWRITER_TRIGGERS: RegExp[] = [
  /\b(gere?|gera|criar?|cria|escrev[ea]r?|fazer|me d[êe])\s+(copy|copies|variantes?|hooks?|headlines?|posts?|legendas?|titulos?|t[íi]tulos?)/i,
  /\b(\d+)\s+(variantes?|copies|opcoes|op[çc][õo]es)\s+de\s+(copy|anuncio|an[úu]ncio|post)/i,
  /^(copy|copies|variantes|headline|hook)\s+(pra|para|de|do)/i,
];

export function chooseAgent(messages: ChatMessage[]): AgentChoice {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return { primary: "strategist" };

  const txt = lastUser.content || "";
  for (const re of COPYWRITER_TRIGGERS) {
    if (re.test(txt)) return { primary: "copywriter" };
  }
  return { primary: "strategist" };
}
