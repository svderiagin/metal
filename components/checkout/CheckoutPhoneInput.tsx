import type {ComponentProps} from "react";
import {Input} from "@/components/ui/Input";
import {CHECKOUT_PHONE_PREFIX, formatCheckoutPhoneDraft, isCheckoutPhonePrefix} from "@/lib/checkoutPhone";

type Props = Omit<ComponentProps<typeof Input>, "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
};

const digitsOf = (value: string) => value.replace(/\D/g, "");
const looksLikeWholePhone = (value: string) => value.startsWith("+") || digitsOf(value).length >= 10;

function caretBeforeDigits(value: string, digitsAfter: number) {
  if (!digitsAfter) return value.length;
  for (let index = value.length - 1; index >= 0; index--) {
    if (/\d/.test(value[index]) && --digitsAfter === 0) return index;
  }
  return 0;
}

export function CheckoutPhoneInput({value, onChange, ...props}: Props) {
  function applyDraft(input: HTMLInputElement, draft: string, caret: number) {
    const formatted = formatCheckoutPhoneDraft(draft);
    if (formatted === null) return false;
    const position = caretBeforeDigits(formatted, digitsOf(draft.slice(caret)).length);
    if (input.value !== formatted) input.value = formatted;
    input.setSelectionRange(position, position);
    if (value !== formatted) onChange(formatted);
    return true;
  }

  return <Input {...props} type="tel" autoComplete="tel" value={value}
    onFocus={event => {
      const input = event.currentTarget;
      if (!input.value) applyDraft(input, CHECKOUT_PHONE_PREFIX, CHECKOUT_PHONE_PREFIX.length);
    }}
    onChange={event => {
      const input = event.currentTarget;
      let draft = input.value;
      let caret = input.selectionStart ?? draft.length;
      const {data, inputType} = event.nativeEvent as InputEvent;
      // A browser can insert a saved number into a field as its +7 prefix appears.
      if (isCheckoutPhonePrefix(value) && data && data.length > 1 && looksLikeWholePhone(data)) {
        draft = data;
        caret = data.length;
      }
      const backward = inputType === "deleteContentBackward";
      if ((backward || inputType === "deleteContentForward") && draft.length < value.length
        && draft.startsWith("+") === value.startsWith("+") && digitsOf(draft) === digitsOf(value) && !isCheckoutPhonePrefix(value)) {
        // When the browser deleted a separator, apply the edit to the adjacent digit.
        const adjacent = backward ? draft.slice(0, caret).search(/\d\D*$/) : draft.slice(caret).search(/\d/);
        const index = backward ? adjacent : caret + adjacent;
        if (adjacent >= 0 && index >= (draft.startsWith("+7") ? 2 : 0)) {
          draft = draft.slice(0, index) + draft.slice(index + 1);
          caret = index;
        }
      }
      if (applyDraft(input, draft, caret)) return;
      const suffixLength = input.value.length - (input.selectionEnd ?? input.value.length);
      const end = Math.max(0, value.length - suffixLength);
      let start = 0;
      while (start < end && value[start] === input.value[start]) start++;
      input.value = value;
      input.setSelectionRange(start, end);
    }}
    onPaste={event => {
      event.preventDefault();
      const pasted = event.clipboardData.getData("text").trim();
      if (!pasted) return;
      const input = event.currentTarget;
      if (looksLikeWholePhone(pasted)) {
        applyDraft(input, pasted, pasted.length);
        return;
      }
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? start;
      applyDraft(input, value.slice(0, start) + pasted + value.slice(end), start + pasted.length);
    }}/>;
}
