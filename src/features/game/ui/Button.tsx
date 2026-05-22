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
  pressed?: boolean;
  children: ReactNode;
  className?: string;
  title?: string;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "title">;

interface ButtonLinkProps extends CommonProps {
  href: string;
  onClick?: () => void;
  prefetch?: boolean;
  pressed?: boolean;
}

function classesFor({
  variant = "primary",
  size = "md",
  fullWidth = false,
  pressed = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  pressed?: boolean;
  className?: string;
}): string {
  return [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : "",
    pressed ? styles.pressed : "",
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
  { variant, size, bracket = false, fullWidth, pressed, title, children, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      title={title}
      className={classesFor({ variant, size, fullWidth, pressed, className })}
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
  pressed,
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
      className={classesFor({ variant, size, fullWidth, pressed, className })}
    >
      <Content bracket={bracket}>{children}</Content>
    </Link>
  );
}
