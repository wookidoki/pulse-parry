"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "lg" | "md" | "sm";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  bracket?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;

interface ButtonLinkProps extends CommonProps {
  href: string;
  onClick?: () => void;
  prefetch?: boolean;
}

function classesFor({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  return [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function Content({
  bracket,
  children,
}: {
  bracket: boolean;
  children: ReactNode;
}): React.ReactElement {
  return (
    <>
      {bracket && <span className={styles.bracket}>[</span>}
      <span className={styles.label}>{children}</span>
      {bracket && <span className={styles.bracket}>]</span>}
      <span className={styles.scanline} aria-hidden />
      <span className={styles.cornerTL} aria-hidden />
      <span className={styles.cornerBR} aria-hidden />
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, bracket = false, fullWidth, children, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={classesFor({ variant, size, fullWidth, className })}
      {...rest}
    >
      <Content bracket={bracket}>{children}</Content>
    </button>
  );
});

export function ButtonLink({
  variant,
  size,
  bracket = false,
  fullWidth,
  children,
  className,
  href,
  onClick,
  prefetch,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      prefetch={prefetch}
      className={classesFor({ variant, size, fullWidth, className })}
    >
      <Content bracket={bracket}>{children}</Content>
    </Link>
  );
}
