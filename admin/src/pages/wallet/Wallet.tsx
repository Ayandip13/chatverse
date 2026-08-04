import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet as WalletIcon,
  RefreshCcw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { format } from "date-fns";

import apiClient from "../../api/apiClient";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/common/Card";
import { Table, TableRow, TableCell } from "../../components/common/Table";
import { Badge, type BadgeVariant } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { EmptyState } from "../../components/common/EmptyState";

const getTransactionBadgeVariant = (type: string): BadgeVariant => {
  switch (type) {
    case "RECHARGE":
    case "GIRL_EARNING":
      return "success";
    case "CHAT_DEBIT":
    case "WITHDRAWAL":
      return "warning";
    case "REFUND":
      return "danger";
    default:
      return "default";
  }
};

export const Wallet = () => {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const limit = 10;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-wallet-transactions", page, limit, typeFilter],
    queryFn: async () => {
      const response = await apiClient.get("/admin/transactions", {
        params: {
          page,
          limit,
          type: typeFilter || undefined,
        },
      });
      return response.data;
    },
    placeholderData: (prev) => prev,
  });

  const transactions = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <PageLayout
      title="Wallet & Transactions Audit"
      description="Inspect all financial transactions, coin recharges, earnings, and refunds."
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
          { label: "All Transactions", value: "" },
          { label: "Recharges", value: "RECHARGE" },
          { label: "Girl Earnings", value: "GIRL_EARNING" },
          { label: "Chat Debits", value: "CHAT_DEBIT" },
          { label: "Withdrawals", value: "WITHDRAWAL" },
          { label: "Refunds", value: "REFUND" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setTypeFilter(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              typeFilter === tab.value
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-light dark:bg-surface-dark text-textSecondary-light dark:text-textSecondary-dark hover:bg-surface-light/80 border border-border-light dark:border-border-dark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="border-none shadow-card overflow-hidden">
        {isLoading && !transactions.length ? (
          <Loading className="py-20" />
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle className="w-12 h-12" />}
            title="Failed to load transaction audit log"
            description="Unable to fetch transactions. Please try again."
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={
              <WalletIcon className="w-10 h-10 text-textMuted-light dark:text-textMuted-dark" />
            }
            title="No transactions found"
            description={
              typeFilter
                ? "No transactions match the selected type."
                : "No financial transactions logged yet."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={["User", "Type", "Amount", "Description", "Timestamp"]}
            >
              {transactions.map((tx: any) => (
                <TableRow key={tx._id}>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold text-textMain-light dark:text-textMain-dark">
                        {tx.userId?.name || tx.userId || "Unknown User"}
                      </div>
                      <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
                        {tx.userId?.email || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTransactionBadgeVariant(tx.type)}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`flex items-center gap-1 font-bold text-sm ${
                        ["RECHARGE", "GIRL_EARNING", "REFUND"].includes(tx.type)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {["RECHARGE", "GIRL_EARNING", "REFUND"].includes(
                        tx.type,
                      ) ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                      <span>₹{tx.amount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="text-sm text-textMain-light dark:text-textMain-dark truncate">
                      {tx.description || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                    {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-light dark:border-border-dark">
            <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
              Showing page {page} of {totalPages} ({total} transactions)
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
