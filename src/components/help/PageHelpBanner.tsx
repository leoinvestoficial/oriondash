import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { X, Info, HelpCircle } from "lucide-react";
import { useState } from "react";

export interface PageHelpContent {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
}

interface Props {
  content: PageHelpContent;
}

export const PageHelpBanner = ({ content }: Props) => {
  const { isBannerHidden, hideBanner, showBanner } = useUserPreferences();
  const hidden = isBannerHidden(content.id);
  const [forceShow, setForceShow] = useState(false);

  if (hidden && !forceShow) {
    return (
      <button
        onClick={() => {
          showBanner(content.id);
          setForceShow(true);
        }}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        O que é esta aba?
      </button>
    );
  }

  return (
    <div className="relative mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 pr-10">
      <button
        onClick={() => {
          hideBanner(content.id);
          setForceShow(false);
        }}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Ocultar"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground mb-1">{content.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{content.description}</p>
          {content.bullets && content.bullets.length > 0 && (
            <ul className="mt-2 space-y-1">
              {content.bullets.map((b, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
