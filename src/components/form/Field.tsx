import type { InputHTMLAttributes } from "react";
import styles from "./Field.module.css";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  errors?: string[];
}

export function Field({ label, name, type = "text", errors, ...rest }: FieldProps) {
  const errorId = errors?.length ? `${name}-erro` : undefined;
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input name={name} type={type} aria-invalid={Boolean(errorId)} aria-describedby={errorId} {...rest} />
      {errorId && (
        <span id={errorId} className={styles.error}>
          {errors![0]}
        </span>
      )}
    </label>
  );
}
