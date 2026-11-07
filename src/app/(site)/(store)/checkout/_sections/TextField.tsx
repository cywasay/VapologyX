import type { InputHTMLAttributes } from "react";
import { ComboInput } from "@/components/dropdown";
import type { Field } from "./checkoutDraft";

type TextFieldProps = { id: Field | "notes"; label: string; error?: string; hint?: string; optional?: boolean; suggestions?: string[]; onValue: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "onChange" | "list">;

// A labelled text box with its hint or error message underneath. With suggestions it becomes a drop-down box.
export function TextField({ id, label, error, hint, optional, suggestions, onValue, ...input }: TextFieldProps) {
  const describedBy = error ? `checkout-${id}-error` : hint ? `checkout-${id}-hint` : undefined;
  const shared = { id: `checkout-${id}`, name: id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy } as const;
  return <div className={optional ? "field field-optional" : "field"}>
    <label htmlFor={`checkout-${id}`}>{label}{optional && <span> (optional)</span>}</label>
    {suggestions
      ? <ComboInput {...input} {...shared} value={String(input.value ?? "")} suggestions={suggestions} onValue={onValue} />
      : <input {...input} {...shared} onChange={event => onValue(event.target.value)} />}
    {error ? <span className="field-error" id={`checkout-${id}-error`}>{error}</span> : hint && <span className="field-hint" id={`checkout-${id}-hint`}>{hint}</span>}
  </div>;
}
