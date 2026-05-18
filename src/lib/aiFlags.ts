// Feature flags do Cérebro v2.
// Por enquanto controlado por variável de ambiente VITE_ORION_CHAT_V2 ("on" | "off").
// No futuro pode vir de user_preferences (DB) pra A/B testing por user.

export function isChatV2Enabled(): boolean {
  const value = import.meta.env.VITE_ORION_CHAT_V2 ?? import.meta.env.VITE_USE_CHAT_V2;
  // Default OFF até validarmos. Trocar pra "on" no .env quando estiver pronto.
  return value === "on" || value === "true" || value === "1";
}

/**
 * Nome da edge function de chat. Pra trocar entre v1 e v2 sem modificar callers.
 */
export function chatFunctionName(): "chat" | "chat-v2" {
  return isChatV2Enabled() ? "chat-v2" : "chat";
}

/**
 * F2 — gerar variantes via Copywriter agente (edge function generate-variants)
 * em vez do template hardcoded local (creativeVariants.ts).
 *
 * Off por padrão. Liga depois de:
 *   1. Migration F1 (chat-v2 + brand_voice_profile) aplicada
 *   2. Edge function generate-variants deployada
 *   3. Anthropic key configurada nos secrets do Supabase
 */
export function isAiVariantsEnabled(): boolean {
  const value = import.meta.env.VITE_ORION_AI_VARIANTS;
  return value === "on" || value === "true" || value === "1";
}

/**
 * F2 — habilitar geração de imagem via Replicate em cada variante criativa.
 *
 * Off por padrão. Liga depois de:
 *   1. Migration F2 aplicada (creative-assets bucket existir)
 *   2. Edge function generate-image deployada
 *   3. REPLICATE_API_TOKEN configurada nos secrets do Supabase
 */
export function isImageGenEnabled(): boolean {
  const value = import.meta.env.VITE_ORION_IMAGE_GEN;
  return value === "on" || value === "true" || value === "1";
}
