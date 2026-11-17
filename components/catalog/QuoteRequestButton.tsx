"use client";

import {ButtonLink} from "@/components/ui/Button";
import {useQuoteRequest} from "@/components/forms/QuoteRequestContext";
import {buildQuoteMessage, type QuoteOrder} from "@/lib/quoteRequest";

export function QuoteRequestButton({order, className, label = "Запросить цену"}: {order: QuoteOrder; className: string; label?: string}) {
  const quote = useQuoteRequest();
  return <ButtonLink href={quote ? "#request" : `/?product=${encodeURIComponent(order.product)}#request`}
    onClick={event => {
      if (!quote || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      quote.request(buildQuoteMessage(order));
      const section = document.getElementById("request");
      section?.focus({preventScroll: true});
      section?.scrollIntoView({block: "start"});
    }} className={className}>{label}</ButtonLink>;
}
