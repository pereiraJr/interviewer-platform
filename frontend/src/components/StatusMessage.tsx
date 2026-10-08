import type { ReactNode } from 'react';
import './StatusMessage.css';

export type StatusMessageVariant = 'loading' | 'empty' | 'error';

export interface StatusMessageProps {
  variant: StatusMessageVariant;
  role?: 'status' | 'alert';
  children: ReactNode;
}

const DEFAULT_ROLE: Record<StatusMessageVariant, 'status' | 'alert' | undefined> = {
  loading: 'status',
  empty: undefined,
  error: 'alert',
};

export function StatusMessage({ variant, role, children }: StatusMessageProps) {
  return (
    <div
      className={`status-message status-message--${variant}`}
      role={role ?? DEFAULT_ROLE[variant]}
    >
      {children}
    </div>
  );
}
