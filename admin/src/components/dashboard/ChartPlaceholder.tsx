import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { BarChart3 } from 'lucide-react';

interface ChartPlaceholderProps {
  title: string;
  description?: string;
  className?: string;
}

export const ChartPlaceholder = ({ title, description, className }: ChartPlaceholderProps) => {
  return (
    <Card className={`border-none shadow-card flex flex-col ${className || ''}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mt-1">{description}</p>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-8 min-h-[300px]">
        <BarChart3 className="w-16 h-16 text-border-light dark:text-border-dark mb-4" />
        <p className="text-textSecondary-light dark:text-textSecondary-dark text-center">
          Chart data visualization will be available once the backend provides the necessary time-series endpoints.
        </p>
      </CardContent>
    </Card>
  );
};
