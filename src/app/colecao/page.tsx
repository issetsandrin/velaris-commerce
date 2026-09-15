import { Suspense } from "react";
import type { Metadata } from "next";
import { ApiUnavailable } from "@/components/ApiUnavailable";
import { SkeletonProduct } from "@/components/Skeleton";
import { ApiError, getProducts } from "@/lib/api";
import type { Product } from "@/lib/products";
import { Catalog } from "./Catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coleção",
  description: "Todas as velas Velaris, filtradas por coleção e família olfativa.",
};

async function loadProducts(): Promise<{ products: Product[]; error: string | null }> {
  try {
    return { products: await getProducts(), error: null };
  } catch (error) {
    return {
      products: [],
      error: error instanceof ApiError ? error.message : "Não foi possível carregar o catálogo.",
    };
  }
}

export default async function CollectionPage() {
  const { products, error } = await loadProducts();

  if (error) {
    return (
      <section className="container section">
        <ApiUnavailable message={error} />
      </section>
    );
  }

  return (
    <>
      <Suspense fallback={<CatalogoCarregando />}>
        <Catalog products={products} />
      </Suspense>
    </>
  );
}

/** Vitrine em cinza enquanto o catálogo monta. */
function CatalogoCarregando() {
  return (
    <section className="container section" role="status" aria-label="Carregando a coleção">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(13.5rem, 1fr))",
          gap: "2rem 1.5rem",
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonProduct key={i} />
        ))}
      </div>
    </section>
  );
}
