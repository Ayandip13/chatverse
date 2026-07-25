import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, ShieldOff, Calendar, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import apiClient from '../../api/apiClient';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';

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

export const VerificationDetail = () => {
  const { girlId } = useParams<{ girlId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['user-details', girlId],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/users/${girlId}`);
      return response.data.data;
    },
    enabled: !!girlId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: { status: string; reason: string }) => {
      const response = await apiClient.patch(`/admin/users/${girlId}/status`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success(`User status updated to ${actionType}`);
      queryClient.invalidateQueries({ queryKey: ['user-details', girlId] });
      queryClient.invalidateQueries({ queryKey: ['verification-girls'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const openModal = (type: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED') => {
    setActionType(type);
    setAdminNotes('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActionType(null);
    setAdminNotes('');
  };

  const handleConfirm = () => {
    if (!actionType) return;
    if ((actionType === 'REJECTED' || actionType === 'SUSPENDED' || actionType === 'BANNED') && !adminNotes.trim()) {
      toast.error('Admin notes are required for this action.');
      return;
    }
    updateStatusMutation.mutate({ status: actionType, reason: adminNotes });
  };

  if (isLoading) return <Loading className="min-h-screen" />;
  if (isError || !data) {
    return (
      <EmptyState
        title="Girl Not Found"
        description="The verification profile you are looking for does not exist or failed to load."
        action={<Button onClick={() => navigate('/verification')}>Back to List</Button>}
      />
    );
  }

  const user = data;
  const isPending = user.status === 'PENDING';
  const isApproved = user.status === 'APPROVED';

  return (
    <PageLayout
      title="Verification Details"
      description="Review profile information and take verification action."
      action={
        <Button variant="secondary" onClick={() => navigate('/verification')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Summary */}
        <Card className="col-span-1 border-none shadow-card h-max">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-primary/10 overflow-hidden mb-4 border-4 border-surface-light dark:border-surface-dark shadow-md">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold text-4xl uppercase">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark">{user.name}</h2>
              <Badge variant={getStatusBadgeVariant(user.status)} className="mt-2">
                {user.status}
              </Badge>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-textSecondary-light dark:text-textSecondary-dark">
                <Mail className="w-5 h-5 text-primary" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-textSecondary-light dark:text-textSecondary-dark">
                <Phone className="w-5 h-5 text-primary" />
                <span>{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-textSecondary-light dark:text-textSecondary-dark">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Joined {format(new Date(user.createdAt), 'MMMM d, yyyy')}</span>
              </div>
            </div>

            {/* Quick Actions based on status */}
            <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark space-y-3">
              <h3 className="text-sm font-semibold text-textMain-light dark:text-textMain-dark uppercase tracking-wider mb-4">
                Admin Actions
              </h3>
              
              {isPending && (
                <>
                  <Button className="w-full gap-2" onClick={() => openModal('APPROVED')}>
                    <CheckCircle className="w-4 h-4" />
                    Approve Verification
                  </Button>
                  <Button variant="secondary" className="w-full gap-2 text-danger border-danger/50 hover:bg-danger/10" onClick={() => openModal('REJECTED')}>
                    <XCircle className="w-4 h-4" />
                    Reject Application
                  </Button>
                </>
              )}

              {isApproved && (
                <>
                  <Button variant="secondary" className="w-full gap-2 text-warning border-warning/50 hover:bg-warning/10" onClick={() => openModal('SUSPENDED')}>
                    <AlertTriangle className="w-4 h-4" />
                    Suspend Account
                  </Button>
                  <Button variant="secondary" className="w-full gap-2 text-danger border-danger/50 hover:bg-danger/10" onClick={() => openModal('BANNED')}>
                    <ShieldOff className="w-4 h-4" />
                    Ban Permanently
                  </Button>
                </>
              )}

              {(user.status === 'SUSPENDED' || user.status === 'REJECTED' || user.status === 'BANNED') && (
                <Button className="w-full gap-2" onClick={() => openModal('APPROVED')}>
                  <CheckCircle className="w-4 h-4" />
                  Restore / Approve
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Details */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card className="border-none shadow-card">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">Bio</h4>
                  <p className="mt-2 text-textMain-light dark:text-textMain-dark whitespace-pre-wrap">
                    {user.bio || 'No bio provided.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">Role</h4>
                    <p className="mt-1 font-medium text-textMain-light dark:text-textMain-dark">{user.role}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">Platform Rating</h4>
                    <p className="mt-1 font-medium text-textMain-light dark:text-textMain-dark">
                      {user.averageRating ? `${user.averageRating.toFixed(1)} ⭐ (${user.totalRatings} ratings)` : 'No ratings yet'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit & Verification History */}
          <Card className="border-none shadow-card">
            <CardHeader>
              <CardTitle>Audit & Verification Info</CardTitle>
            </CardHeader>
            <CardContent>
              {user.verifiedAt || user.rejectionReason || user.statusReason ? (
                <div className="space-y-4 text-sm">
                  {user.verifiedAt && (
                    <div className="flex justify-between py-2 border-b border-border-light dark:border-border-dark">
                      <span className="text-textSecondary-light dark:text-textSecondary-dark font-medium">Last Verification Action</span>
                      <span className="text-textMain-light dark:text-textMain-dark font-semibold">
                        {format(new Date(user.verifiedAt), 'PPP p')}
                      </span>
                    </div>
                  )}
                  {user.verifiedByAdminId && (
                    <div className="flex justify-between py-2 border-b border-border-light dark:border-border-dark">
                      <span className="text-textSecondary-light dark:text-textSecondary-dark font-medium">Verified By Admin</span>
                      <span className="text-textMain-light dark:text-textMain-dark font-mono font-semibold">
                        {user.verifiedByAdminId}
                      </span>
                    </div>
                  )}
                  {(user.rejectionReason || user.statusReason) && (
                    <div className="py-2">
                      <span className="text-textSecondary-light dark:text-textSecondary-dark font-medium block mb-1">
                        Reason / Notes:
                      </span>
                      <p className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 rounded-xl font-medium leading-relaxed">
                        {user.rejectionReason || user.statusReason}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState 
                  title="No Verification Notes" 
                  description="This account has not had verification notes or status reason recorded yet." 
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`Confirm Action: ${actionType}`}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={updateStatusMutation.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              isLoading={updateStatusMutation.isPending}
              className={actionType === 'REJECTED' || actionType === 'BANNED' ? 'bg-danger hover:bg-danger/90' : actionType === 'SUSPENDED' ? 'bg-warning hover:bg-warning/90' : ''}
            >
              Confirm {actionType}
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-4">
          <p className="text-textSecondary-light dark:text-textSecondary-dark">
            You are about to change the status of <strong>{user.name}</strong> to <Badge variant={actionType ? getStatusBadgeVariant(actionType) : 'default'}>{actionType}</Badge>.
          </p>
          <div className="pt-2">
            <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-2">
              Admin Notes {actionType !== 'APPROVED' && <span className="text-danger">*</span>}
            </label>
            <textarea
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm text-textMain-light dark:text-textMain-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] resize-none"
              placeholder="Enter reason or verification notes..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};
