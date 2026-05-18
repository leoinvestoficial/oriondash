// useDensity — hook focado em density_mode + persona.
// Envolve useUserPreferences com helpers booleanos pra simplificar uso em components.
//
// Convenção:
//   - simple   = Owner (linguagem clara, esconde detalhes)
//   - detailed = Marketer (default — mostra tudo razoável)
//   - pro      = Agência (alta densidade, multi-cliente)
//
// Uso típico em componente:
//   const { density, isOwner, isPro } = useDensity();
//   {isOwner ? <SimpleKpis /> : <FullKpis />}

import { useUserPreferences, type DensityMode, type Persona } from "./useUserPreferences";

export type { DensityMode, Persona };

export interface UseDensityReturn {
  density: DensityMode;
  persona: Persona | null;
  setDensity: (mode: DensityMode) => Promise<void> | void;
  setPersona: (persona: Persona) => Promise<void> | void;
  isOwner: boolean;     // density === simple
  isMarketer: boolean;  // density === detailed
  isPro: boolean;       // density === pro
  loading: boolean;
}

export function useDensity(): UseDensityReturn {
  const { prefs, loading, setDensity, setPersona } = useUserPreferences();
  return {
    density: prefs.density_mode,
    persona: prefs.persona,
    setDensity,
    setPersona,
    isOwner: prefs.density_mode === "simple",
    isMarketer: prefs.density_mode === "detailed",
    isPro: prefs.density_mode === "pro",
    loading,
  };
}
