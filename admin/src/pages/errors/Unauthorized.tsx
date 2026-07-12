import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <EmptyState
        icon={<ShieldAlert className="w-16 h-16 text-danger" />}
        title="Access Denied"
        description="You do not have permission to view this page."
        action={
          <Link to="/">
            <Button>Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
};
