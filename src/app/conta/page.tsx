import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { Profile } from "@/components/account/Profile";

export const metadata: Metadata = { title: "Perfil" };

export default function ProfilePage() {
  return (
    <AccountShell title="Perfil">
      <Profile />
    </AccountShell>
  );
}
