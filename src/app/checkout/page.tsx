import type { Metadata } from "next";
import { Checkout } from "./Checkout";

export const metadata: Metadata = {
  title: "Finalizar compra",
};

export default function CheckoutPage() {
  return <Checkout />;
}
