import { Field } from "../form/Field";
import styles from "../address/AddressFields.module.css";

interface ContactFieldsProps {
  errors: Record<string, string[]>;
  defaults?: { nome?: string; telefone?: string; whatsapp?: string; cpf?: string };
}

/** Campos de contato reutilizados no checkout e em Minha conta. */
export function ContactFields({ errors, defaults = {} }: ContactFieldsProps) {
  return (
    <div className={styles.fields}>
      <Field label="Nome de quem recebe" name="nome" autoComplete="name" required defaultValue={defaults.nome ?? ""} errors={errors.nome} />
      <div className={styles.row}>
        <Field label="CPF" name="cpf" inputMode="numeric" placeholder="000.000.000-00" required defaultValue={defaults.cpf ?? ""} errors={errors.cpf} />
        <Field label="Telefone" name="telefone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" required defaultValue={defaults.telefone ?? ""} errors={errors.telefone} />
      </div>
      <Field label="WhatsApp, se for outro número" name="whatsapp" type="tel" inputMode="tel" placeholder="(00) 00000-0000" defaultValue={defaults.whatsapp ?? ""} errors={errors.whatsapp} />
    </div>
  );
}

export function readContactForm(form: FormData) {
  return {
    nome: String(form.get("nome") ?? ""),
    telefone: String(form.get("telefone") ?? ""),
    whatsapp: String(form.get("whatsapp") ?? "") || undefined,
    cpf: String(form.get("cpf") ?? ""),
  };
}
