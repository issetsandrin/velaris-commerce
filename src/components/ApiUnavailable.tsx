import { API_URL } from "@/lib/api";
import styles from "./ApiUnavailable.module.css";

export function ApiUnavailable({ message }: { message?: string }) {
  return (
    <div className={styles.box} role="alert">
      <p className={styles.title}>A loja não conseguiu falar com a API.</p>
      <p className={styles.text}>
        {message ?? `Nenhuma resposta de ${API_URL}.`} Suba a API com <code>docker compose up</code> na
        pasta <code>velaris-api</code> e recarregue a página.
      </p>
    </div>
  );
}
