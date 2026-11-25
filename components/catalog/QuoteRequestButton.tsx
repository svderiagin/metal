"use client";

import {ButtonLink} from "@/components/ui/Button";
import {useQuoteRequest} from "@/components/forms/QuoteRequestContext";
import {revealQuoteRequest} from "@/components/home/revealQuoteRequest";
import {buildQuoteMessage, type QuoteOrder} from "@/lib/quoteRequest";

export function QuoteRequestButton({order, className, label = "Запросить цену"}: {order: QuoteOrder; className: string; label?: string}) {
  const quote = useQuoteRequest();
  return <ButtonLink href={quote ? "#request" : `/?product=${encodeURIComponent(order.product)}#request`}
    onClick={event => {
      if (!quote || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      quote.request(buildQuoteMessage(order));
      revealQuoteRequest();
    }} className={className}>{label}</ButtonLink>;
}
