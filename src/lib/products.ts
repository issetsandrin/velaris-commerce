export type Collection = "casa" | "jardim" | "noite";
export type Family = "amadeirado" | "citrico" | "floral" | "gourmand" | "herbal";
export type SizeKey = "p" | "m" | "g";

export interface Size {
  id: number;
  key: SizeKey;
  label: string;
  weight: string;
  burnHours: number;
  /** Preço cobrado agora (promocional quando em promoção). */
  price: number;
  /** Preço cheio de tabela. */
  listPrice: number;
  onSale: boolean;
  promoEndsAt: string | null;
  stock: number;
  inStock: boolean;
  lowStock: boolean;
}

export interface Product {
  slug: string;
  name: string;
  collection: Collection;
  family: Family;
  tagline: string;
  description: string;
  notes: { top: string; heart: string; base: string };
  wax: string;
  featured: boolean;
  sizes: Size[];
}

export const collections: Record<Collection, { name: string; description: string }> = {
  casa: {
    name: "Casa",
    description: "Aromas que acolhem: baunilha, café, frutas maduras. Para a sala no fim de tarde.",
  },
  jardim: {
    name: "Jardim",
    description: "Ervas, cítricos e flores brancas. Frescos, limpos, feitos para a manhã.",
  },
  noite: {
    name: "Noite",
    description: "Madeiras, resinas e flores noturnas. Densos, quentes, para quando a casa se aquieta.",
  },
};

export const families: Record<Family, string> = {
  amadeirado: "Amadeirado",
  citrico: "Cítrico",
  floral: "Floral",
  gourmand: "Gourmand",
  herbal: "Herbal",
};

export function getSize(product: Product, key: SizeKey): Size {
  return product.sizes.find((size) => size.key === key) ?? product.sizes[0];
}

/** Tamanho padrão para o adicionar rápido: Média se houver estoque, senão o primeiro disponível. */
export function defaultSize(product: Product): Size {
  const media = product.sizes.find((size) => size.key === "m");
  if (media?.inStock) return media;
  return product.sizes.find((size) => size.inStock) ?? media ?? product.sizes[0];
}

export function isSoldOut(product: Product): boolean {
  return product.sizes.every((size) => !size.inStock);
}

export function isOnSale(product: Product): boolean {
  return product.sizes.some((size) => size.onSale);
}
