import type { ReactNode } from 'react';
import { Card, CardContent } from '../common/Card';

interface KpiCardProps {
  title: string;
  value: string | number | undefined;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

export const KpiCard = ({ title, value, icon, trend, isLoading }: KpiCardProps) => {
  return (
    <Card className="border-none shadow-card overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">
              {title}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              {isLoading ? (
                <div className="h-8 w-24 bg-surface-dark/10 animate-pulse rounded" />
              ) : (
                <h3 className="text-2xl font-bold text-textMain-light dark:text-textMain-dark">
                  {value ?? 'N/A'}
                </h3>
              )}

              {!isLoading && trend && (
                <span className={`text-xs font-semibold ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
