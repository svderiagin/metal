"use client";

import {useEffect, useState} from "react";
import {Icon} from "@/components/ui/Icon";

export function CopyCompanyDetails({details}: {details: string}) {
  const [result, setResult] = useState<{kind: "copied" | "unavailable"} | null>(null);

  useEffect(() => {
    if (result?.kind !== "copied") return;
    const timer = window.setTimeout(() => setResult(null), 3000);
    return () => window.clearTimeout(timer);
  }, [result]);

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(details);
      setResult({kind: "copied"});
    } catch {
      setResult({kind: "unavailable"});
    }
  }

  const copied = result?.kind === "copied";
  const unavailable = result?.kind === "unavailable";

  return (
    <>
      <button
        type="button"
        aria-label="Скопировать реквизиты организации"
        onClick={copyDetails}
        className="inline-flex min-h-11 w-28 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md px-0.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-brand-300 dark:hover:bg-slate-800"
      >
        <Icon name={copied ? "check" : "clipboard"} className="size-4!"/>
        {copied ? "Скопировано" : "Копировать"}
      </button>
      <p role="status" className={unavailable ? "w-full pt-1 text-xs text-slate-600 dark:text-slate-300" : "sr-only"}>
        {copied && "Реквизиты скопированы."}
        {unavailable && "Выделите реквизиты на странице и скопируйте их вручную."}
      </p>
    </>
  );
}
