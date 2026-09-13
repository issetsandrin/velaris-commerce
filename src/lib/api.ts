import type { Collection, Family, Product, Size, SizeKey } from "./products";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8100").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const AUTH_TOKEN_KEY = "velaris.auth.token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    else window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // armazenamento indisponível
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("X-Cart-Token", token);
  const authToken = getAuthToken();
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, `Não foi possível conectar à API em ${API_URL}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let message = `Erro ${response.status} na API.`;
    let errors: Record<string, string[]> | undefined;
    try {
      const body = await response.json();
      if (typeof body.message === "string" && body.message) message = body.message;
      errors = body.errors;
    } catch {
      // corpo sem JSON
    }
    throw new ApiError(response.status, message, errors);
  }

  return (await response.json()) as T;
}

// Catálogo

export function getProducts(): Promise<Product[]> {
  return request<Product[]>("/produtos", { cache: "no-store" });
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await request<Product>(`/produtos/${encodeURIComponent(slug)}`, { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// Configuração da loja

export interface PaymentMethodConfig {
  code: string;
  name: string;
  type: "pix" | "cartao" | "boleto" | "outro";
  description: string | null;
  discountPercent: number;
  maxInstallments: number;
  minInstallmentValue: number | null;
}

export interface ShippingMethodConfig {
  code: string;
  name: string;
  deliveryTime: string | null;
  price: number;
  /** A partir de quanto esta entrega sai de graça, ou null quando ela nunca sai. */
  freeFrom: number | null;
}

export interface StoreConfig {
  /** Limite padrão da loja, usado nos textos de vitrine e pelas entregas sem limite próprio. */
  shipping: { freeFrom: number };
  shippingMethods: ShippingMethodConfig[];
  maxQuantityPerItem: number;
  lowStockThreshold: number;
  paymentMethods: PaymentMethodConfig[];
}

/** Valores usados só até a configuração da loja chegar da API. */
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  shipping: { freeFrom: 180 },
  shippingMethods: [],
  maxQuantityPerItem: 10,
  lowStockThreshold: 5,
  paymentMethods: [],
};

export function getStoreConfig(): Promise<StoreConfig> {
  return request<StoreConfig>("/config", { cache: "no-store" });
}

// Carrinho

export interface CartItem {
  id: number;
  quantity: number;
  size: Size;
  product: {
    slug: string;
    name: string;
    collection: Collection;
    family: Family;
    wax: string;
  };
}

export interface Cart {
  token: string;
  items: CartItem[];
  count: number;
  subtotal: number;
}

export function fetchCart(token: string | null): Promise<Cart> {
  return request<Cart>("/carrinho", { cache: "no-store" }, token);
}

export function addCartItem(token: string | null, slug: string, size: SizeKey, quantity: number): Promise<Cart> {
  return request<Cart>("/carrinho/itens", { method: "POST", body: JSON.stringify({ slug, size, quantity }) }, token);
}

export function updateCartItem(token: string, itemId: number, quantity: number): Promise<Cart> {
  return request<Cart>(`/carrinho/itens/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) }, token);
}

export function removeCartItem(token: string, itemId: number): Promise<Cart> {
  return request<Cart>(`/carrinho/itens/${itemId}`, { method: "DELETE" }, token);
}

// Avisos

export interface Notice {
  key: string;
  type: "promocao" | "entrega" | "pagamento" | "pedido" | "aviso";
  title: string;
  text: string;
  at: string;
  link: string | null;
  read: boolean;
}

/** Aberto: sem token vêm só os avisos da loja; com token entram os dos pedidos. */
export function getNotices(): Promise<Notice[]> {
  return request<Notice[]>("/avisos", { cache: "no-store" });
}

/** Marca como lidos; sem lista, marca todos os que a pessoa está vendo. */
export function readNotices(chaves?: string[]): Promise<Notice[]> {
  return request<Notice[]>("/avisos/lidos", { method: "POST", body: JSON.stringify({ chaves }) });
}

// Pedidos

export type OrderPayload = {
  pagamento: string;
  parcelas?: number;
  cupom?: string;
  entrega?: string;
} & ({ contato_id: number } | ContactPayload) &
  ({ endereco_id: number } | AddressPayload);

export interface CheckoutTotals {
  subtotal: number;
  paymentDiscount: number;
  couponDiscount: number;
  shipping: number;
  total: number;
  paymentMethod: { code: string; name: string };
  shippingMethod: { code: string; name: string } | null;
  installments: { count: number; value: number; max: number };
  coupon: { code: string; type: "percent" | "fixed" | "free_shipping"; description: string | null } | null;
}

