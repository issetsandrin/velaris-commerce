import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthContext";
import { StoreConfigProvider } from "@/components/config/StoreConfigContext";
import { getStoreConfig, type StoreConfig } from "@/lib/api";
import { CartProvider } from "@/components/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { NoticesProvider } from "@/components/notices/NoticesContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/motion/PageTransition";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Velaris, velas artesanais de cera de coco",
    template: "%s | Velaris",
  },
  description:
    "Velas de cera de coco feitas à mão em pequenos lotes. Fragrâncias sem ftalatos, pavio de algodão, potes reaproveitáveis.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  let config: StoreConfig | null = null;
  try {
    config = await getStoreConfig();
  } catch {
    // API fora: a loja usa os padrões e tenta de novo no cliente
  }

  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body>
        <noscript>
          <p className="noscript">
            Esta loja precisa de JavaScript para o carrinho, os filtros e o checkout. Ative o
            JavaScript para localhost ou desative extensões que o bloqueiem e recarregue a página.
          </p>
        </noscript>
        <StoreConfigProvider initial={config}>
          <AuthProvider>
            <CartProvider>
              <NoticesProvider>
                <Header />
                <PageTransition>{children}</PageTransition>
                <Footer />
                <CartDrawer />
                <ScrollReveal />
              </NoticesProvider>
            </CartProvider>
          </AuthProvider>
        </StoreConfigProvider>
      </body>
    </html>
  );
}
