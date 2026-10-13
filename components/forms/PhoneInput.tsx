"use client";

import {useState, type ComponentProps} from "react";
import {Input} from "@/components/ui/Input";
import {normalizeRussianPhone, QUOTE_LIMITS} from "@/lib/quoteValidation";

export function PhoneInput(props: Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type" | "maxLength">) {
  const [value, setValue] = useState("");
  return <Input {...props} type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 900 000-00-00"
    maxLength={QUOTE_LIMITS.phone} value={value}
    onFocus={() => {if (!value) setValue("+7");}}
    onBlur={() => {if (value === "+7") setValue("");}}
    onChange={event => setValue(normalizeRussianPhone(event.target.value))}
    onPaste={event => {
      event.preventDefault();
      const pasted = event.clipboardData.getData("text");
      const input = event.currentTarget;
      const next = pasted.replace(/\D/g, "").length >= 10 ? pasted
        : value.slice(0, input.selectionStart ?? value.length) + pasted + value.slice(input.selectionEnd ?? value.length);
      setValue(normalizeRussianPhone(next));
    }}/>;
}
