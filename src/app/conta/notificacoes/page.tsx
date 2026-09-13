import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { Notices } from "@/components/notices/Notices";

export const metadata: Metadata = { title: "Notificações" };

export default function NoticesPage() {
  return (
    <AccountShell title="Notificações">
      <Notices />
    </AccountShell>
  );
}
