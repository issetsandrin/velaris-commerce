"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { useCart } from "@/components/cart/CartContext";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/Spinner";
import { Select } from "@/components/form/Select";
import { AddressCard } from "@/components/address/AddressCard";
import { AddressFields, readAddressForm } from "@/components/address/AddressFields";
import { ContactCard } from "@/components/contact/ContactCard";
import { ContactFields, readContactForm } from "@/components/contact/ContactFields";
import { Banknote, CreditCard, Info, MapPin, Plus, QrCode, Save, Tag, Truck, UserRound, Wallet, X } from "lucide-react";
import { CandleArt } from "@/components/CandleArt";
import { formatPrice } from "@/lib/format";
import { ApiError, createAddress, createContact, createOrder, me, previewTotals, type CheckoutTotals, type OrderPayload, type ShippingMethodConfig } from "@/lib/api";
import { useStoreConfig } from "@/components/config/StoreConfigContext";
import styles from "./Checkout.module.css";

/** Mesmo cálculo do `ShippingMethod::fretePara` da API, para a tela não piscar esperando o servidor. */
function freteDe(method: ShippingMethodConfig | null, subtotal: number): number {
  if (!method || subtotal <= 0 || method.price <= 0) return 0;
  if (method.freeFrom !== null && subtotal >= method.freeFrom) return 0;
  return method.price;
}

