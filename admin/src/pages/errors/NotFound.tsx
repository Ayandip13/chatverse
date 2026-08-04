import { EmptyState } from "../../components/common/EmptyState";
import { Button } from "../../components/common/Button";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export const NotFound = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <EmptyState
        icon={<AlertCircle className="w-16 h-16 text-warning" />}
        title="Page Not Found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <Link to="/">
            <Button>Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
};
