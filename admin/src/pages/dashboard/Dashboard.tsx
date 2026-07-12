import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  UserCheck, 
  MessageCircle, 
  Activity, 
  Wallet, 
  CreditCard,
  RefreshCcw,
  ShieldAlert,
  Settings,
  AlertCircle,
  Database,
  Server
} from 'lucide-react';
import { format } from 'date-fns';

import apiClient from '../../api/apiClient';
import { PageLayout } from '../../components/layout/PageLayout';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { ChartPlaceholder } from '../../components/dashboard/ChartPlaceholder';
import { QuickActionCard } from '../../components/dashboard/QuickActionCard';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Table, TableRow, TableCell } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';

export const Dashboard = () => {
  // Fetch Dashboard Metrics
  const { 
    data: metricsResponse, 
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
    isFetching: isFetchingMetrics
  } = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard');
      return response.data.data;
    },
    refetchInterval: 60000, // Auto refetch every minute
  });

  // Fetch Recent Registrations (Girls)
  const { data: recentGirls, isLoading: isLoadingGirls } = useQuery({
    queryKey: ['recent-girls'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users', {
        params: { role: 'GIRL', limit: 5 }
      });
      return response.data.data;
    },
  });

  // Fetch Recent Withdrawals
  const { data: recentWithdrawals, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['recent-withdrawals'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/withdrawals', {
        params: { limit: 5 }
      });
      return response.data.data;
    },
  });

  const metrics = metricsResponse || {};

  const handleRefresh = () => {
    refetchMetrics();
  };

  return (
    <PageLayout
      title="Platform Overview"
      description="Monitor key metrics, user activity, and system health."
      action={
        <Button onClick={handleRefresh} variant="secondary" className="gap-2">
          <RefreshCcw className={`w-4 h-4 ${isFetchingMetrics ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      }
    >
      {/* System Status Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
          <Server className="w-5 h-5 text-success" />
          <div>
            <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">Backend API</p>
            <p className="text-sm font-semibold text-textMain-light dark:text-textMain-dark">Operational</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
          <Database className="w-5 h-5 text-success" />
          <div>
            <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">Database</p>
            <p className="text-sm font-semibold text-textMain-light dark:text-textMain-dark">Connected</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">Commission Rate</p>
            <p className="text-sm font-semibold text-textMain-light dark:text-textMain-dark">30% (Standard)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
          <Settings className="w-5 h-5 text-textMuted-light dark:text-textMuted-dark" />
          <div>
            <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">Maintenance Mode</p>
            <p className="text-sm font-semibold text-textMain-light dark:text-textMain-dark">Disabled</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        <KpiCard 
          title="Total Boys" 
          value={metrics.totalBoys} 
          icon={<Users />} 
          isLoading={isLoadingMetrics}
        />
        <KpiCard 
          title="Total Girls" 
          value={metrics.totalGirls} 
          icon={<UserCheck />} 
          isLoading={isLoadingMetrics}
        />
        <KpiCard 
          title="Pending Verification" 
          value={metrics.pendingGirls} 
          icon={<ShieldAlert />} 
          isLoading={isLoadingMetrics}
        />
        <KpiCard 
          title="Active Chats" 
          value={metrics.activeChats} 
          icon={<MessageCircle />} 
          isLoading={isLoadingMetrics}
        />
        <KpiCard 
          title="Pending Withdrawals" 
          value={metrics.pendingWithdrawals} 
          icon={<CreditCard />} 
          isLoading={isLoadingMetrics}
        />
        <KpiCard 
          title="Total Revenue" 
          value={metrics.totalRevenue ? `₹${metrics.totalRevenue}` : '₹0'} 
          icon={<Wallet />} 
          isLoading={isLoadingMetrics}
        />
        <KpiCard 
          title="Today's Revenue" 
          value="₹0" // Placeholder until backend supports daily aggregate
          icon={<Wallet />} 
          isLoading={isLoadingMetrics}
        />
        <KpiCard 
          title="Online Girls" 
          value="0" // Placeholder until redis presence is merged
          icon={<Activity />} 
          isLoading={isLoadingMetrics}
        />
        <KpiCard 
          title="Online Boys" 
          value="0" // Placeholder until redis presence is merged
          icon={<Users />} 
          isLoading={isLoadingMetrics}
        />
        <KpiCard 
          title="Total Recharges" 
          value="N/A" // Placeholder 
          icon={<CreditCard />} 
          isLoading={isLoadingMetrics}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-textMain-light dark:text-textMain-dark mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard 
            title="Verify Girls" 
            description="Review and approve pending verification requests."
            icon={<ShieldAlert />}
            route="/verification"
            badgeCount={metrics.pendingGirls}
          />
          <QuickActionCard 
            title="Withdrawals" 
            description="Process pending withdrawal requests from girls."
            icon={<CreditCard />}
            route="/withdrawals"
            badgeCount={metrics.pendingWithdrawals}
          />
          <QuickActionCard 
            title="User Management" 
            description="Search, edit, and manage all platform users."
            icon={<Users />}
            route="/users"
          />
          <QuickActionCard 
            title="Reports & Appeals" 
            description="Review user reports and content moderation."
            icon={<AlertCircle />}
            route="/reports"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartPlaceholder 
          title="Revenue Trend" 
          description="Daily and monthly platform earnings" 
        />
        <ChartPlaceholder 
          title="User Growth" 
          description="New registrations over the past 30 days" 
        />
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Registrations (Girls)</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/girls'}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingGirls ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface-dark/5 animate-pulse rounded-md" />)}
              </div>
            ) : recentGirls?.length ? (
              <Table headers={['User', 'Date', 'Status']}>
                {recentGirls.map((user: any) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="font-medium text-textMain-light dark:text-textMain-dark">{user.name}</div>
                      <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">{user.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'PENDING' ? 'warning' : user.status === 'APPROVED' ? 'success' : 'default'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            ) : (
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark text-center py-4">
                No recent registrations.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Withdrawals</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/withdrawals'}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingWithdrawals ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface-dark/5 animate-pulse rounded-md" />)}
              </div>
            ) : recentWithdrawals?.length ? (
              <Table headers={['User ID', 'Amount', 'Status']}>
                {recentWithdrawals.map((req: any) => (
                  <TableRow key={req._id}>
                    <TableCell>
                      <div className="font-medium text-textMain-light dark:text-textMain-dark truncate max-w-[120px]">
                        {req.userId?.name || req.userId || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      ₹{req.amount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={req.status === 'PENDING' ? 'warning' : req.status === 'COMPLETED' || req.status === 'APPROVED' ? 'success' : 'danger'}>
                        {req.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            ) : (
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark text-center py-4">
                No recent withdrawal requests.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};
