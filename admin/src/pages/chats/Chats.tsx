import { PageLayout } from '../../components/layout/PageLayout';

export const Chats = () => {
  return (
    <PageLayout title="Chat Logs" description="View and moderate chat sessions">
      <div className="p-4 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
        <p className="text-center text-textSecondary-light dark:text-textSecondary-dark">Chats management placeholder</p>
      </div>
    </PageLayout>
  );
};
