import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, RefreshCcw, AlertCircle, ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

import apiClient from '../../api/apiClient';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';

export const Settings = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    commissionPercentage: 30,
    minimumWithdrawalAmount: 500,
    maximumRechargeAmount: 10000,
    isMaintenanceMode: false,
    isGirlRegistrationEnabled: true,
  });

  const { data: settingsData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/settings');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (settingsData) {
      setFormData({
        commissionPercentage: settingsData.commissionPercentage ?? 30,
        minimumWithdrawalAmount: settingsData.minimumWithdrawalAmount ?? 500,
        maximumRechargeAmount: settingsData.maximumRechargeAmount ?? 10000,
        isMaintenanceMode: !!settingsData.isMaintenanceMode,
        isGirlRegistrationEnabled: settingsData.isGirlRegistrationEnabled ?? true,
      });
    }
  }, [settingsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const response = await apiClient.patch('/settings', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Platform settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update platform settings');
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  if (isLoading) return <Loading className="min-h-screen" />;

  return (
    <PageLayout
      title="Platform Configuration"
      description="Manage platform commission rules, withdrawal limits, and system controls."
      action={
        <Button onClick={() => refetch()} variant="secondary" className="gap-2">
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {isError ? (
        <EmptyState
          icon={<AlertCircle className="w-12 h-12" />}
          title="Failed to load settings"
          description="Unable to fetch platform configuration."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      ) : (
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          <Card className="border-none shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                Financial Rules & Platform Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-2">
                    Platform Commission (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.commissionPercentage}
                    onChange={(e) => handleChange('commissionPercentage', Number(e.target.value))}
                  />
                  <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1 block">
                    Percentage retained by platform on each call.
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-2">
                    Min Withdrawal Limit (₹)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.minimumWithdrawalAmount}
                    onChange={(e) => handleChange('minimumWithdrawalAmount', Number(e.target.value))}
                  />
                  <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1 block">
                    Minimum earnings required for creator payout.
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-2">
                    Max Recharge Limit (₹)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.maximumRechargeAmount}
                    onChange={(e) => handleChange('maximumRechargeAmount', Number(e.target.value))}
                  />
                  <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1 block">
                    Maximum coin recharge allowed per transaction.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-warning" />
                System Maintenance & Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
                <div>
                  <p className="font-semibold text-textMain-light dark:text-textMain-dark">Creator Registrations</p>
                  <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                    Allow new creator applications on the Girls App.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('isGirlRegistrationEnabled', !formData.isGirlRegistrationEnabled)}
                  className="text-primary hover:opacity-80 transition-all"
                >
                  {formData.isGirlRegistrationEnabled ? (
                    <ToggleRight className="w-10 h-10 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
                <div>
                  <p className="font-semibold text-textMain-light dark:text-textMain-dark">Maintenance Mode</p>
                  <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                    Temporarily restrict user access for platform updates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('isMaintenanceMode', !formData.isMaintenanceMode)}
                  className="text-primary hover:opacity-80 transition-all"
                >
                  {formData.isMaintenanceMode ? (
                    <ToggleRight className="w-10 h-10 text-rose-500" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-400" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={updateSettingsMutation.isPending}
              className="gap-2 px-8"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </Button>
          </div>
        </form>
      )}
    </PageLayout>
  );
};
