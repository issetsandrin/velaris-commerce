import type { LucideIcon } from "lucide-react";

interface IconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
}

/** Ícone de traço fino, decorativo (sem semântica própria), na cor bronze da marca. */
export function Icon({ icon: Glyph, size = 18, className }: IconProps) {
  return <Glyph size={size} strokeWidth={1.5} aria-hidden="true" focusable="false" className={`icon ${className ?? ""}`} />;
}
