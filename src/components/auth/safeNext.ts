/** Aceita apenas caminhos internos como destino após login, evitando redirecionamento aberto. */
export function safeNext(value: string | null, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
