import type { Metadata } from "next";
import { Payment } from "./Payment";

export const metadata: Metadata = { title: "Pagamento" };

export default async function PaymentPage({ params }: PageProps<"/pedido/[numero]/pagamento">) {
  const { numero } = await params;

  return <Payment number={numero} />;
}
