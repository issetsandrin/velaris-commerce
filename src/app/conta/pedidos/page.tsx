import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { Orders } from "@/components/account/Orders";

export const metadata: Metadata = { title: "Meus pedidos" };

export default function OrdersPage() {
  return (
    <AccountShell title="Meus pedidos">
      <Orders />
    </AccountShell>
  );
}
