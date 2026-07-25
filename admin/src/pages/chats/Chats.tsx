import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, RefreshCcw, AlertCircle, Clock, Coins, Eye } from 'lucide-react';
import { format } from 'date-fns';

import apiClient from '../../api/apiClient';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/common/Card';
import { Table, TableRow, TableCell } from '../../components/common/Table';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'ENDED': return 'default';
    default: return 'default';
  }
};

export const Chats = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const limit = 10;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-chats', page, limit, statusFilter],
    queryFn: async () => {
      const response = await apiClient.get('/admin/chats', {
        params: {
          page,
          limit,
          status: statusFilter || undefined,
        },
      });
      return response.data;
    },
    placeholderData: (prev) => prev,
  });

  const { data: transcriptData, isLoading: isLoadingTranscript } = useQuery({
    queryKey: ['admin-chat-messages', selectedChatId],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/chats/${selectedChatId}/messages`);
      return response.data.data;
    },
    enabled: !!selectedChatId,
  });

  const chats = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <PageLayout
      title="Chat Monitoring"
      description="Monitor active and past chat sessions across the platform in real time."
      action={
        <Button onClick={() => refetch()} variant="secondary" className="gap-2">
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'All Sessions', value: '' },
          { label: 'Active Chats', value: 'ACTIVE' },
          { label: 'Ended Chats', value: 'ENDED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              statusFilter === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-light dark:bg-surface-dark text-textSecondary-light dark:text-textSecondary-dark hover:bg-surface-light/80 border border-border-light dark:border-border-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="border-none shadow-card overflow-hidden">
        {isLoading && !chats.length ? (
          <Loading className="py-20" />
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle className="w-12 h-12" />}
            title="Failed to load chat sessions"
            description="Unable to connect to backend server. Please try again."
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        ) : chats.length === 0 ? (
          <EmptyState
            title="No chat sessions found"
            description={statusFilter ? 'No chat sessions match the selected filter.' : 'No active or historical chats available.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Participants', 'Status', 'Duration', 'Cost', 'Started At', 'Actions']}>
              {chats.map((chat: any) => (
                <TableRow key={chat._id}>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold text-textMain-light dark:text-textMain-dark">
                        Boy: {chat.boyId?.name || chat.boyId || 'Unknown'}
                      </div>
                      <div className="text-pink-500 font-medium">
                        Girl: {chat.girlId?.name || chat.girlId || 'Unknown'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(chat.status)}>
                      {chat.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5 text-textMain-light dark:text-textMain-dark">
                      <Clock className="w-3.5 h-3.5 text-textMuted-light dark:text-textMuted-dark" />
                      <span>{chat.durationInMinutes || 0} mins</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{chat.totalCost || 0} Coins</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    {format(new Date(chat.startTime || chat.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedChatId(chat._id)}
                      className="gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Transcript
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-light dark:border-border-dark">
            <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
              Showing page {page} of {totalPages} ({total} sessions)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Transcript Modal */}
      <Modal
        isOpen={!!selectedChatId}
        onClose={() => setSelectedChatId(null)}
        title="Chat Transcript Viewer"
      >
        <div className="pt-2">
          {isLoadingTranscript ? (
            <Loading className="py-12" />
          ) : !transcriptData || transcriptData.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-10 h-10 text-textMuted-light dark:text-textMuted-dark" />}
              title="No messages found"
              description="This chat session contains no recorded textual messages."
              className="py-8"
            />
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto p-2">
              {transcriptData.map((msg: any) => (
                <div
                  key={msg._id}
                  className="p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark"
                >
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-primary">
                      {msg.senderId?.name || msg.senderId}
                    </span>
                    <span className="text-textMuted-light dark:text-textMuted-dark">
                      {format(new Date(msg.createdAt), 'HH:mm:ss')}
                    </span>
                  </div>
                  <p className="text-sm text-textMain-light dark:text-textMain-dark leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </PageLayout>
  );
};
