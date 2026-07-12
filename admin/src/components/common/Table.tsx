import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export const Table = ({ headers, children, className }: TableProps) => {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-border-light dark:border-border-dark", className)}>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-textSecondary-light dark:text-textSecondary-dark uppercase bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light dark:divide-border-dark bg-surface-light dark:bg-surface-dark">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow = ({ children, className }: { children: ReactNode, className?: string }) => (
  <tr className={cn("hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors", className)}>
    {children}
  </tr>
);

export const TableCell = ({ children, className }: { children: ReactNode, className?: string }) => (
  <td className={cn("px-4 py-3 whitespace-nowrap text-textMain-light dark:text-textMain-dark", className)}>
    {children}
  </td>
);
