import styles from "./Flame.module.css";

interface FlameProps {
  className?: string;
}

export function Flame({ className }: FlameProps) {
  return (
    <div className={`${styles.wrap} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.glow} />
      <svg viewBox="0 0 120 220" className={styles.svg}>
        <defs>
          <radialGradient id="flame-outer" cx="50%" cy="70%" r="60%">
            <stop offset="0%" stopColor="#d2b673" />
            <stop offset="55%" stopColor="#b9994d" />
            <stop offset="100%" stopColor="#9a7935" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id="flame-inner" cx="50%" cy="80%" r="55%">
            <stop offset="0%" stopColor="#fbf8f2" />
            <stop offset="60%" stopColor="#ecdcb0" />
            <stop offset="100%" stopColor="#d2b673" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="flame-core" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#7a5d29" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7a5d29" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className={styles.flame}>
          <path
            fill="url(#flame-outer)"
            d="M60 22 C74 52 92 74 92 110 C92 138 78 156 60 156 C42 156 28 138 28 110 C28 74 46 52 60 22 Z"
          />
          <path
            fill="url(#flame-inner)"
            d="M60 66 C70 88 80 100 80 120 C80 138 71 150 60 150 C49 150 40 138 40 120 C40 100 50 88 60 66 Z"
          />
          <path
            fill="url(#flame-core)"
            d="M60 118 C66 128 70 136 70 144 C70 152 65 157 60 157 C55 157 50 152 50 144 C50 136 54 128 60 118 Z"
          />
        </g>

        <rect x="58.5" y="154" width="3" height="22" rx="1.5" fill="#4a3818" />
        <path d="M22 176 H98" stroke="#7a5d29" strokeOpacity="0.45" strokeWidth="1" />
      </svg>
    </div>
  );
}
