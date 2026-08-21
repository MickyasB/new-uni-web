import React from 'react';

export function formatSantimToEtb(santim: number | undefined | null): string {
  if (santim == null || isNaN(santim)) return '0.00';
  return (santim / 100).toFixed(2);
}

export function formatEtb(etb: number | undefined | null): string {
  if (etb == null || isNaN(etb)) return '0.00';
  return Number(etb).toFixed(2);
}

export interface CurrencyDisplayProps {
  santim?: number | null;
  amountEtb?: number | null;
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gold' | 'amber' | 'success' | 'white' | 'muted';
  className?: string;
  style?: React.CSSProperties;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  santim,
  amountEtb,
  prefix = 'ETB ',
  suffix = '',
  size = 'md',
  variant = 'amber',
  className = '',
  style,
}) => {
  const formattedValue = santim != null ? formatSantimToEtb(santim) : formatEtb(amountEtb);

  return (
    <span className={`currency-ui currency-ui-${size} currency-ui-${variant} ${className}`} style={style}>
      {prefix && <span className="currency-prefix">{prefix}</span>}
      <span className="currency-value">{formattedValue}</span>
      {suffix && <span className="currency-suffix">{suffix}</span>}
    </span>
  );
};
