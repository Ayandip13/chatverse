import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, RefreshCcw, AlertCircle, CheckCircle, XCircle, DollarSign, User } from 'lucide-react';
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
    case 'COMPLETED':
    case 'PAID':
      return 'success';
    case 'APPROVED':
      return 'default';
    case 'PENDING':
    case 'PROCESSING':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    case 'CANCELLED':
      return 'default';
    default:
      return 'default';
  }
};

export const Withdrawals = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'MARK_PAID' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
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
    mutationFn: async (payload: { id: string; status: string; notes?: string; rejectionReason?: string; transactionReference?: string }) => {
      const response = await apiClient.patch(`/admin/withdrawals/${payload.id}/status`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Withdrawal marked as ${actionType}`);
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

  const openActionModal = (req: any, type: 'APPROVE' | 'REJECT' | 'MARK_PAID') => {
    setSelectedReq(req);
    setActionType(type);
    setAdminNotes('');
    setRejectionReason('');
    setTransactionReference(`TXN_${Date.now()}`);
  };

  const closeModal = () => {
    setSelectedReq(null);
    setActionType(null);
    setAdminNotes('');
    setRejectionReason('');
    setTransactionReference('');
  };

  const handleConfirmAction = () => {
    if (!selectedReq || !actionType) return;

    if (actionType === 'REJECT' && !rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    if (actionType === 'MARK_PAID' && !transactionReference.trim()) {
      toast.error('Transaction reference number is required.');
      return;
    }

    let targetStatus = 'APPROVED';
    if (actionType === 'REJECT') targetStatus = 'REJECTED';
    if (actionType === 'MARK_PAID') targetStatus = 'COMPLETED';

    updateWithdrawalMutation.mutate({
      id: selectedReq._id,
      status: targetStatus,
      notes: adminNotes,
      rejectionReason: actionType === 'REJECT' ? rejectionReason.trim() : undefined,
      transactionReference: actionType === 'MARK_PAID' ? transactionReference.trim() : undefined,
    });
  };

  return (
    <PageLayout
      title="Withdrawals & Payout Queue"
      description="Review and process earnings payout requests submitted by verified creators."
      action={
        <Button onClick={() => refetch()} variant="secondary" className="gap-2">
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      }
    >
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'All Requests', value: '' },
          { label: 'Pending Queue', value: 'PENDING' },
          { label: 'Approved Payouts', value: 'APPROVED' },
          { label: 'Completed / Paid', value: 'COMPLETED' },
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
            <Table headers={['Creator', 'Payout Method & Details', 'Requested Amount', 'Status', 'Requested Date', 'Actions']}>
              {requests.map((req: any) => (
                <TableRow key={req._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold overflow-hidden border border-rose-500/20">
                        {req.userId?.avatar ? (
                          <img src={req.userId.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-textMain-light dark:text-textMain-dark">
                          {req.userId?.name || 'Creator'}
                        </div>
                        <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                          {req.userId?.email || 'N/A'} • {req.userId?.phone || 'No Phone'}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <span className="font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark mr-2">
                        {req.paymentMethod || 'UPI'}
                      </span>
                      {req.paymentMethod === 'BANK_TRANSFER' && req.bankDetails ? (
                        <div className="text-xs font-mono mt-1 text-textMain-light dark:text-textMain-dark">
                          <div><strong>Acc:</strong> {req.bankDetails.accountName} ({req.bankDetails.accountNumber})</div>
                          <div><strong>IFSC:</strong> {req.bankDetails.ifscCode}</div>
                        </div>
                      ) : (
                        <span className="font-mono text-sm font-semibold text-primary">
                          {req.upiId || req.accountDetails || 'N/A'}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base font-mono">
                        ₹{req.amount}
                      </span>
                      <div className="text-[10px] text-textSecondary-light">Net Payout: ₹{req.netAmount || req.amount}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={getWithdrawalBadgeVariant(req.status)}>
                      {req.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    {format(new Date(req.requestedAt || req.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>

                  <TableCell>
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openActionModal(req, 'APPROVE')}
                          className="text-primary border-primary/30 hover:bg-primary/10 gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openActionModal(req, 'REJECT')}
                          className="text-danger border-danger/30 hover:bg-danger/10 gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    ) : req.status === 'APPROVED' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openActionModal(req, 'MARK_PAID')}
                          className="text-success border-success/30 hover:bg-success/10 gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Mark Paid
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openActionModal(req, 'REJECT')}
                          className="text-danger border-danger/30 hover:bg-danger/10 gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-textMuted-light dark:text-textMuted-dark italic">
                        {req.status === 'COMPLETED' ? `Ref: ${req.transactionReference || 'Completed'}` : `Reason: ${req.rejectionReason || 'N/A'}`}
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

      {/* Confirmation & Financial Action Modal */}
      <Modal
        isOpen={!!actionType}
        onClose={closeModal}
        title={`Payout Action: ${actionType}`}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={updateWithdrawalMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              isLoading={updateWithdrawalMutation.isPending}
              className={actionType === 'REJECT' ? 'bg-danger hover:bg-danger/90' : actionType === 'MARK_PAID' ? 'bg-success hover:bg-success/90' : ''}
            >
              Confirm {actionType}
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
            You are about to execute action <strong>{actionType}</strong> on withdrawal request of{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹{selectedReq?.amount}</strong> for{' '}
            <strong>{selectedReq?.userId?.name || 'Creator'}</strong>.
          </p>

          <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark text-xs space-y-1">
            <p><strong>Payment Method:</strong> {selectedReq?.paymentMethod || 'UPI'}</p>
            {selectedReq?.paymentMethod === 'BANK_TRANSFER' && selectedReq?.bankDetails ? (
              <>
                <p><strong>Account Name:</strong> {selectedReq.bankDetails.accountName}</p>
                <p><strong>Account Number:</strong> <span className="font-mono">{selectedReq.bankDetails.accountNumber}</span></p>
                <p><strong>IFSC Code:</strong> <span className="font-mono">{selectedReq.bankDetails.ifscCode}</span></p>
              </>
            ) : (
              <p><strong>UPI ID:</strong> <span className="font-mono text-primary">{selectedReq?.upiId || 'N/A'}</span></p>
            )}

            {actionType === 'REJECT' && (
              <p className="text-rose-500 font-semibold pt-1">
                * Rejecting this request will automatically refund ₹{selectedReq?.amount} back to the creator's available wallet balance.
              </p>
            )}
          </div>

          {actionType === 'REJECT' && (
            <div>
              <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-1">
                Rejection Reason <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm text-textMain-light dark:text-textMain-dark focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter rejection reason (e.g. Invalid UPI ID / Name mismatch)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          {actionType === 'MARK_PAID' && (
            <div>
              <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-1">
                Bank / UPI Transaction Reference <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm text-textMain-light dark:text-textMain-dark focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="e.g. UPI/32184918239 or BANK_REF_10294"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-1">
              Internal Admin Notes (Optional)
            </label>
            <textarea
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm text-textMain-light dark:text-textMain-dark focus:outline-none focus:ring-2 focus:ring-primary min-h-[60px] resize-none"
              placeholder="Enter optional notes..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};
