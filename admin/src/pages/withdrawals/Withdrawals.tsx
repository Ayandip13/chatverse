import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, RefreshCcw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import apiClient from '../../api/apiClient';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/common/Card';
import { Table, TableRow, TableCell } from '../../components/common/Table';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

const getWithdrawalBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'PENDING': return 'warning';
    case 'PROCESSING': return 'default';
    case 'REJECTED': return 'danger';
    default: return 'default';
  }
};

export const Withdrawals = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<'COMPLETED' | 'REJECTED' | 'PROCESSING' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const limit = 10;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-withdrawals', page, limit, statusFilter],
    queryFn: async () => {
      const response = await apiClient.get('/admin/withdrawals', {
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

  const updateWithdrawalMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string; notes: string }) => {
      const response = await apiClient.patch(`/admin/withdrawals/${payload.id}/status`, {
        status: payload.status,
        notes: payload.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Withdrawal marked as ${targetStatus}`);
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update withdrawal status');
    },
  });

  const requests = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const openActionModal = (req: any, status: 'COMPLETED' | 'REJECTED' | 'PROCESSING') => {
    setSelectedReq(req);
    setTargetStatus(status);
    setAdminNotes('');
  };

  const closeModal = () => {
    setSelectedReq(null);
    setTargetStatus(null);
    setAdminNotes('');
  };

  const handleConfirmAction = () => {
    if (!selectedReq || !targetStatus) return;
    if (targetStatus === 'REJECTED' && !adminNotes.trim()) {
      toast.error('Notes/Reason are required when rejecting a payout request.');
      return;
    }
    updateWithdrawalMutation.mutate({
      id: selectedReq._id,
      status: targetStatus,
      notes: adminNotes,
    });
  };

  return (
    <PageLayout
      title="Withdrawals Payout Queue"
      description="Review and process earnings payout requests submitted by creators."
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
          { label: 'All Requests', value: '' },
          { label: 'Pending Queue', value: 'PENDING' },
          { label: 'Processing', value: 'PROCESSING' },
          { label: 'Completed Payouts', value: 'COMPLETED' },
          { label: 'Rejected', value: 'REJECTED' },
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
        {isLoading && !requests.length ? (
          <Loading className="py-20" />
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle className="w-12 h-12" />}
            title="Failed to load payout queue"
            description="Unable to connect to server. Please try again."
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-10 h-10 text-textMuted-light dark:text-textMuted-dark" />}
            title="No payout requests found"
            description={statusFilter ? 'No payout requests match the selected status.' : 'The withdrawal queue is currently empty.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Creator', 'Payout UPI ID', 'Amount', 'Status', 'Requested On', 'Actions']}>
              {requests.map((req: any) => (
                <TableRow key={req._id}>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold text-textMain-light dark:text-textMain-dark">
                        {req.userId?.name || req.userId || 'Unknown'}
                      </div>
                      <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                        {req.userId?.email || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm font-semibold bg-surface-light dark:bg-surface-dark px-2.5 py-1 rounded-md border border-border-light dark:border-border-dark text-primary">
                      {req.upiId || req.accountDetails || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      ₹{req.amount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getWithdrawalBadgeVariant(req.status)}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    {format(new Date(req.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {req.status === 'PENDING' || req.status === 'PROCESSING' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openActionModal(req, 'COMPLETED')}
                          className="text-success border-success/30 hover:bg-success/10 gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve Payout
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openActionModal(req, 'REJECTED')}
                          className="text-danger border-danger/30 hover:bg-danger/10 gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-textMuted-light dark:text-textMuted-dark italic">
                        No actions
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-light dark:border-border-dark">
            <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
              Showing page {page} of {totalPages} ({total} payout requests)
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

      {/* Process Payout Modal */}
      <Modal
        isOpen={!!targetStatus}
        onClose={closeModal}
        title={`Payout Action: ${targetStatus}`}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={updateWithdrawalMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              isLoading={updateWithdrawalMutation.isPending}
              className={targetStatus === 'REJECTED' ? 'bg-danger hover:bg-danger/90' : ''}
            >
              Confirm {targetStatus}
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
            You are about to mark payout request of <strong>₹{selectedReq?.amount}</strong> for{' '}
            <strong>{selectedReq?.userId?.name || selectedReq?.userId}</strong> as <Badge variant={targetStatus ? getWithdrawalBadgeVariant(targetStatus) : 'default'}>{targetStatus}</Badge>.
          </p>

          <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark text-xs space-y-1">
            <p><strong>Target UPI ID:</strong> <span className="font-mono text-primary">{selectedReq?.upiId || selectedReq?.accountDetails}</span></p>
            {targetStatus === 'REJECTED' && (
              <p className="text-rose-500 font-semibold">
                * Rejecting this request will automatically refund ₹{selectedReq?.amount} back to the creator's wallet.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-1">
              Admin Notes {targetStatus === 'REJECTED' && <span className="text-danger">*</span>}
            </label>
            <textarea
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm text-textMain-light dark:text-textMain-dark focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-none"
              placeholder="Enter transaction reference or rejection reason..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};
