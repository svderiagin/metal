"use client";

import {useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";

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

  return (
    <div>
      <Button type="button" variant="secondary" onClick={copyDetails} className="w-full sm:w-auto">Скопировать реквизиты организации</Button>
      <p role="status" className="mt-1.5 text-sm text-slate-600 empty:mt-0 dark:text-slate-300">
        {result?.kind === "copied" && "Реквизиты скопированы."}
        {result?.kind === "unavailable" && "Выделите реквизиты на странице и скопируйте их вручную."}
      </p>
    </div>
  );
}
