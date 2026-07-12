import { PageLayout } from '../../components/layout/PageLayout';

export const Profile = () => {
  return (
    <PageLayout title="Admin Profile" description="Manage your account settings">
      <div className="p-4 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
        <p className="text-center text-textSecondary-light dark:text-textSecondary-dark">Profile placeholder</p>
      </div>
    </PageLayout>
  );
};
