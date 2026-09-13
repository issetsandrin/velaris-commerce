import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { OrderDetail } from "@/components/account/OrderDetail";

export async function generateMetadata({ params }: PageProps<"/conta/pedidos/[numero]">): Promise<Metadata> {
  const { numero } = await params;

  return { title: `Pedido ${numero}` };
}

export default async function OrderPage({ params }: PageProps<"/conta/pedidos/[numero]">) {
  const { numero } = await params;

  return (
    <AccountShell title={`Pedido ${numero}`}>
      <OrderDetail number={numero} />
    </AccountShell>
  );
}
