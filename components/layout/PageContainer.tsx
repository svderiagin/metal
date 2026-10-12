import type {ReactNode} from "react";

export function PageContainer({children, className = ""}: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1360px] px-4 sm:px-5 lg:px-6 ${className}`}>
      {children}
    </div>
  );
}
