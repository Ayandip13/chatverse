import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card, CardContent } from '../../components/common/Card';
import { Table, TableRow, TableCell } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DollarSign, Clock, TrendingUp, Heart } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { format } from 'date-fns';

export const Settlements = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settlements', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await apiClient.get(`/admin/settlements?${params.toString()}`);
      return res.data;
    },
  });

  const settlements = data?.data || [];
  const meta = data?.meta || {};
  const summary = meta.summary || {};

  return (
    <PageLayout
      title="Financial Settlements & Commission Ledger"
      description="Real-time financial audit trail of chat session minute deductions, platform commissions, and creator earnings."
    >
      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-none shadow-card bg-surface-light dark:bg-surface-dark">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">
                Billed Chat Minutes
              </p>
              <h3 className="text-2xl font-bold text-textMain-light dark:text-textMain-dark mt-1">
                {summary.totalCompletedMinutes || 0} mins
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card bg-surface-light dark:bg-surface-dark">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">
                Gross Platform Volume
              </p>
              <h3 className="text-2xl font-bold text-textMain-light dark:text-textMain-dark mt-1">
                {(summary.totalGrossRevenue || 0).toLocaleString()} coins
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card bg-surface-light dark:bg-surface-dark">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">
                Platform Revenue (20%)
              </p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {(summary.totalPlatformCommission || 0).toLocaleString()} coins
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card bg-surface-light dark:bg-surface-dark">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">
                Creator Payouts (80%)
              </p>
              <h3 className="text-2xl font-bold text-rose-500 mt-1">
                {(summary.totalCreatorPayouts || 0).toLocaleString()} coins
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Heart className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Table */}
      <Card className="border-none shadow-card bg-surface-light dark:bg-surface-dark">
        <div className="p-4 border-b border-border-light dark:border-border-dark flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-textMain-light dark:text-textMain-dark">
            Session Settlements Audit Log
          </h2>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-sm text-textMain-light dark:text-textMain-dark focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PARTIAL">Partial</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-textSecondary-light dark:text-textSecondary-dark">
            Loading settlements...
          </div>
        ) : settlements.length === 0 ? (
          <div className="p-12 text-center text-textSecondary-light dark:text-textSecondary-dark">
            No settlement records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table headers={[
              'Boy Participant',
              'Girl Creator',
              'Completed Minutes',
              'Gross Volume',
              'Platform Revenue (20%)',
              'Creator Payout (80%)',
              'Settled Date',
              'Status'
            ]}>

              {settlements.map((item: any) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="font-semibold text-textMain-light dark:text-textMain-dark">
                      {item.boyId?.name || 'Boy'}
                    </div>
                    <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                      {item.boyId?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-rose-500">
                      {item.girlId?.name || 'Creator'}
                    </div>
                    <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                      {item.girlId?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-textMain-light dark:text-textMain-dark">
                      {item.completedMinutes} mins
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {item.grossCoins} coins
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      +{item.platformCommissionCoins} coins
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{item.girlEarningsCoins} coins
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                      {format(new Date(item.settledAt || item.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'COMPLETED' ? 'success' : 'danger'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-light dark:border-border-dark">
            <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
              Page {page} of {meta.totalPages} ({meta.total} records)
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
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageLayout>
  );
};