export function Checkout() {
  const router = useRouter();
  const { user, status: authStatus, setUser } = useAuth();
  const { items, subtotal, status, clearLocal } = useCart();
  const { config } = useStoreConfig();
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<string>("");
  const [shippingChoice, setShipping] = useState<string>("");
  const [installments, setInstallments] = useState(1);

  const methods = config.paymentMethods;
  const currentPayment = methods.find((method) => method.code === payment) ?? methods[0] ?? null;
  const paymentCode = currentPayment?.code ?? "";
  const shippingMethods = config.shippingMethods;
  const currentShipping = shippingMethods.find((method) => method.code === shippingChoice) ?? shippingMethods[0] ?? null;
  const shippingCode = currentShipping?.code ?? "";
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [serverTotals, setServerTotals] = useState<CheckoutTotals | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [addingContact, setAddingContact] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  /** Grava o endereço digitado na conta e o deixa selecionado, sem fechar o pedido. */
  async function saveNewAddress() {
    if (!formRef.current) return;
    const form = new FormData(formRef.current);
    setSavingAddress(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const created = await createAddress(readAddressForm(form));
      setUser(await me());
      setSelectedAddressId(created.id);
      setAddingAddress(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.errors ?? {});
        setFormError(error.errors ? "Confira os campos do endereço." : error.message);
      }
    } finally {
      setSavingAddress(false);
    }
  }

  /** Grava o contato digitado na conta e o deixa selecionado. */
  async function saveNewContact() {
    if (!formRef.current) return;
    const form = new FormData(formRef.current);
    setSavingContact(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const created = await createContact(readContactForm(form));
      setUser(await me());
      setSelectedContactId(created.id);
      setAddingContact(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.errors ?? {});
        setFormError(error.errors ? "Confira os campos do contato." : error.message);
      }
    } finally {
      setSavingContact(false);
    }
  }

  const addresses = user?.addresses ?? [];
  const hasAddresses = addresses.length > 0;
  const useNewAddress = !hasAddresses || addingAddress;

  const contacts = user?.contacts ?? [];
  const hasContacts = contacts.length > 0;
  const useNewContact = !hasContacts || addingContact;
  const currentContactId =
    selectedContactId ?? (contacts.find((contact) => contact.isDefault) ?? contacts[0])?.id ?? null;
  // Sem escolha explícita, vale o endereço padrão (ou o primeiro).
  const currentAddressId =
    selectedAddressId ?? (addresses.find((address) => address.isDefault) ?? addresses[0])?.id ?? null;

  // Cálculo local com as regras do painel; quando há cupom, os valores vêm do servidor.
  const localShipping = freteDe(currentShipping, subtotal);
  const localDiscount = currentPayment ? Math.round(subtotal * currentPayment.discountPercent) / 100 : 0;
  const activeTotals = coupon ? serverTotals : null;
  const couponDiscount = activeTotals?.couponDiscount ?? 0;
  const shipping = activeTotals?.shipping ?? localShipping;
  const discount = activeTotals?.paymentDiscount ?? localDiscount;
  const total = activeTotals?.total ?? subtotal - discount + shipping;

  // Parcelas possíveis para a forma atual, respeitando o valor mínimo da parcela.
  const maxInstallments = currentPayment
    ? Math.max(1, Math.min(currentPayment.maxInstallments, currentPayment.minInstallmentValue ? Math.floor(total / currentPayment.minInstallmentValue) : currentPayment.maxInstallments))
    : 1;
  const currentInstallments = Math.min(installments, maxInstallments);
  const installmentValue = currentInstallments > 1 ? total / currentInstallments : total;

  // Recalcula no servidor quando o pagamento ou o carrinho mudam com cupom aplicado.
  useEffect(() => {
    if (!user || !coupon || items.length === 0 || !paymentCode) return;
    let cancelled = false;
    previewTotals({ pagamento: paymentCode, cupom: coupon, parcelas: currentInstallments, entrega: shippingCode || undefined })
      .then((totals) => {
        if (!cancelled) setServerTotals(totals);
      })
      .catch((error) => {
        if (cancelled) return;
        setCoupon(null);
        setServerTotals(null);
        setCouponError(error instanceof ApiError ? (error.errors?.cupom?.[0] ?? error.message) : "Cupom não pôde ser aplicado.");
      });
    return () => {
      cancelled = true;
    };
  }, [user, coupon, paymentCode, shippingCode, currentInstallments, items, subtotal]);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code || !paymentCode) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const totals = await previewTotals({ pagamento: paymentCode, cupom: code, parcelas: currentInstallments, entrega: shippingCode || undefined });
      setServerTotals(totals);
      setCoupon(code);
      setCouponInput("");
    } catch (error) {
      setCouponError(error instanceof ApiError ? (error.errors?.cupom?.[0] ?? error.message) : "Cupom não pôde ser aplicado.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setServerTotals(null);
    setCouponError(null);
  }

  useEffect(() => {
    if (authStatus === "ready" && !user) router.replace("/entrar?next=%2Fcheckout");
  }, [authStatus, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    if (!useNewAddress && currentAddressId === null) {
      setFormError("Escolha um endereço de entrega.");
      return;
    }
    if (!useNewContact && currentContactId === null) {
      setFormError("Escolha um contato.");
      return;
    }
    if (!paymentCode) {
      setFormError("Escolha uma forma de pagamento.");
      return;
    }
    const base = {
      pagamento: paymentCode,
      parcelas: currentInstallments,
      cupom: coupon ?? undefined,
      entrega: shippingCode || undefined,
    };
    const contato = useNewContact ? readContactForm(form) : { contato_id: currentContactId as number };
    const endereco = useNewAddress ? readAddressForm(form) : { endereco_id: currentAddressId as number };
    const payload: OrderPayload = { ...base, ...contato, ...endereco } as OrderPayload;

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const created = await createOrder(payload);
      clearLocal();
      try {
        setUser(await me());
      } catch {
        // mantém os dados atuais do cliente
      }
      // O pedido nasce aguardando pagamento: quem fecha a conta é a tela seguinte.
      router.push(`/pedido/${created.number}/pagamento`);
    } catch (error) {
      if (error instanceof ApiError) {
        const hasFieldErrors = Boolean(error.errors && Object.keys(error.errors).length);
        setFormError(hasFieldErrors ? "Confira os campos destacados antes de confirmar." : error.message);
        setFieldErrors(error.errors ?? {});
      } else {
        setFormError("Não foi possível confirmar o pedido.");
      }
    } finally {
      setSubmitting(false);
    }
  }


  if (authStatus === "loading" || !user || status === "loading") {
    return (
      <section className={`container ${styles.done}`}>
        <p className={styles.doneText}>Carregando…</p>
      </section>
    );
  }


  if (items.length === 0) {
    return (
      <section className={`container ${styles.done}`}>
        <h1 className={styles.doneTitle}>Seu carrinho está vazio.</h1>
        <p className={styles.doneText}>Escolha uma vela para continuar.</p>
        <Link href="/colecao" className="btn btn-primary">
          Ver a coleção
        </Link>
      </section>
    );
  }

  return (
    <section className={`container ${styles.page}`}>
      <h1 className={styles.title}>Finalizar compra</h1>

      <div className={styles.layout}>
        <form id="checkout-form" className={styles.form} onSubmit={handleSubmit} noValidate key={user.id} ref={formRef}>
          <fieldset className={styles.block}>
            <legend className={`title-icon ${styles.blockTitle}`}>
              <Icon icon={CreditCard} size={22} />
              Pagamento
            </legend>
            <p className={styles.hint}>
              <Icon icon={Info} size={15} />
              Ambiente de demonstração. O pedido é gravado, mas nenhuma cobrança é feita e nenhum
              dado de cartão é solicitado.
            </p>
            {methods.length === 0 ? (
              <p className={styles.formError} role="alert">
                Nenhuma forma de pagamento disponível no momento.
              </p>
            ) : (
              <div className={`${styles.payments} ${styles.paymentGrid}`} role="radiogroup" aria-label="Forma de pagamento">
                {methods.map((method) => {
                  const active = method.code === paymentCode;
                  const Glyph = method.type === "pix" ? QrCode : method.type === "cartao" ? CreditCard : method.type === "boleto" ? Banknote : Wallet;
                  const condition =
                    method.discountPercent > 0
                      ? `${method.discountPercent.toLocaleString("pt-BR")}% de desconto`
                      : method.maxInstallments > 1
                        ? `em até ${method.maxInstallments}x sem juros`
                        : "à vista";
                  return (
                    <label key={method.code} className={styles.payment} data-active={active || undefined}>
                      <input
                        type="radio"
                        name="pagamento"
                        value={method.code}
                        checked={active}
                        onChange={() => {
                          setPayment(method.code);
                          setInstallments(1);
                        }}
                        className="visually-hidden"
                      />
                      <Icon icon={Glyph} size={20} />
                      <span className={styles.paymentBody}>
                        <span className={styles.paymentName}>{method.name}</span>
                        <span className={styles.paymentMeta}>
                          {condition}
                          {method.description ? `, ${method.description.toLowerCase()}` : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {currentPayment && maxInstallments > 1 && (
              <div className={styles.installments}>
                <span>Parcelas</span>
                <Select
                  value={String(currentInstallments)}
                  onChange={(valor) => setInstallments(Number(valor))}
                  label="Parcelas"
                  icon={Wallet}
                  options={Array.from({ length: maxInstallments }, (_, index) => index + 1).map((count) => ({
                    value: String(count),
                    label: count === 1 ? "À vista" : `${count}x sem juros`,
                    hint: count === 1 ? formatPrice(total) : `${formatPrice(total / count)} cada`,
                  }))}
                />
              </div>
            )}
          </fieldset>

          <fieldset className={styles.block}>
            <legend className={`title-icon ${styles.blockTitle}`}>
              <Icon icon={UserRound} size={22} />
              Contato
            </legend>

            {hasContacts && (
              <>
                <p className={styles.hint}>Quem recebe e responde pelo pedido. Escolha um contato salvo ou cadastre outro.</p>
                <div className={styles.addressList} role="radiogroup" aria-label="Contatos salvos">
                  {contacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      inline={contacts.length === 1}
                      selectable
                      selected={!addingContact && currentContactId === contact.id}
                      onSelect={() => {
                        setSelectedContactId(contact.id);
                        setAddingContact(false);
                      }}
                    />
                  ))}
                </div>
                {!addingContact && (
                  <button type="button" className={`btn btn-ghost ${styles.addAddress}`} onClick={() => setAddingContact(true)}>
                    <Icon icon={Plus} size={18} />
                    Cadastrar novo contato
                  </button>
                )}
              </>
            )}

            {useNewContact && (
              <div className={styles.newAddress}>
                {hasContacts ? (
                  <div className={styles.newAddressHead}>
                    <span>Novo contato</span>
                    <button type="button" className="link-underline" onClick={() => setAddingContact(false)}>
                      Usar um contato salvo
                    </button>
                  </div>
                ) : (
                  <p className={styles.hint}>Pedimos só uma vez. Nas próximas compras é só escolher.</p>
                )}
                <ContactFields errors={fieldErrors} defaults={{ nome: hasContacts ? "" : user.name }} />
                <div className={styles.saveRow}>
                  <button type="button" className="btn btn-ghost" onClick={() => void saveNewContact()} disabled={savingContact}>
                    {savingContact ? <Spinner size={17} /> : <Icon icon={Save} size={17} />}
                    {savingContact ? "Salvando…" : "Salvar contato"}
                  </button>
                  <span className={styles.saveHint}>Ou siga direto: o contato é salvo junto com o pedido.</span>
                </div>
              </div>
            )}
            {fieldErrors.contato_id && (
              <p className={styles.formError} role="alert">
                {fieldErrors.contato_id[0]}
              </p>
            )}
          </fieldset>

          <fieldset className={styles.block}>
            <legend className={`title-icon ${styles.blockTitle}`}>
              <Icon icon={MapPin} size={22} />
              Entrega
            </legend>

            {hasAddresses && (
              <>
                <p className={styles.hint}>Escolha um endereço salvo ou cadastre um novo.</p>
                <div className={styles.addressList} role="radiogroup" aria-label="Endereços salvos">
                  {addresses.map((address, index) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      index={index}
                      inline={addresses.length === 1}
                      selectable
                      selected={!addingAddress && currentAddressId === address.id}
                      onSelect={() => {
                        setSelectedAddressId(address.id);
                        setAddingAddress(false);
                      }}
                    />
                  ))}
                </div>
                {!addingAddress && (
                  <button type="button" className={`btn btn-ghost ${styles.addAddress}`} onClick={() => setAddingAddress(true)}>
                    <Icon icon={Plus} size={18} />
                    Cadastrar novo endereço
                  </button>
                )}
              </>
            )}

            {useNewAddress && (
              <div className={styles.newAddress}>
                {hasAddresses && (
                  <div className={styles.newAddressHead}>
                    <span>Novo endereço</span>
                    <button type="button" className="link-underline" onClick={() => setAddingAddress(false)}>
                      Usar um endereço salvo
                    </button>
                  </div>
                )}
                {!hasAddresses && <p className={styles.hint}>Este endereço fica salvo na sua conta para as próximas compras.</p>}
                <AddressFields errors={fieldErrors} />
                <div className={styles.saveRow}>
                  <button type="button" className="btn btn-ghost" onClick={() => void saveNewAddress()} disabled={savingAddress}>
                    {savingAddress ? <Spinner size={17} /> : <Icon icon={Save} size={17} />}
                    {savingAddress ? "Salvando…" : "Salvar endereço"}
                  </button>
                  <span className={styles.saveHint}>Ou siga direto: o endereço é salvo junto com o pedido.</span>
                </div>
              </div>
            )}
            {fieldErrors.endereco_id && (
              <p className={styles.formError} role="alert">
                {fieldErrors.endereco_id[0]}
              </p>
            )}

            {shippingMethods.length > 0 && (
              <div className={styles.shippingChoice}>
                <span className={styles.shippingLabel}>Forma de entrega</span>
                <div className={styles.payments} role="radiogroup" aria-label="Forma de entrega">
                  {shippingMethods.map((method) => {
                    const active = method.code === shippingCode;
                    const valor = freteDe(method, subtotal);
                    return (
                      <label key={method.code} className={styles.payment} data-active={active || undefined}>
                        <input
                          type="radio"
                          name="entrega"
                          value={method.code}
                          checked={active}
                          onChange={() => setShipping(method.code)}
                          className="visually-hidden"
                        />
                        <Icon icon={Truck} size={20} />
                        <span className={styles.paymentBody}>
                          <span className={styles.paymentName}>{method.name}</span>
                          {method.deliveryTime && <span className={styles.paymentMeta}>{method.deliveryTime}</span>}
                        </span>
                        <span className={`price ${styles.shippingPrice}`}>
                          {valor === 0 ? "Grátis" : formatPrice(valor)}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {fieldErrors.entrega && (
                  <p className={styles.formError} role="alert">
                    {fieldErrors.entrega[0]}
                  </p>
                )}
              </div>
            )}
          </fieldset>
        </form>

        <aside className={styles.summary} aria-labelledby="resumo">
          <h2 id="resumo" className={styles.summaryTitle}>
            Resumo
          </h2>
          <ul className={styles.lines}>
            {items.map((item) => (
              <li key={item.id} className={styles.line}>
                <span className={styles.lineArt}>
                  <CandleArt wax={item.product.wax} collection={item.product.collection} />
                </span>
                <span className={styles.lineBody}>
                  <span className={styles.lineName}>{item.product.name}</span>
                  <span className={styles.lineMeta}>
                    {item.size.label}, {item.size.weight}, {item.quantity} un.
                  </span>
                </span>
                <span className="price">{formatPrice(item.size.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.coupon}>
            {coupon ? (
              <div className={styles.couponApplied}>
                <span>
                  <Icon icon={Tag} size={15} />
                  Cupom <strong>{coupon}</strong>
                  {activeTotals?.coupon?.type === "free_shipping" ? " (frete grátis)" : ""}
                </span>
                <button type="button" onClick={removeCoupon} aria-label="Remover cupom">
                  <Icon icon={X} size={15} />
                </button>
              </div>
            ) : (
              <div className={styles.couponForm}>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void applyCoupon();
                    }
                  }}
                  placeholder="Cupom de desconto"
                  aria-label="Cupom de desconto"
                  autoComplete="off"
                />
                <button type="button" className="btn btn-ghost" onClick={() => void applyCoupon()} disabled={applyingCoupon || !couponInput.trim()}>
                  {applyingCoupon && <Spinner size={15} />}
                  {applyingCoupon ? "Aplicando…" : "Aplicar"}
                </button>
              </div>
            )}
            {couponError && (
              <p className={styles.couponError} role="alert">
                {couponError}
              </p>
            )}
          </div>

          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd className="price">{formatPrice(subtotal)}</dd>
            </div>
            {couponDiscount > 0 && (
              <div>
                <dt>Cupom {coupon}</dt>
                <dd className="price">− {formatPrice(couponDiscount)}</dd>
              </div>
            )}
            {discount > 0 && currentPayment && (
              <div>
                <dt>Desconto {currentPayment.name}</dt>
                <dd className="price">− {formatPrice(discount)}</dd>
              </div>
            )}
            <div>
              <dt>Frete</dt>
              <dd className="price">{shipping === 0 ? "Grátis" : formatPrice(shipping)}</dd>
            </div>
            <div className={styles.total}>
              <dt>Total</dt>
              <dd className="price">{formatPrice(total)}</dd>
            </div>
            {currentInstallments > 1 && (
              <div>
                <dt>Parcelado</dt>
                <dd>
                  {currentInstallments}x de {formatPrice(installmentValue)}
                </dd>
              </div>
            )}
          </dl>

          {formError && (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          )}

          <button type="submit" form="checkout-form" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
            {submitting && <Spinner size={17} />}
            {submitting ? "Confirmando…" : `Confirmar pedido de ${formatPrice(total)}`}
          </button>
        </aside>
      </div>
    </section>
  );
}
