import apiClient from "./apiClient";

export interface WalletSummaryData {
  currentBalance: number;
  lockedBalance: number;
  availableBalance: number;
  lifetimeEarnings: number;
  lifetimeWithdraw: number;
}

export interface BankDetailsData {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
}

export interface WithdrawalRecord {
  _id: string;
  userId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  paymentMethod: "UPI" | "BANK_TRANSFER";
  upiId?: string;
  bankDetails?: BankDetailsData;
  status:
    | "PENDING"
    | "APPROVED"
    | "PROCESSING"
    | "COMPLETED"
    | "REJECTED"
    | "CANCELLED";
  requestedAt: string;
  createdAt: string;
  reviewedAt?: string;
  paidAt?: Date | string;
  rejectionReason?: string;
  transactionReference?: string;
  notes?: string;
}

export interface RequestWithdrawalPayload {
  amount: number;
  paymentMethod: "UPI" | "BANK_TRANSFER";
  upiId?: string;
  bankDetails?: BankDetailsData;
}

export const withdrawalApi = {
  getSummary: async (): Promise<WalletSummaryData> => {
    const res = await apiClient.get("/withdrawals/summary");
    return res.data?.data;
  },

  getWithdrawals: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    data: WithdrawalRecord[];
    meta: {
      total: number;
      page: number;
      limit: number;
      summary?: WalletSummaryData;
    };
  }> => {
    const res = await apiClient.get("/withdrawals", { params });
    return res.data;
  },

  requestWithdrawal: async (
    payload: RequestWithdrawalPayload,
  ): Promise<WithdrawalRecord> => {
    const res = await apiClient.post("/withdrawals", payload);
    return res.data?.data;
  },

  cancelWithdrawal: async (requestId: string): Promise<WithdrawalRecord> => {
    const res = await apiClient.post(`/withdrawals/${requestId}/cancel`);
    return res.data?.data;
  },
};
