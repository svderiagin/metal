"use client";

import {type ReactNode, useState} from "react";
import {QuoteRequestProvider} from "@/components/forms/QuoteRequestContext";
import {RequestQuoteSection} from "@/components/home/RequestQuoteSection";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {BeamVariantCatalog, isMeasuredRebarVariant, RebarVariantCatalog, VgpVariantCatalog, ElectroweldedPipeVariantCatalog, ProfilePipeVariantCatalog} from "./RebarVariantCatalog";
import {isVgpVariant, isMeasuredElectroweldedVariant} from "@/lib/pipeFamily";
import {isProfilePipeVariant} from "@/lib/profilePipe";
import {isProfileSheetVariant} from "@/lib/profileSheet";
import {isMetalMeshVariant} from "@/lib/metalMesh";
import {ProfileSheetVariantCatalog} from "./ProfileSheetVariantCatalog";
import {MetalMeshVariantCatalog} from "./MetalMeshVariantCatalog";
import {GenericProductVariantCatalog} from "./GenericProductVariantCatalog";
import type {ProductVariant} from "@/types/product";
import {storefrontVariant} from "@/lib/catalogOffer";
import {OrderDraftProvider} from "./OrderDraftProvider";
import {DetailsSummary} from "@/components/ui/DetailsSummary";

export function ProductVariantCatalog({children, ...props}: {variants: ProductVariant[]; categorySlug: string; children?: ReactNode}) {
  return <QuoteRequestProvider><OrderDraftProvider>
    <div className="flex min-w-0 flex-col gap-4">
      <VariantCatalogContent {...props} variants={props.variants.map(storefrontVariant)}/>
    </div>
    {children}
    <RequestQuoteSection/>
  </OrderDraftProvider></QuoteRequestProvider>;
}

function VariantCatalogContent({
  variants,
  categorySlug,
}: {
  variants: ProductVariant[];
  categorySlug: string;
}) {
  if (variants.length > 0 && variants.every(isProfileSheetVariant)) {
    return <ProfileSheetVariantCatalog variants={variants}/>;
  }
  if (variants.length > 0 && variants.every(isMetalMeshVariant)) {
    return <MetalMeshVariantCatalog variants={variants}/>;
  }
  if (categorySlug === "truby-profilnye") {
    const structured = variants.filter(isProfilePipeVariant);
    const legacy = variants.filter(variant => !isProfilePipeVariant(variant));
    return <>
      {structured.length > 0 && <ProfilePipeVariantCatalog variants={structured}/>}
      {legacy.length > 0 && <LegacyProfilePipeCatalog variants={legacy} categorySlug={categorySlug}/>}
    </>;
  }
  if (categorySlug === "balka") return <BeamVariantCatalog variants={variants}/>;
  if (variants.length > 0 && variants.every(isVgpVariant)) return <VgpVariantCatalog variants={variants}/>;
  if (variants.length > 0 && variants.every(isMeasuredElectroweldedVariant)) return <ElectroweldedPipeVariantCatalog variants={variants}/>;
  const isA500c = categorySlug === "armatura" && variants.every(v => v.subcategoryId === "cat-arm-sub-1");
  if (categorySlug === "armatura" && variants.every(isMeasuredRebarVariant)) {
    return <RebarVariantCatalog variants={variants}/>;
  }
  const measured = variants.filter(v => !v.imported).filter(isMeasuredRebarVariant);
  if (measured.length > 0) {
    if (isA500c) return <RebarVariantCatalog variants={measured}/>;
    const other = variants.filter(v => !measured.some(m => m.id === v.id));
    return <>{other.length > 0 && <GenericProductVariantCatalog variants={other} categorySlug={categorySlug}/>}<RebarVariantCatalog variants={measured}/></>;
  }

  return <GenericProductVariantCatalog variants={variants} categorySlug={categorySlug}/>;
}

function LegacyProfilePipeCatalog({variants, categorySlug}: {variants: ProductVariant[]; categorySlug: string}) {
  const [open, setOpen] = useState(false);
  useLinkedVariant(variants, () => setOpen(true));
  return <div className="min-w-0 lg:col-span-2">
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <DetailsSummary className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold dark:border-slate-700 dark:bg-slate-900">Другие позиции — параметры уточняются</DetailsSummary>
      {open && <div className="mt-4 flex min-w-0 flex-col gap-4">
        <GenericProductVariantCatalog variants={variants} categorySlug={categorySlug}/>
      </div>}
    </details>
  </div>;
}

