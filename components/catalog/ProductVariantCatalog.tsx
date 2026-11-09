"use client";

import {type ReactNode, useState} from "react";
import {QuoteRequestProvider} from "@/components/forms/QuoteRequestContext";
import {RequestQuoteSection} from "@/components/home/RequestQuoteSection";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {BeamVariantCatalog, isMeasuredRebarVariant, RebarVariantCatalog, VgpVariantCatalog, ProfilePipeVariantCatalog} from "./RebarVariantCatalog";
import {isVgpVariant} from "@/lib/vgp";
import {isProfilePipeVariant} from "@/lib/profilePipe";
import {isProfileSheetVariant} from "@/lib/profileSheet";
import {isMetalMeshVariant} from "@/lib/metalMesh";
import {ProfileSheetVariantCatalog} from "./ProfileSheetVariantCatalog";
import {MetalMeshVariantCatalog} from "./MetalMeshVariantCatalog";
import {GenericProductVariantCatalog} from "./GenericProductVariantCatalog";
import type {ProductVariant} from "@/types/product";
import {storefrontVariant} from "@/lib/catalogOffer";
import {OrderDraftProvider} from "./OrderDraftProvider";

export function ProductVariantCatalog({children, ...props}: {variants: ProductVariant[]; categorySlug: string; children?: ReactNode}) {
  return <QuoteRequestProvider><OrderDraftProvider>
    <VariantCatalogContent {...props} variants={props.variants.map(storefrontVariant)}/>
    {children}
    <div className="min-w-0 lg:col-span-2"><RequestQuoteSection/></div>
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
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <summary className="cursor-pointer font-semibold">Другие позиции — параметры уточняются</summary>
      <GenericProductVariantCatalog variants={variants} categorySlug={categorySlug}/>
    </details>
  </div>;
}

