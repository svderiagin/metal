import type {ReactNode} from "react";

export function PageContainer({children, className = "", withBreadcrumbs = false}: {
  children: ReactNode;
  className?: string;
  withBreadcrumbs?: boolean;
}) {
  const topSpacing = withBreadcrumbs ? "pt-5 sm:pt-6 lg:pt-7" : "";

  return (
    <div className={`mx-auto w-full max-w-[1360px] px-4 sm:px-5 lg:px-6 ${topSpacing} ${className}`}>
      {children}
    </div>
  );
}
