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
      // Also scroll when the anchor is already present after a previous request.
      document.getElementById("request")?.scrollIntoView({behavior: "smooth", block: "start"});
    }} className={className}>{label}</ButtonLink>;
}
