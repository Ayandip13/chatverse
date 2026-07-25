import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, RefreshCcw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
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

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'RESOLVED': return 'success';
    case 'PENDING': return 'warning';
    case 'REJECTED': return 'default';
    default: return 'default';
  }
};

export const Reports = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionNotes, setActionNotes] = useState('');
  const limit = 10;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-reports', page, limit, statusFilter],
    queryFn: async () => {
      const response = await apiClient.get('/admin/reports', {
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

  const resolveReportMutation = useMutation({
    mutationFn: async (payload: { reportId: string; status: string; notes: string }) => {
      const response = await apiClient.patch(`/admin/reports/${payload.reportId}`, {
        status: payload.status,
        notes: payload.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Report status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(null);
      setActionNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update report status');
    },
  });

  const reports = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleResolveAction = (status: 'RESOLVED' | 'REJECTED') => {
    if (!selectedReport) return;
    resolveReportMutation.mutate({
      reportId: selectedReport._id,
      status,
      notes: actionNotes,
    });
  };

  return (
    <PageLayout
      title="User Reports & Moderation"
      description="Review user-submitted violation reports and take moderation actions."
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
          { label: 'All Reports', value: '' },
          { label: 'Pending Review', value: 'PENDING' },
          { label: 'Resolved', value: 'RESOLVED' },
          { label: 'Dismissed', value: 'REJECTED' },
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
        {isLoading && !reports.length ? (
          <Loading className="py-20" />
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle className="w-12 h-12" />}
            title="Failed to load reports"
            description="Unable to fetch report queue. Please try again."
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        ) : reports.length === 0 ? (
          <EmptyState
            title="No reports found"
            description={statusFilter ? 'No reports match your current filter.' : 'The moderation queue is clear.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Reporter', 'Reported Target', 'Reason', 'Reported On', 'Status', 'Action']}>
              {reports.map((report: any) => (
                <TableRow key={report._id}>
                  <TableCell>
                    <div className="text-sm font-medium text-textMain-light dark:text-textMain-dark">
                      {report.reporterId?.name || report.reporterId || 'Anonymous'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-danger">
                      {report.targetId?.name || report.targetId || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="text-sm font-semibold text-textMain-light dark:text-textMain-dark">{report.reason}</div>
                    {report.notes && (
                      <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark truncate">
                        "{report.notes}"
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    {format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(report.status)}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      className="gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Inspect
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
              Showing page {page} of {totalPages} ({total} reports)
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

      {/* Inspect & Action Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title="Report Details & Resolution"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setSelectedReport(null)}>
              Close
            </Button>
            {selectedReport?.status === 'PENDING' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleResolveAction('REJECTED')}
                  isLoading={resolveReportMutation.isPending}
                  className="text-danger border-danger/30 gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Dismiss Report
                </Button>
                <Button
                  onClick={() => handleResolveAction('RESOLVED')}
                  isLoading={resolveReportMutation.isPending}
                  className="gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Resolved
                </Button>
              </>
            )}
          </div>
        }
      >
        {selectedReport && (
          <div className="space-y-4 pt-2 text-sm">
            <div className="grid grid-cols-2 gap-4 p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
              <div>
                <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark block">Reporter</span>
                <span className="font-semibold text-textMain-light dark:text-textMain-dark">
                  {selectedReport.reporterId?.name || selectedReport.reporterId}
                </span>
              </div>
              <div>
                <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark block">Reported Target</span>
                <span className="font-semibold text-danger">
                  {selectedReport.targetId?.name || selectedReport.targetId}
                </span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-textMain-light dark:text-textMain-dark block mb-1">Reason:</span>
              <p className="p-3 bg-amber-500/10 text-amber-900 dark:text-amber-200 rounded-xl font-medium">
                {selectedReport.reason}
              </p>
            </div>

            {selectedReport.notes && (
              <div>
                <span className="font-semibold text-textMain-light dark:text-textMain-dark block mb-1">Notes / Description:</span>
                <p className="text-textSecondary-light dark:text-textSecondary-dark italic">
                  "{selectedReport.notes}"
                </p>
              </div>
            )}

            <div>
              <label className="font-semibold text-textMain-light dark:text-textMain-dark block mb-1">
                Resolution Action Notes:
              </label>
              <textarea
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm text-textMain-light dark:text-textMain-dark focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-none"
                placeholder="Enter resolution notes..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};
