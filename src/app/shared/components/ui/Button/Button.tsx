// ============================================================
//  Button  –  Reusable UI component
// ============================================================

import React from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'cancel' | 'ghost';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  icon?:     React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth  ? styles.fullWidth : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      {...rest}
      className={cls}
      disabled={disabled || loading}
      data-loading={loading || undefined}
    >
      {loading && <span className={styles.spinner} aria-hidden />}
      {!loading && icon && <span className={styles.icon}>{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};

export default Button;
