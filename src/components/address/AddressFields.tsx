import { Field } from "../form/Field";
import styles from "./AddressFields.module.css";

interface AddressFieldsProps {
  errors: Record<string, string[]>;
  withLabel?: boolean;
  defaults?: {
    apelido?: string;
    cep?: string;
    cidade?: string;
    bairro?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
  };
}

/** Campos de endereço reutilizados no checkout e em Minha conta. */
export function AddressFields({ errors, withLabel = true, defaults = {} }: AddressFieldsProps) {
  return (
    <div className={styles.fields}>
      {withLabel && (
        <Field label="Apelido, como Casa ou Trabalho" name="apelido" maxLength={40} defaultValue={defaults.apelido ?? ""} errors={errors.apelido} />
      )}
      <div className={styles.row}>
        <Field label="CEP" name="cep" inputMode="numeric" autoComplete="postal-code" required defaultValue={defaults.cep ?? ""} errors={errors.cep} />
        <Field label="Cidade" name="cidade" autoComplete="address-level2" required defaultValue={defaults.cidade ?? ""} errors={errors.cidade} />
      </div>
      <div className={styles.row}>
        <Field label="Bairro" name="bairro" autoComplete="address-level3" required defaultValue={defaults.bairro ?? ""} errors={errors.bairro} />
        <Field label="Endereço" name="endereco" autoComplete="street-address" required defaultValue={defaults.endereco ?? ""} errors={errors.endereco} />
      </div>
      <div className={styles.row}>
        <Field label="Número" name="numero" required defaultValue={defaults.numero ?? ""} errors={errors.numero} />
        <Field label="Complemento" name="complemento" defaultValue={defaults.complemento ?? ""} errors={errors.complemento} />
      </div>
    </div>
  );
}

export function readAddressForm(form: FormData) {
  return {
    apelido: String(form.get("apelido") ?? "") || undefined,
    cep: String(form.get("cep") ?? ""),
    cidade: String(form.get("cidade") ?? ""),
    bairro: String(form.get("bairro") ?? ""),
    endereco: String(form.get("endereco") ?? ""),
    numero: String(form.get("numero") ?? ""),
    complemento: String(form.get("complemento") ?? "") || undefined,
  };
}
