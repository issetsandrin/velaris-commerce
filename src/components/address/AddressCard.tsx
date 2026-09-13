import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import type { Address } from "@/lib/api";
import { Icon } from "../Icon";
import styles from "./AddressCard.module.css";

export function formatPostalCode(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : value;
}

interface AddressCardProps {
  address: Address;
  index: number;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  actions?: ReactNode;
  /** Card sozinho na lista, ocupando a linha inteira: as informações ficam lado a lado. */
  inline?: boolean;
  /** Card de gerenciamento em Minha conta: ações ancoradas no rodapé. */
  account?: boolean;
}

export function AddressCard({ address, index, selectable, selected, onSelect, actions, inline, account }: AddressCardProps) {
  const title = address.label?.trim() || `Endereço ${index + 1}`;
  const body = (
    <>
      <div className={styles.head}>
        <span className={styles.title}>
          <Icon icon={MapPin} size={17} />
          {title}
        </span>
        {address.isDefault && <span className={styles.badge}>Padrão</span>}
      </div>
      <p className={styles.line}>
        {address.street}, {address.streetNumber}
        {address.complement ? `, ${address.complement}` : ""}
      </p>
      <p className={styles.meta}>
        {address.neighborhood ? `${address.neighborhood}, ` : ""}
        {address.city}, CEP {formatPostalCode(address.postalCode)}
      </p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </>
  );

  if (selectable) {
    return (
      <label className={styles.card} data-selected={selected || undefined} data-inline={inline || undefined} data-account={account || undefined}>
        <input type="radio" name="endereco_id" value={address.id} checked={selected} onChange={onSelect} className="visually-hidden" />
        {body}
      </label>
    );
  }

  return (
    <div
      className={styles.card}
      data-selected={selected || undefined}
      data-inline={inline || undefined}
      data-account={account || undefined}
    >
      {body}
    </div>
  );
}
