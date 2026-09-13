import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "flex-start" }}>
      <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 400 }}>Essa página apagou.</h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: "48ch" }}>
        O endereço não existe ou a vela saiu de linha. A coleção completa continua acesa.
      </p>
      <Link href="/colecao" className="btn btn-primary">
        Ver a coleção
      </Link>
    </section>
  );
}
