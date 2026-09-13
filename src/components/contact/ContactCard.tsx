import type { ReactNode } from "react";
import { MessageCircle, Phone, UserRound } from "lucide-react";
import type { Contact } from "@/lib/api";
import { formatCpf, formatPhone } from "@/lib/format";
import { Icon } from "../Icon";
import styles from "../address/AddressCard.module.css";

interface ContactCardProps {
  contact: Contact;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  actions?: ReactNode;
  /** Card sozinho na lista, ocupando a linha inteira: as informações ficam lado a lado. */
  inline?: boolean;
  /** Card de gerenciamento em Minha conta: ações ancoradas no rodapé. */
  account?: boolean;
}

export function ContactCard({ contact, selectable, selected, onSelect, actions, inline, account }: ContactCardProps) {
  const body = (
    <>
      <div className={styles.head}>
        <span className={styles.title}>
          <Icon icon={UserRound} size={17} />
          {contact.name}
        </span>
        {contact.isDefault && <span className={styles.badge}>Padrão</span>}
      </div>
      <p className={styles.line}>{contact.cpf ? `CPF ${formatCpf(contact.cpf)}` : "CPF pendente"}</p>
      <p className={styles.meta}>
        <Icon icon={Phone} size={13} /> {formatPhone(contact.phone)}
        {contact.whatsapp && contact.whatsapp !== contact.phone && (
          <>
            {"  "}
            <Icon icon={MessageCircle} size={13} /> {formatPhone(contact.whatsapp)}
          </>
        )}
      </p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </>
  );

  if (selectable) {
    return (
      <label className={styles.card} data-selected={selected || undefined} data-inline={inline || undefined} data-account={account || undefined}>
        <input type="radio" name="contato_id" value={contact.id} checked={selected} onChange={onSelect} className="visually-hidden" />
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
