import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, RefreshCcw, AlertCircle, Star } from 'lucide-react';
import { format } from 'date-fns';

import apiClient from '../../api/apiClient';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/common/Card';
import { Table, TableRow, TableCell } from '../../components/common/Table';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'PENDING': return 'warning';
    case 'REJECTED':
    case 'BANNED': return 'danger';
    case 'SUSPENDED': return 'warning';
    default: return 'default';
  }
};

export const Girls = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 10;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-girls-list', page, limit, search, statusFilter],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users', {
        params: {
          role: 'GIRL',
          page,
          limit,
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      return response.data;
    },
    placeholderData: (prev) => prev,
  });

  const girls = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <PageLayout
      title="Girls Management"
      description="View, verify, and inspect all creator profiles on the platform."
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
          { label: 'All Girls', value: '' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Pending Verification', value: 'PENDING' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Suspended', value: 'SUSPENDED' },
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

      <Card className="p-4 border-none shadow-card mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <div className="relative">
            <Input
              placeholder="Search by creator name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
            <Search className="w-5 h-5 text-textMuted-light dark:text-textMuted-dark absolute left-3 top-2.5" />
          </div>
        </div>
      </Card>

      <Card className="border-none shadow-card overflow-hidden">
        {isLoading && !girls.length ? (
          <Loading className="py-20" />
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle className="w-12 h-12" />}
            title="Failed to load creator girls"
            description="Unable to fetch data. Please try again."
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        ) : girls.length === 0 ? (
          <EmptyState
            title="No creator girls found"
            description={search || statusFilter ? 'Try adjusting search or filter options.' : 'No creators registered yet.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Creator Profile', 'Contact', 'Rating', 'Joined Date', 'Status', 'Action']}>
              {girls.map((girl: any) => (
                <TableRow key={girl._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-500/10 overflow-hidden flex-shrink-0 border border-pink-500/30">
                        {girl.avatar ? (
                          <img src={girl.avatar} alt={girl.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-pink-500 font-bold text-sm uppercase">
                            {girl.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-textMain-light dark:text-textMain-dark">{girl.name}</div>
                        {girl.bio && (
                          <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark truncate max-w-[200px]">
                            "{girl.bio}"
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-textMain-light dark:text-textMain-dark">{girl.email}</div>
                      <div className="text-textSecondary-light dark:text-textSecondary-dark">{girl.phone || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm font-semibold text-textMain-light dark:text-textMain-dark">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{girl.averageRating ? girl.averageRating.toFixed(1) : '0.0'}</span>
                      <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark font-normal">
                        ({girl.totalRatings || 0})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(girl.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(girl.status)}>
                      {girl.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/verification/${girl._id}`)}
                      className="gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
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
              Showing page {page} of {totalPages} ({total} creators)
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
    </PageLayout>
  );
};
