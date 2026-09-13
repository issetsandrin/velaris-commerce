import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CandleArt } from "@/components/CandleArt";
import { ProductCard } from "@/components/ProductCard";
import { ApiUnavailable } from "@/components/ApiUnavailable";
import { Icon } from "@/components/Icon";
import { Flame, Heart, Leaf, Mountain, Truck, Wind } from "lucide-react";
import { ApiError, DEFAULT_STORE_CONFIG, getProduct, getProducts, getStoreConfig } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { collections, families } from "@/lib/products";
import { AddToCart } from "./AddToCart";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    if (!product) return { title: "Vela não encontrada" };
    return { title: product.name, description: product.tagline };
  } catch {
    return { title: "Produto" };
  }
}

export default async function ProductPage({ params }: PageProps<"/produto/[slug]">) {
  const { slug } = await params;

  let product;
  let related = [];
  const freeFrom = await getStoreConfig().then((config) => config.shipping.freeFrom).catch(() => DEFAULT_STORE_CONFIG.shipping.freeFrom);
  try {
    product = await getProduct(slug);
    if (!product) notFound();
    const all = await getProducts();
    related = all
      .filter((item) => item.slug !== product!.slug && item.collection === product!.collection)
      .slice(0, 3);
  } catch (error) {
    if (error instanceof ApiError) {
      return (
        <section className="container section">
          <ApiUnavailable message={error.message} />
        </section>
      );
    }
    throw error;
  }

  return (
    <>
      <article className={`container ${styles.product}`}>
        <nav aria-label="Você está em" className={styles.crumbs}>
          <Link href="/colecao">Coleção</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/colecao?colecao=${product.collection}`}>{collections[product.collection].name}</Link>
        </nav>

        <div className={`enter-children ${styles.layout}`}>
          <div className={styles.artWrap}>
            <CandleArt wax={product.wax} collection={product.collection} lit className={styles.art} />
          </div>

          <div className={styles.info}>
            <p className={styles.meta}>
              {collections[product.collection].name}, {families[product.family].toLowerCase()}
            </p>
            <h1 className={styles.title}>{product.name}</h1>
            <p className={styles.tagline}>{product.tagline}</p>

            <AddToCart product={product} />

            <p className={styles.description}>{product.description}</p>

            <dl className={styles.notes}>
              <div>
                <dt>
                  <Icon icon={Wind} size={18} />
                  Saída
                </dt>
                <dd>{product.notes.top}</dd>
              </div>
              <div>
                <dt>
                  <Icon icon={Heart} size={18} />
                  Coração
                </dt>
                <dd>{product.notes.heart}</dd>
              </div>
              <div>
                <dt>
                  <Icon icon={Mountain} size={18} />
                  Fundo
                </dt>
                <dd>{product.notes.base}</dd>
              </div>
            </dl>

            <div className={styles.details} data-reveal>
              <details>
                <summary>
                  <span className="title-icon">
                    <Icon icon={Leaf} size={18} />
                    Composição
                  </span>
                </summary>
                <p>
                  Cera de coco 100% vegetal, pavio de algodão trançado sem chumbo, fragrância sem
                  ftalatos. Pote de {product.collection === "jardim" ? "cerâmica esmaltada" : "vidro"},
                  reaproveitável.
                </p>
              </details>
              <details>
                <summary>
                  <span className="title-icon">
                    <Icon icon={Flame} size={18} />
                    Cuidados
                  </span>
                </summary>
                <p>
                  Na primeira queima, deixe acesa até a cera derreter toda a superfície. Apare o pavio
                  a 5 mm antes de reacender. Não deixe acesa por mais de quatro horas seguidas.
                </p>
              </details>
              <details>
                <summary>
                  <span className="title-icon">
                    <Icon icon={Truck} size={18} />
                    Envio e trocas
                  </span>
                </summary>
                <p>
                  Postamos em até dois dias úteis, com embalagem que protege o pote. Frete grátis a
                  partir de {formatPrice(freeFrom)}. Trocas em até sete dias após o recebimento.
                </p>
              </details>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className={`section ${styles.related}`}>
          <div className="container">
            <p className="eyebrow">Você também pode gostar</p>
            <h2 className="section-title">Da mesma coleção</h2>
            <div className={styles.relatedGrid} data-reveal>
              {related.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
