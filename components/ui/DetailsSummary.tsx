import type {ComponentProps} from "react";
import {Icon} from "./Icon";
import styles from "./DetailsSummary.module.css";

export function DetailsSummary({className = "", children, ...props}: ComponentProps<"summary">) {
  return <summary className={`${styles.summary} ${className}`} {...props}>
    {children}
    <Icon name="chevron-down" className={styles.icon}/>
  </summary>;
}
