import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User as UserIcon, Mail, ShieldCheck, Calendar, Save, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';

export const Profile = () => {
  const queryClient = useQueryClient();
  const { user: authUser, setAuth, accessToken, refreshToken } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const { data: userProfile, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-profile-me'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { name: string; phone?: string }) => {
      const response = await apiClient.patch('/users/me', payload);
      return response.data.data;
    },
    onSuccess: (updatedUser) => {
      toast.success('Profile updated successfully!');
      if (authUser && accessToken && refreshToken) {
        setAuth({ ...authUser, name: updatedUser.name }, accessToken, refreshToken);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-profile-me'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    updateProfileMutation.mutate({ name, phone });
  };

  if (isLoading) return <Loading className="min-h-screen" />;

  const profile = userProfile || authUser;

  return (
    <PageLayout
      title="Admin Account Profile"
      description="View administrator profile details and credentials."
      action={
        <Button onClick={() => refetch()} variant="secondary" className="gap-2">
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        {/* Left Card */}
        <Card className="col-span-1 border-none shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-3xl mb-4 uppercase">
                {profile?.name?.charAt(0) || 'A'}
              </div>
              <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark">{profile?.name}</h2>
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                {profile?.role || 'ADMIN'}
              </span>
            </div>

            <div className="mt-6 space-y-4 pt-4 border-t border-border-light dark:border-border-dark text-sm">
              <div className="flex items-center gap-3 text-textSecondary-light dark:text-textSecondary-dark">
                <Mail className="w-4 h-4 text-primary" />
                <span>{profile?.email}</span>
              </div>
              {profile?.createdAt && (
                <div className="flex items-center gap-3 text-textSecondary-light dark:text-textSecondary-dark">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Joined {format(new Date(profile.createdAt), 'MMMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Form Card */}
        <Card className="col-span-1 lg:col-span-2 border-none shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              Edit Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-2">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin Name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-2">
                  Email Address
                </label>
                <Input
                  value={profile?.email || ''}
                  disabled
                  className="bg-surface-light/50 dark:bg-surface-dark/50 cursor-not-allowed opacity-70"
                />
                <span className="text-xs text-textMuted-light dark:text-textMuted-dark mt-1 block">
                  Admin email address is fixed for security identification.
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-2">
                  Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  isLoading={updateProfileMutation.isPending}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Update Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};
