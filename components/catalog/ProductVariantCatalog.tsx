"use client";

import type {ReactNode} from "react";
import {QuoteRequestProvider} from "@/components/forms/QuoteRequestContext";
import {RequestQuoteSection} from "@/components/home/RequestQuoteSection";
import {BeamVariantCatalog, ChannelVariantCatalog, isMeasuredRebarVariant, RebarVariantCatalog, VgpVariantCatalog, ElectroweldedPipeVariantCatalog, ProfilePipeVariantCatalog} from "./RebarVariantCatalog";
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
    return <ProfilePipeVariantCatalog variants={variants.filter(isProfilePipeVariant)}/>;
  }
  if (categorySlug === "balka") return <BeamVariantCatalog variants={variants}/>;
  if (categorySlug === "shveller") return <ChannelVariantCatalog variants={variants}/>;
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

