import styles from "./CartAmount.module.css";

export function CartAmount({children, className = ""}: {children: string; className?: string}) {
  return <span data-cart-amount="" className={`${styles.amount} ${className}`}>{children}</span>;
}
