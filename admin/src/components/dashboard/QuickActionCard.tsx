import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../common/Card';
import { ChevronRight } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  route: string;
  badgeCount?: number;
}

export const QuickActionCard = ({ title, description, icon, route, badgeCount }: QuickActionCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="border-none shadow-card hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
      onClick={() => navigate(route)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-textMain-light dark:text-textMain-dark">
                {title}
              </h3>
              {badgeCount !== undefined && badgeCount > 0 && (
                <span className="bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {badgeCount}
                </span>
              )}
            </div>
            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mt-1 line-clamp-2">
              {description}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-textMuted-light dark:text-textMuted-dark self-center group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
};