/** Prévia dos totais do carrinho do cliente, validando forma de pagamento, parcelas e cupom no servidor. */
export function previewTotals(payload: { pagamento: string; parcelas?: number; cupom?: string; entrega?: string }): Promise<CheckoutTotals> {
  return request<CheckoutTotals>("/checkout/totais", { method: "POST", body: JSON.stringify(payload) });
}

export interface OrderItem {
  productSlug: string;
  productName: string;
  sizeLabel: string;
  sizeWeight: string;
  unitPrice: number;
  listPrice: number;
  quantity: number;
}

export interface OrderAddress {
  postalCode: string;
  city: string;
  neighborhood: string | null;
  street: string;
  streetNumber: string;
  complement: string | null;
}

export interface Order {
  number: string;
  customerName: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  cpf: string | null;
  address: OrderAddress;
  items: OrderItem[];
  paymentMethod: string;
  paymentMethodName: string;
  shippingMethodName: string | null;
  installments: number;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  couponDiscount: number;
  shipping: number;
  total: number;
  status: string;
  createdAt: string;
}

export function createOrder(payload: OrderPayload): Promise<Order> {
  return request<Order>("/pedidos", { method: "POST", body: JSON.stringify(payload) });
}

export function getOrder(number: string): Promise<Order> {
  return request<Order>(`/pedidos/${number}`, { cache: "no-store" });
}

// Pagamento

export interface Payment {
  method: "pix" | "cartao";
  status: "pendente" | "pago" | "recusado" | "expirado";
  amount: number;
  installments: number;
  pixPayload: string | null;
  /** SVG do QR já pronto para o <img>, em data URI. */
  pixQrCode: string | null;
  pixExpiresAt: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  failureReason: string | null;
  paidAt: string | null;
}

export interface CardPayload {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  parcelas: number;
}

export function getPayment(number: string): Promise<Payment> {
  return request<Payment>(`/pedidos/${number}/pagamento`, { cache: "no-store" });
}

export function createPixCharge(number: string): Promise<Payment> {
  return request<Payment>(`/pedidos/${number}/pagamento/pix`, { method: "POST" });
}

export function confirmPix(number: string): Promise<Payment> {
  return request<Payment>(`/pedidos/${number}/pagamento/pix/confirmar`, { method: "POST" });
}

export function payWithCard(number: string, payload: CardPayload): Promise<Payment> {
  return request<Payment>(`/pedidos/${number}/pagamento/cartao`, { method: "POST", body: JSON.stringify(payload) });
}

// Conta

export interface Address {
  id: number;
  label: string | null;
  postalCode: string;
  city: string;
  neighborhood: string | null;
  street: string;
  streetNumber: string;
  complement: string | null;
  isDefault: boolean;
}

export interface Contact {
  id: number;
  name: string;
  phone: string;
  whatsapp: string | null;
  cpf: string | null;
  isDefault: boolean;
  complete: boolean;
}

export interface ContactPayload {
  nome: string;
  telefone: string;
  whatsapp?: string;
  cpf: string;
  padrao?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  addresses: Address[];
  contacts: Contact[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  senha_confirmation: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface AddressPayload {
  apelido?: string;
  cep: string;
  cidade: string;
  bairro: string;
  endereco: string;
  numero: string;
  complemento?: string;
  padrao?: boolean;
}

export function register(payload: RegisterPayload, cartToken: string | null): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/registrar", { method: "POST", body: JSON.stringify(payload) }, cartToken);
}

export function login(payload: LoginPayload, cartToken: string | null): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/entrar", { method: "POST", body: JSON.stringify(payload) }, cartToken);
}

export function loginWithGoogle(credential: string, cartToken: string | null): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }, cartToken);
}

export function logout(): Promise<void> {
  return request<void>("/auth/sair", { method: "POST" });
}

export function me(): Promise<User> {
  return request<User>("/auth/eu", { cache: "no-store" });
}

export function createAddress(payload: AddressPayload): Promise<Address> {
  return request<Address>("/conta/enderecos", { method: "POST", body: JSON.stringify(payload) });
}

export function updateAddress(id: number, payload: AddressPayload): Promise<Address> {
  return request<Address>(`/conta/enderecos/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function createContact(payload: ContactPayload): Promise<Contact> {
  return request<Contact>("/conta/contatos", { method: "POST", body: JSON.stringify(payload) });
}

export function updateContact(id: number, payload: ContactPayload): Promise<Contact> {
  return request<Contact>(`/conta/contatos/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteContact(id: number): Promise<void> {
  return request<void>(`/conta/contatos/${id}`, { method: "DELETE" });
}

export function deleteAddress(id: number): Promise<void> {
  return request<void>(`/conta/enderecos/${id}`, { method: "DELETE" });
}

export function myOrders(): Promise<Order[]> {
  return request<Order[]>("/conta/pedidos", { cache: "no-store" });
}
