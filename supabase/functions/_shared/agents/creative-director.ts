// Creative Director agent — direção criativa e visual para campanhas.
//
// Recebe o DNA visual/vocal da marca + brief e gera direção criativa estruturada:
// conceito visual, mood de cores, ângulo de hook, tom de copy e image prompts.

import { DEFAULT_MODEL } from "../anthropic.ts";

export const CREATIVE_DIRECTOR_MODEL = DEFAULT_MODEL;
export const CREATIVE_DIRECTOR_MAX_TOKENS = 2500;

export interface CreativeDirectorContext {
  brandVisualProfile: string;   // perfil visual da marca (cores, tipografia, estilo)
  brandVoiceProfile: string;    // perfil de voz da marca (tom, linguagem, exemplos)
  brief: string;                // briefing da campanha/peça
  industry: string;             // setor/nicho da empresa
  targetPersona: string;        // persona-alvo da campanha
}

export interface CreativeDirectorResult {
  visual_concept: string;
  color_mood: string;
  composition_notes: string;
  hook_angle: string;
  copy_tone: string;
  dos: string[];
  donts: string[];
  image_prompts: string[];
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

const SYSTEM_PROMPT = "Você é o Creative Director do Orion. Com base no DNA visual e vocal da marca, gera direção criativa precisa para campanhas de marketing digital. Foco: consistência de marca, diferenciação e impacto visual.";

const TOOL_DEFINITION = {
  name: "generate_creative_direction",
  description: "Gera direção criativa completa com conceito visual, mood, notas de composição, ângulo de hook, tom de copy, dos & don'ts e prompts de imagem.",
  input_schema: {
    type: "object",
    properties: {
      visual_concept: {
        type: "string",
        description: "Conceito visual central da campanha",
      },
      color_mood: {
        type: "string",
        description: "Paleta e mood de cores recomendados",
      },
      composition_notes: {
        type: "string",
        description: "Notas de composição visual (enquadramento, hierarquia, espaço negativo etc.)",
      },
      hook_angle: {
        type: "string",
        description: "Ângulo principal do hook (o que vai prender a atenção nos primeiros segundos)",
      },
      copy_tone: {
        type: "string",
        description: "Tom e estilo de copy alinhado ao DNA da marca para esta campanha",
      },
      dos: {
        type: "array",
        items: { type: "string" },
        description: "Lista de boas práticas e elementos que devem ser usados",
      },
      donts: {
        type: "array",
        items: { type: "string" },
        description: "Lista de elementos e práticas que devem ser evitados",
      },
      image_prompts: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "Exatamente 3 prompts de imagem detalhados para geração por IA",
      },
    },
    required: [
      "visual_concept",
      "color_mood",
      "composition_notes",
      "hook_angle",
      "copy_tone",
      "dos",
      "donts",
      "image_prompts",
    ],
  },
};

function buildUserPrompt(ctx: CreativeDirectorContext): string {
  return [
    `# Briefing da Campanha`,
    ctx.brief,
    ``,
    `# Setor / Nicho`,
    ctx.industry,
    ``,
    `# Persona-Alvo`,
    ctx.targetPersona,
    ``,
    `# DNA Visual da Marca`,
    ctx.brandVisualProfile || "Não informado.",
    ``,
    `# DNA Vocal da Marca`,
    ctx.brandVoiceProfile || "Não informado.",
    ``,
    `Com base nesse contexto, gere a direção criativa completa usando a ferramenta generate_creative_direction.`,
  ].join("\n");
}

export async function runCreativeDirector(
  ctx: CreativeDirectorContext,
): Promise<CreativeDirectorResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada nos secrets do Supabase");

  const body = {
    model: CREATIVE_DIRECTOR_MODEL,
    max_tokens: CREATIVE_DIRECTOR_MAX_TOKENS,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    tools: [TOOL_DEFINITION],
    tool_choice: { type: "tool", name: "generate_creative_direction" },
    messages: [
      { role: "user", content: buildUserPrompt(ctx) },
    ],
  };

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Creative Director Anthropic ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const tokensIn: number = data?.usage?.input_tokens ?? 0;
  const tokensOut: number = data?.usage?.output_tokens ?? 0;
  const costUsd: number = ((tokensIn / 1_000_000) * 3.0) + ((tokensOut / 1_000_000) * 15.0);

  // Extrai o tool_use block da resposta
  const toolUseBlock = (data?.content ?? []).find(
    (block: { type: string }) => block.type === "tool_use",
  );
  if (!toolUseBlock) {
    throw new Error("Creative Director: resposta sem tool_use block");
  }

  const input = toolUseBlock.input as {
    visual_concept: string;
    color_mood: string;
    composition_notes: string;
    hook_angle: string;
    copy_tone: string;
    dos: string[];
    donts: string[];
    image_prompts: string[];
  };

  return {
    visual_concept: input.visual_concept,
    color_mood: input.color_mood,
    composition_notes: input.composition_notes,
    hook_angle: input.hook_angle,
    copy_tone: input.copy_tone,
    dos: input.dos ?? [],
    donts: input.donts ?? [],
    image_prompts: input.image_prompts ?? [],
    tokensIn,
    tokensOut,
    costUsd,
  };
}
