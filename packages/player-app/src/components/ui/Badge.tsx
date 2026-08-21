import React from 'react';
import { RoomTier, RoomStatus } from '@bingo/shared';

export type BadgeVariant = 
  | 'bronze' 
  | 'silver' 
  | 'gold' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'neutral'
  | 'waiting'
  | 'in_progress'
  | 'ended';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  tier?: RoomTier;
  status?: RoomStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  icon,
  size = 'md',
  className = '',
  tier,
  status,
}) => {
  // Determine variant from tier or status props if provided
  let computedVariant: BadgeVariant = variant || 'neutral';
  let computedIcon = icon;
  let computedText = children;

  if (tier) {
    if (tier === RoomTier.BRONZE) {
      computedVariant = 'bronze';
      computedIcon = computedIcon || '🥉';
      computedText = computedText || 'Bronze';
    } else if (tier === RoomTier.SILVER) {
      computedVariant = 'silver';
      computedIcon = computedIcon || '🥈';
      computedText = computedText || 'Silver';
    } else if (tier === RoomTier.GOLD) {
      computedVariant = 'gold';
      computedIcon = computedIcon || '🥇';
      computedText = computedText || 'Gold';
    }
  } else if (status) {
    const s = String(status).toUpperCase();
    if (s === 'WAITING') {
      computedVariant = 'waiting';
      computedIcon = computedIcon || '⏳';
      computedText = computedText || 'Waiting';
    } else if (s === 'IN_PROGRESS' || s === 'LIVE' || s === 'STARTING') {
      computedVariant = 'in_progress';
      computedIcon = computedIcon || '🔥';
      computedText = computedText || (s === 'STARTING' ? 'Starting' : 'Live');
    } else if (s === 'ENDED' || s === 'CANCELLED') {
      computedVariant = 'ended';
      computedIcon = computedIcon || '🏁';
      computedText = computedText || (s === 'CANCELLED' ? 'Cancelled' : 'Ended');
    } else if (s === 'COMPLETED' || s === 'VERIFIED') {
      computedVariant = 'success';
      computedIcon = computedIcon || '✓';
      computedText = computedText || (s === 'VERIFIED' ? 'Verified' : 'Completed');
    } else if (s === 'PENDING') {
      computedVariant = 'warning';
      computedIcon = computedIcon || '⏳';
      computedText = computedText || 'Pending';
    } else if (s === 'FAILED' || s === 'REJECTED') {
      computedVariant = 'danger';
      computedIcon = computedIcon || '✕';
      computedText = computedText || (s === 'REJECTED' ? 'Rejected' : 'Failed');
    }
  }

  return (
    <span className={`badge-ui badge-ui-${computedVariant} badge-ui-${size} ${className}`}>
      {computedIcon && <span className="badge-icon">{computedIcon}</span>}
      <span className="badge-text">{computedText}</span>
    </span>
  );
};
