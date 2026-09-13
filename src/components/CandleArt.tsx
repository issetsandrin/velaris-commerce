import type { Collection } from "@/lib/products";

interface CandleArtProps {
  wax: string;
  collection: Collection;
  lit?: boolean;
  className?: string;
}

/**
 * Ilustração vetorial da vela. O formato do recipiente muda por coleção,
 * a cor da cera muda por aroma.
 */
export function CandleArt({ wax, collection, lit = false, className }: CandleArtProps) {
  const glassTint =
    collection === "noite"
      ? "rgba(122, 93, 41, 0.28)"
      : collection === "jardim"
        ? "rgba(255, 255, 255, 0.35)"
        : "rgba(255, 255, 255, 0.18)";

  const vessel =
    collection === "jardim"
      ? // cerâmica com base arredondada
        "M52 70 H148 V168 C148 186 130 194 100 194 C70 194 52 186 52 168 Z"
      : collection === "noite"
        ? // vidro alto e reto
          "M58 52 H142 V190 C142 194 138 196 134 196 H66 C62 196 58 194 58 190 Z"
        : // pote de vidro clássico
          "M50 78 C50 72 54 68 60 68 H140 C146 68 150 72 150 78 V184 C150 190 146 194 140 194 H60 C54 194 50 190 50 184 Z";

  const waxTop = collection === "jardim" ? 96 : collection === "noite" ? 84 : 98;
  const waxShape =
    collection === "jardim"
      ? `M52 ${waxTop} H148 V168 C148 186 130 194 100 194 C70 194 52 186 52 168 Z`
      : collection === "noite"
        ? `M58 ${waxTop} H142 V190 C142 194 138 196 134 196 H66 C62 196 58 194 58 190 Z`
        : `M50 ${waxTop} H150 V184 C150 190 146 194 140 194 H60 C54 194 50 190 50 184 Z`;

  return (
    <svg viewBox="0 0 200 220" className={className} role="img" aria-hidden="true">
      {/* sombra no chão */}
      <ellipse cx="100" cy="204" rx="60" ry="6" fill="rgba(122,93,41,0.12)" />

      {/* cera */}
      <path d={waxShape} fill={wax} />
      {/* superfície da cera */}
      <ellipse
        cx="100"
        cy={waxTop}
        rx={collection === "noite" ? 42 : 50}
        ry="6"
        fill="rgba(255,255,255,0.35)"
      />

      {/* recipiente */}
      <path d={vessel} fill={glassTint} stroke="rgba(122,93,41,0.45)" strokeWidth="1.2" />
      {/* reflexo */}
      <path
        d={
          collection === "jardim"
            ? "M62 80 V160"
            : collection === "noite"
              ? "M68 62 V180"
              : "M60 82 V178"
        }
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* etiqueta */}
      <rect
        x="76"
        y={waxTop + 26}
        width="48"
        height="30"
        fill="rgba(251,247,239,0.92)"
        stroke="rgba(122,93,41,0.25)"
        strokeWidth="0.8"
      />
      <path d={`M84 ${waxTop + 38} H116`} stroke="rgba(122,93,41,0.45)" strokeWidth="1" />
      <path d={`M90 ${waxTop + 45} H110`} stroke="rgba(122,93,41,0.3)" strokeWidth="1" />

      {/* pavio */}
      <rect x="98.8" y={waxTop - 14} width="2.4" height="15" rx="1.2" fill="#4a3818" />

      {lit && (
        <g>
          <ellipse cx="100" cy={waxTop - 18} rx="22" ry="26" fill="rgba(210,182,115,0.22)" />
          <path
            d={`M100 ${waxTop - 40} C106 ${waxTop - 30} 110 ${waxTop - 24} 110 ${waxTop - 16} C110 ${waxTop - 9} 105 ${waxTop - 5} 100 ${waxTop - 5} C95 ${waxTop - 5} 90 ${waxTop - 9} 90 ${waxTop - 16} C90 ${waxTop - 24} 94 ${waxTop - 30} 100 ${waxTop - 40} Z`}
            fill="#d2b673"
          />
          <path
            d={`M100 ${waxTop - 26} C103 ${waxTop - 20} 105 ${waxTop - 16} 105 ${waxTop - 12} C105 ${waxTop - 8} 102 ${waxTop - 6} 100 ${waxTop - 6} C98 ${waxTop - 6} 95 ${waxTop - 8} 95 ${waxTop - 12} C95 ${waxTop - 16} 97 ${waxTop - 20} 100 ${waxTop - 26} Z`}
            fill="#fbf8f2"
          />
        </g>
      )}
    </svg>
  );
}
