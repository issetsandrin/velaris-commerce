import Link from "next/link";
import { Flame } from "@/components/Flame";
import { Icon } from "@/components/Icon";
import { Flame as FlameIcon, Home, Leaf, Moon, RotateCcw, Scissors, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ApiUnavailable } from "@/components/ApiUnavailable";
import { ApiError, DEFAULT_STORE_CONFIG, getProducts, getStoreConfig } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { collections, type Collection, type Product } from "@/lib/products";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const collectionOrder: Collection[] = ["casa", "jardim", "noite"];
const collectionIcons = { casa: Home, jardim: Leaf, noite: Moon } as const;

export default async function HomePage() {
  let products: Product[] = [];
  let apiError: string | null = null;
  try {
    products = await getProducts();
  } catch (error) {
    apiError = error instanceof ApiError ? error.message : "Erro inesperado ao carregar o catálogo.";
  }

  const featured = products.filter((product) => product.featured).slice(0, 4);
  const freeFrom = await getStoreConfig().then((config) => config.shipping.freeFrom).catch(() => DEFAULT_STORE_CONFIG.shipping.freeFrom);

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={`enter-children ${styles.heroCopy}`}>
            <h1 className={styles.heroTitle}>Uma vela acesa muda o cômodo inteiro.</h1>
            <p className={styles.heroLead}>
              Cera de coco, pavio de algodão e fragrâncias compostas aqui, em lotes de vinte. Velas
              para acender todo dia, não só na visita.
            </p>
            <div className={styles.heroActions}>
              <Link href="/colecao" className="btn btn-primary">
                Ver a coleção
              </Link>
              <Link href="/#colecoes" className={`link-underline ${styles.heroSecondary}`}>
                Escolher pelo aroma
              </Link>
            </div>
          </div>
          <div className={styles.heroFlame}>
            <Flame className={styles.flame} />
          </div>
        </div>
      </section>

      <section className={`section ${styles.featured}`}>
        <div className="container">
          <div className={styles.sectionHead} data-reveal>
            <div>
              <p className="eyebrow">
                <Icon icon={Sparkles} size={15} />
                Destaques
              </p>
              <h2 className="section-title">As mais acesas este mês</h2>
            </div>
            <Link href="/colecao" className={`link-underline ${styles.sectionLink}`}>
              Toda a coleção
            </Link>
          </div>
          {apiError ? (
            <ApiUnavailable message={apiError} />
          ) : (
            <div className={styles.grid} data-reveal>
              {featured.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="colecoes" className={`section ${styles.collections}`}>
        <div className="container">
          <div data-reveal>
            <p className="eyebrow">
              <Icon icon={FlameIcon} size={15} />
              Coleções
            </p>
            <h2 className="section-title">Três coleções, três horas do dia</h2>
            <p className="section-lead">
              Organizamos os aromas pelo momento em que fazem mais sentido. Se você não sabe por
              onde começar, comece pela hora em que costuma acender uma vela.
            </p>
          </div>
          <div className={`reveal-stagger ${styles.collectionList}`}>
            {collectionOrder.map((key) => {
              const collection = collections[key];
              const count = products.filter((product) => product.collection === key).length;
              return (
                <Link key={key} href={`/colecao?colecao=${key}`} className={styles.collectionItem} data-reveal>
                  <Icon icon={collectionIcons[key]} size={22} className={styles.collectionIcon} />
                  <h3 className={styles.collectionName}>{collection.name}</h3>
                  <p className={styles.collectionText}>{collection.description}</p>
                  {count > 0 && (
                    <span className={styles.collectionCount}>
                      {count} {count === 1 ? "vela" : "velas"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="como-fazemos" className={`section ${styles.craft}`}>
        <div className={`container reveal-stagger ${styles.craftInner}`}>
          <div data-reveal>
            <p className="eyebrow">
              <Icon icon={Leaf} size={15} />
              Ateliê
            </p>
            <h2 className="section-title">Como fazemos</h2>
          </div>
          <div className={styles.craftText} data-reveal>
            <p>
              Usamos cera de coco porque ela queima limpa e devagar, sem fuligem, e segura o perfume
              até o fim do pote. Cada lote tem vinte velas: o suficiente para acompanhar cada uma,
              pouco o suficiente para não virar linha de produção.
            </p>
            <p>
              As fragrâncias são compostas em Curitiba, sem ftalatos, com óleos essenciais onde faz
              sentido e moléculas seguras onde a natureza não chega. O pavio é de algodão trançado,
              sem chumbo, e os potes são de vidro ou cerâmica para você lavar e reaproveitar.
            </p>
            <dl className={styles.facts}>
              <div>
                <dt>
                  <Icon icon={FlameIcon} size={20} />
                  Primeira queima
                </dt>
                <dd>Deixe acesa até a cera derreter toda a superfície, cerca de duas horas.</dd>
              </div>
              <div>
                <dt>
                  <Icon icon={Scissors} size={20} />
                  Pavio
                </dt>
                <dd>Apare a 5 mm antes de acender de novo. A chama fica baixa e sem fumaça.</dd>
              </div>
              <div>
                <dt>
                  <Icon icon={Truck} size={20} />
                  Envio
                </dt>
                <dd>Postamos em até dois dias úteis. Frete grátis a partir de {formatPrice(freeFrom)}.</dd>
              </div>
              <div>
                <dt>
                  <Icon icon={RotateCcw} size={20} />
                  Trocas
                </dt>
                <dd>Chegou quebrada ou não era o aroma que você imaginava? Trocamos em sete dias.</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
