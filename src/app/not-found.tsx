import Link from "next/link";
import { SearchX } from "lucide-react";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <section className="container section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "flex-start" }}>
      {/* Mesmo ícone dos estados vazios do catálogo e dos pedidos */}
      <Icon icon={SearchX} size={40} />
      <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 400 }}>Página não encontrada.</h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: "48ch" }}>
        O endereço não existe ou a vela saiu de linha. Veja a coleção completa para encontrar o que
        procura.
      </p>
      <Link href="/colecao" className="btn btn-primary">
        Ver a coleção
      </Link>
    </section>
  );
}
