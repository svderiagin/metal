import {PageContainer} from "@/components/layout/PageContainer";

export default function Loading() {
  return <PageContainer className="py-12" aria-live="polite">
    <div className="h-7 w-56 animate-pulse rounded bg-slate-300"/>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <div key={i}
                                                                                            className="h-56 animate-pulse rounded-lg bg-slate-200"/>)}</div>
  </PageContainer>
}
