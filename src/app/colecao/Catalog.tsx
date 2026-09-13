"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronRight, Flower2, Layers, LayoutGrid, Rows3, Search, SearchX, Tag, Wallet, X } from "lucide-react";
import { collections, families, isOnSale, type Collection, type Family, type Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import styles from "./Catalog.module.css";

/** Quantas velas cabem numa página antes de a lista virar paginada. */
const POR_PAGINA = 10;

const collectionKeys = Object.keys(collections) as Collection[];
const familyKeys = Object.keys(families) as Family[];

function isCollection(value: string | null): value is Collection {
  return value !== null && value in collections;
}

function isFamily(value: string | null): value is Family {
  return value !== null && value in families;
}

export function Catalog({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const collection = isCollection(params.get("colecao")) ? (params.get("colecao") as Collection) : null;
  const family = isFamily(params.get("familia")) ? (params.get("familia") as Family) : null;
  const search = params.get("busca") ?? "";
  const onlySale = params.get("promocao") === "1";

  // Limites da faixa: o menor e o maior preço do catálogo, arredondados na dezena.
  const [pisoCatalogo, tetoCatalogo] = useMemo(() => {
    const precos = products.flatMap((product) => product.sizes.map((size) => size.price));
    if (precos.length === 0) return [0, 0];
    return [Math.floor(Math.min(...precos) / 10) * 10, Math.ceil(Math.max(...precos) / 10) * 10];
  }, [products]);

  const minUrl = numeroNaFaixa(params.get("min"), pisoCatalogo, tetoCatalogo) ?? pisoCatalogo;
  const maxUrl = numeroNaFaixa(params.get("max"), pisoCatalogo, tetoCatalogo) ?? tetoCatalogo;

  // O campo é controlado localmente: preso à URL, cada tecla atropelava a anterior.
  const [visao, setVisao] = useState<"grade" | "linha">("grade");
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState(search);
  const termo = normalizar(busca);

  // Mesma ideia para a faixa de preço: arrastar é local, a URL acompanha depois.
  const [faixa, setFaixa] = useState<[number, number]>([minUrl, maxUrl]);
  const [faixaNaUrl, setFaixaNaUrl] = useState(`${minUrl}-${maxUrl}`);
  if (faixaNaUrl !== `${minUrl}-${maxUrl}`) {
    setFaixaNaUrl(`${minUrl}-${maxUrl}`);
    setFaixa([minUrl, maxUrl]);
  }
  const [piso, teto] = faixa;
  const faixaCheia = piso <= pisoCatalogo && teto >= tetoCatalogo;

  // Voltar, limpar filtros ou abrir um link com ?busca= refletem no campo: é o
  // ajuste em render que o React recomenda para estado derivado de fora.
  const [buscaNaUrl, setBuscaNaUrl] = useState(search);
  if (buscaNaUrl !== search) {
    setBuscaNaUrl(search);
    setBusca(search);
  }

  useEffect(() => {
    if (busca === search) return;
    const timer = window.setTimeout(() => update("busca", busca.trim() || null), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  useEffect(() => {
    if (piso === minUrl && teto === maxUrl) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (piso > pisoCatalogo) next.set("min", String(piso));
      else next.delete("min");
      if (teto < tetoCatalogo) next.set("max", String(teto));
      else next.delete("max");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piso, teto]);

  // Busca e promoção valem antes dos filtros: as contagens ao lado já saem prontas.
  const encontrados = useMemo(
    () =>
      products.filter(
        (product) =>
          (!termo || combina(product, termo)) &&
          (!onlySale || isOnSale(product)) &&
          // Basta um tamanho caber no bolso para a vela continuar na lista.
          product.sizes.some((size) => size.price >= piso && size.price <= teto),
      ),
    [products, termo, onlySale, piso, teto],
  );

  const list = useMemo(
    () =>
      encontrados.filter(
        (product) =>
          (!collection || product.collection === collection) &&
          (!family || product.family === family),
      ),
    [encontrados, collection, family],
  );

  // As contagens já consideram o outro filtro: é o que o cliente vê ao clicar.
  const porColecao = useMemo(() => {
    const base = encontrados.filter((product) => !family || product.family === family);
    return {
      total: base.length,
      por: Object.fromEntries(
        collectionKeys.map((key) => [key, base.filter((product) => product.collection === key).length]),
      ) as Record<Collection, number>,
    };
  }, [encontrados, family]);

  const porFamilia = useMemo(() => {
    const base = encontrados.filter((product) => !collection || product.collection === collection);
    return {
      total: base.length,
      por: Object.fromEntries(
        familyKeys.map((key) => [key, base.filter((product) => product.family === key).length]),
      ) as Record<Family, number>,
    };
  }, [encontrados, collection]);

  const semPromocao = useMemo(() => {
    const base = products.filter(
      (product) =>
        (!termo || combina(product, termo)) &&
        (!collection || product.collection === collection) &&
        (!family || product.family === family),
    );
    return { emPromocao: base.filter(isOnSale).length };
  }, [products, termo, collection, family]);

  function update(key: "colecao" | "familia" | "busca" | "promocao", value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Paginação: só aparece quando a lista passa de uma página cheia.
  const paginas = Math.max(1, Math.ceil(list.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, paginas);
  const visiveis = list.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  // Mexer nos filtros devolve para a primeira página.
  const assinatura = `${termo}|${collection}|${family}|${onlySale}|${piso}|${teto}`;
  const [assinaturaAnterior, setAssinaturaAnterior] = useState(assinatura);
  if (assinaturaAnterior !== assinatura) {
    setAssinaturaAnterior(assinatura);
    setPagina(1);
  }

  function irPara(numero: number) {
    setPagina(numero);
    document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const title = collection ? `Coleção ${collections[collection].name}` : "Toda a coleção";
  const lead = collection
    ? collections[collection].description
    : "Nove aromas, três tamanhos. Filtre pela hora do dia ou pelo tipo de cheiro que você procura.";

  return (
    <section className={`section ${styles.page}`}>
      <div className="container">
        <header className={styles.head}>
          <h1 className={styles.title}>{title}</h1>
          <p className="section-lead">{lead}</p>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar} aria-label="Filtros">
            <div className={styles.search}>
              <Icon icon={Search} size={16} />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por nome ou aroma"
                aria-label="Buscar velas"
              />
              {busca && (
                <button type="button" onClick={() => setBusca("")} aria-label="Limpar busca">
                  <Icon icon={X} size={15} />
                </button>
              )}
            </div>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <Icon icon={Tag} size={15} />
                Ofertas
              </legend>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={onlySale}
                  onChange={(event) => update("promocao", event.target.checked ? "1" : null)}
                />
                <span className={styles.optionName}>Em promoção</span>
                <span className={styles.optionCount}>{semPromocao.emPromocao}</span>
              </label>
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <Icon icon={Wallet} size={15} />
                Preço
              </legend>
              <div className={styles.range}>
                <p className={styles.rangeValues}>
                  {formatPrice(piso)} <span>até</span> {formatPrice(teto)}
                </p>
                <div
                  className={styles.rangeTrack}
                  onPointerDown={(event) => {
                    // Clicar na trilha leva o pegador mais próximo até ali.
                    const caixa = event.currentTarget.getBoundingClientRect();
                    const posicao = (event.clientX - caixa.left) / caixa.width;
                    const bruto = pisoCatalogo + posicao * (tetoCatalogo - pisoCatalogo);
                    const valor = Math.min(tetoCatalogo, Math.max(pisoCatalogo, Math.round(bruto / 10) * 10));
                    if (Math.abs(valor - piso) <= Math.abs(valor - teto)) setFaixa([Math.min(valor, teto), teto]);
                    else setFaixa([piso, Math.max(valor, piso)]);
                  }}
                >
                  <span
                    className={styles.rangeFill}
                    style={
                      {
                        "--inicio": fracao(piso, pisoCatalogo, tetoCatalogo),
                        "--fim": fracao(teto, pisoCatalogo, tetoCatalogo),
                      } as CSSProperties
                    }
                  />
                  <input
                    type="range"
                    min={pisoCatalogo}
                    max={tetoCatalogo}
                    step={10}
                    value={piso}
                    onChange={(event) => setFaixa([Math.min(Number(event.target.value), teto), teto])}
                    aria-label="Preço mínimo"
                  />
                  <input
                    type="range"
                    min={pisoCatalogo}
                    max={tetoCatalogo}
                    step={10}
                    value={teto}
                    onChange={(event) => setFaixa([piso, Math.max(Number(event.target.value), piso)])}
                    aria-label="Preço máximo"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <Icon icon={Layers} size={15} />
                Coleção
              </legend>
              <ul className={styles.options}>
                <FilterOption active={collection === null} count={porColecao.total} onClick={() => update("colecao", null)}>
                  Todas
                </FilterOption>
                {collectionKeys.map((key) => (
                  <FilterOption
                    key={key}
                    active={collection === key}
                    count={porColecao.por[key]}
                    onClick={() => update("colecao", key)}
                  >
                    {collections[key].name}
                  </FilterOption>
                ))}
              </ul>
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                <Icon icon={Flower2} size={15} />
                Família olfativa
              </legend>
              <ul className={styles.options}>
                <FilterOption active={family === null} count={porFamilia.total} onClick={() => update("familia", null)}>
                  Todas
                </FilterOption>
                {familyKeys.map((key) => (
                  <FilterOption
                    key={key}
                    active={family === key}
                    count={porFamilia.por[key]}
                    onClick={() => update("familia", key)}
                  >
                    {families[key]}
                  </FilterOption>
                ))}
              </ul>
            </fieldset>

            {(collection || family || busca || onlySale || !faixaCheia) && (
              <Link href="/colecao" className={`link-underline ${styles.clear}`}>
                Limpar filtros
              </Link>
            )}
          </aside>

          <div className={styles.results} id="resultados">
            <div className={styles.countRow}>
              <p className={styles.count} aria-live="polite">
                {list.length === 0
                  ? "Nenhuma vela com essa combinação."
                  : paginas > 1
                    ? `${list.length} velas, página ${paginaAtual} de ${paginas}`
                    : `${list.length} ${list.length === 1 ? "vela" : "velas"}`}
              </p>

              <div className={styles.viewToggle} role="group" aria-label="Visualização da lista">
                <button
                  type="button"
                  onClick={() => setVisao("grade")}
                  aria-pressed={visao === "grade"}
                  aria-label="Ver em grade"
                  title="Ver em grade"
                >
                  <Icon icon={LayoutGrid} size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setVisao("linha")}
                  aria-pressed={visao === "linha"}
                  aria-label="Ver em lista"
                  title="Ver em lista"
                >
                  <Icon icon={Rows3} size={16} />
                </button>
              </div>
            </div>

            {list.length === 0 ? (
              <div className={styles.emptyState}>
                <Icon icon={SearchX} size={32} />
                <p>
                  {busca
                    ? `Nenhuma vela encontrada para "${busca}".`
                    : "Ainda não fizemos uma vela assim. Experimente soltar um dos filtros."}
                </p>
                <Link href="/colecao" className="link-underline">
                  Limpar filtros
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.grid} data-view={visao}>
                  {visiveis.map((product) => (
                    <ProductCard key={product.slug} product={product} layout={visao} />
                  ))}
                </div>

                {paginas > 1 && (
                  <nav className={styles.paginacao} aria-label="Páginas da coleção">
                    <button
                      type="button"
                      onClick={() => irPara(paginaAtual - 1)}
                      disabled={paginaAtual === 1}
                      aria-label="Página anterior"
                    >
                      <Icon icon={ChevronLeft} size={16} />
                    </button>

                    {Array.from({ length: paginas }, (_, i) => i + 1).map((numero) => (
                      <button
                        key={numero}
                        type="button"
                        onClick={() => irPara(numero)}
                        aria-current={numero === paginaAtual ? "page" : undefined}
                        aria-label={`Página ${numero}`}
                      >
                        {numero}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => irPara(paginaAtual + 1)}
                      disabled={paginaAtual === paginas}
                      aria-label="Próxima página"
                    >
                      <Icon icon={ChevronRight} size={16} />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterOption({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        className={styles.option}
        aria-pressed={active}
        onClick={onClick}
        disabled={count === 0 && !active}
      >
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.optionName}>{children}</span>
        <span className={styles.optionCount}>{count}</span>
      </button>
    </li>
  );
}

/** Sem acento e em minúsculas, para "citrico" achar "cítrico". */
function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** A busca cobre nome, chamada, descrição, notas e os rótulos de coleção e família. */
function combina(product: Product, termo: string): boolean {
  const campos = [
    product.name,
    product.tagline,
    product.description,
    product.notes.top,
    product.notes.heart,
    product.notes.base,
    collections[product.collection].name,
    families[product.family],
  ];

  return campos.some((campo) => normalizar(campo).includes(termo));
}

/** Lê um número da URL, ignorando o que estiver fora dos limites do catálogo. */
function numeroNaFaixa(valor: string | null, piso: number, teto: number): number | null {
  if (valor === null) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= piso && numero <= teto ? numero : null;
}

/** Onde o valor cai na faixa, de 0 a 1. O CSS usa isso para acompanhar o centro das bolinhas. */
function fracao(valor: number, piso: number, teto: number): number {
  return teto === piso ? 0 : (valor - piso) / (teto - piso);
}
