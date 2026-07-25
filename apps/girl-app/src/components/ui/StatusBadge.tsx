import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../utils/cn';
import { Clock, CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react-native';

export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED';

interface StatusBadgeProps {
  status: AccountStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge = ({ status, size = 'md', className }: StatusBadgeProps) => {
  const configs = {
    PENDING: {
      label: 'Pending Verification',
      bg: 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      icon: Clock,
      iconColor: '#F59E0B',
    },
    APPROVED: {
      label: 'Verified & Approved',
      bg: 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2,
      iconColor: '#10B981',
    },
    REJECTED: {
      label: 'Application Rejected',
      bg: 'bg-red-500/10 border-red-500/30 dark:bg-red-500/20',
      text: 'text-red-600 dark:text-red-400',
      icon: XCircle,
      iconColor: '#EF4444',
    },
    SUSPENDED: {
      label: 'Account Suspended',
      bg: 'bg-rose-500/10 border-rose-500/30 dark:bg-rose-500/20',
      text: 'text-rose-600 dark:text-rose-400',
      icon: AlertTriangle,
      iconColor: '#F43F5E',
    },
    BANNED: {
      label: 'Account Banned',
      bg: 'bg-red-600/10 border-red-600/30 dark:bg-red-600/20',
      text: 'text-red-700 dark:text-red-400',
      icon: ShieldAlert,
      iconColor: '#DC2626',
    },
  };

  const config = configs[status] || configs.PENDING;
  const IconComponent = config.icon;

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2.5',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  return (
    <View
      className={cn(
        'flex-row items-center rounded-full border self-start',
        config.bg,
        sizeStyles[size],
        className
      )}
    >
      <IconComponent color={config.iconColor} size={iconSizes[size]} />
      <Text className={cn('font-semibold', config.text)}>{config.label}</Text>
    </View>
  );
};
