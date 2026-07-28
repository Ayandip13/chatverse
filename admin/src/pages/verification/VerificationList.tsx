import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, RefreshCcw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import apiClient from '../../api/apiClient';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/common/Card';
import { Table, TableRow, TableCell } from '../../components/common/Table';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';
import { getAvatarUrl } from '../../utils/avatarUtil';
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

export const VerificationList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 10;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['verification-girls', page, limit, search, statusFilter],
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
      return response.data; // { success, data: [...], meta: { total } }
    },
    placeholderData: (prev) => prev,
  });

  const users = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <PageLayout
      title="Girl Verification"
      description="Review and verify newly registered girls."
      action={
        <Button onClick={() => refetch()} variant="secondary" className="gap-2">
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'All Girls', value: '' },
          { label: 'Pending Verification', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Suspended', value: 'SUSPENDED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${statusFilter === tab.value
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
              placeholder="Search by name or email..."
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
        {isLoading && !users.length ? (
          <Loading className="py-20" />
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle className="w-12 h-12" />}
            title="Failed to load verifications"
            description="There was a network error while fetching data. Please try again."
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        ) : users.length === 0 ? (
          <EmptyState
            title="No girls found"
            description={search || statusFilter ? "Try adjusting your search or filters." : "There are currently no girls registered or awaiting verification."}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Profile', 'Contact Info', 'Reg. Date', 'Status', 'Actions']}>
              {users.map((user: any) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                        <img src={getAvatarUrl(user.avatar, user.name)} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-semibold text-textMain-light dark:text-textMain-dark">{user.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-textMain-light dark:text-textMain-dark">{user.email}</div>
                      <div className="text-textSecondary-light dark:text-textSecondary-dark">{user.phone || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/verification/${user._id}`)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Review
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
              Showing page {page} of {totalPages}
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
