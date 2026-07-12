import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
}

export const Card = ({ className, children, ...props }: CardProps) => {
  return (
    <div 
      className={cn('bg-surface-light dark:bg-surface-dark rounded-lg shadow-card border border-border-light dark:border-border-dark', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children }: CardProps) => (
  <div className={cn('p-4 border-b border-border-light dark:border-border-dark', className)}>{children}</div>
);

export const CardTitle = ({ className, children }: CardProps) => (
  <h3 className={cn('text-h3 font-semibold text-textMain-light dark:text-textMain-dark', className)}>{children}</h3>
);

export const CardContent = ({ className, children }: CardProps) => (
  <div className={cn('p-4', className)}>{children}</div>
);

export const CardFooter = ({ className, children }: CardProps) => (
  <div className={cn('p-4 border-t border-border-light dark:border-border-dark flex items-center', className)}>{children}</div>
);
