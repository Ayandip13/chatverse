import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RefreshCcw,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { safeFormatDate } from "../../utils/dateUtils";

import apiClient from "../../api/apiClient";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/common/Card";
import { Table, TableRow, TableCell } from "../../components/common/Table";
import { Badge, type BadgeVariant } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Loading } from "../../components/common/Loading";
import { EmptyState } from "../../components/common/EmptyState";
import { Modal } from "../../components/common/Modal";

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "warning";
    case "BANNED":
      return "danger";
    default:
      return "default";
  }
};

export const Users = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-users-boys", page, limit, search, statusFilter],
    queryFn: async () => {
      const response = await apiClient.get("/admin/users", {
        params: {
          role: "BOY",
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

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: {
      userId: string;
      status: string;
      reason: string;
    }) => {
      const response = await apiClient.patch(
        `/admin/users/${payload.userId}/status`,
        {
          status: payload.status,
          reason: payload.reason,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(`User status updated to ${targetStatus}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-boys"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-metrics"] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    },
  });

  const openActionModal = (user: any, status: string) => {
    setSelectedUser(user);
    setTargetStatus(status);
    setReason("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setTargetStatus("");
    setReason("");
  };

  const handleConfirmAction = () => {
    if (!selectedUser || !targetStatus) return;
    if (
      (targetStatus === "SUSPENDED" || targetStatus === "BANNED") &&
      !reason.trim()
    ) {
      toast.error("Reason is required for this action");
      return;
    }
    updateStatusMutation.mutate({
      userId: selectedUser._id,
      status: targetStatus,
      reason,
    });
  };

  const users = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <PageLayout
      title="User Management (Boys)"
      description="View, filter, and manage all registered boys on the platform."
      action={
        <Button onClick={() => refetch()} variant="secondary" className="gap-2">
          <RefreshCcw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
    >
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: "All Boys", value: "" },
          { label: "Active", value: "ACTIVE" },
          { label: "Suspended", value: "SUSPENDED" },
          { label: "Banned", value: "BANNED" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              statusFilter === tab.value
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-light dark:bg-surface-dark text-textSecondary-light dark:text-textSecondary-dark hover:bg-surface-light/80 border border-border-light dark:border-border-dark"
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
            title="Failed to load users"
            description="Unable to connect to server. Please try again."
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        ) : users.length === 0 ? (
          <EmptyState
            title="No boys found"
            description={
              search || statusFilter
                ? "Try adjusting your search or filter criteria."
                : "No registered boys available."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={[
                "User Details",
                "Contact",
                "Joined Date",
                "Status",
                "Actions",
              ]}
            >
              {users.map((user: any) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm uppercase">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-textMain-light dark:text-textMain-dark">
                          {user.name}
                        </div>
                        <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                          {user.role}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-textMain-light dark:text-textMain-dark">
                        {user.email}
                      </div>
                      <div className="text-textSecondary-light dark:text-textSecondary-dark">
                        {user.phone || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{safeFormatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.status === "ACTIVE" ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openActionModal(user, "SUSPENDED")}
                            className="text-warning border-warning/30 hover:bg-warning/10 gap-1"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Suspend
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openActionModal(user, "BANNED")}
                            className="text-danger border-danger/30 hover:bg-danger/10 gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Ban
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openActionModal(user, "ACTIVE")}
                          className="text-success border-success/30 hover:bg-success/10 gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-light dark:border-border-dark">
            <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
              Showing page {page} of {totalPages} ({total} total users)
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

      {/* Action Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`Change Status: ${targetStatus}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeModal}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              isLoading={updateStatusMutation.isPending}
              className={
                targetStatus === "BANNED"
                  ? "bg-danger hover:bg-danger/90"
                  : targetStatus === "SUSPENDED"
                    ? "bg-warning hover:bg-warning/90"
                    : ""
              }
            >
              Confirm {targetStatus}
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-4">
          <p className="text-textSecondary-light dark:text-textSecondary-dark">
            You are about to change <strong>{selectedUser?.name}</strong>'s
            status to{" "}
            <Badge variant={getStatusBadgeVariant(targetStatus)}>
              {targetStatus}
            </Badge>
            .
          </p>
          <div>
            <label className="text-sm font-medium text-textMain-light dark:text-textMain-dark block mb-2">
              Reason / Admin Notes{" "}
              {targetStatus !== "ACTIVE" && (
                <span className="text-danger">*</span>
              )}
            </label>
            <textarea
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm text-textMain-light dark:text-textMain-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] resize-none"
              placeholder="Enter reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};
