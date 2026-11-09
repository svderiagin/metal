import {PageContainer} from "@/components/layout/PageContainer";

export default function Loading() {
  return <PageContainer className="min-h-screen py-7">
    <p role="status" className="sr-only">Загрузка страницы…</p>
    <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
      <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-700"/>
      <div className="mt-5 h-36 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"/>
      <div className="mt-5 grid gap-3">{[1, 2, 3].map(i => <div key={i}
        className="h-24 rounded-xl bg-slate-200 dark:bg-slate-700"/>)}</div>
    </div>
  </PageContainer>;
}
