import { Document, Types } from 'mongoose';
import {
  Role,
  BoyStatus,
  GirlStatus,
  ChatRequestStatus,
  ChatStatus,
  WithdrawStatus,
  NotificationStatus,
  ReportStatus,
  RatingStatus,
  TransactionType,
} from '@/constants/enums.constant';

export interface IUser extends Document {
  email: string;
  password?: string;
  authProvider: 'LOCAL' | 'GOOGLE';
  role: Role;
  status: BoyStatus | GirlStatus;
  name: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  languagePreference?: string;
  notificationPreference?: boolean;
  tokenVersion: number;
  averageRating: number;
  totalRatings: number;
  verifiedByAdminId?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  statusReason?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdmin extends Document {
  email: string;
  password?: string;
  name: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWallet extends Document {
  userId: Types.ObjectId;
  currentBalance: number;
  lifetimeRecharge: number;
  lifetimeEarnings: number;
  lifetimeSpent: number;
  lifetimeWithdraw: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWalletTransaction extends Document {
  walletId: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  description?: string;
  referenceId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatRequest extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  status: ChatRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat extends Document {
  boyId: Types.ObjectId;
  girlId: Types.ObjectId;
  chatRequestId: Types.ObjectId;
  status: ChatStatus;
  startTime: Date;
  endTime?: Date;
  durationInMinutes: number;
  totalCost: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  body: string;
  status: NotificationStatus;
  type: string;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  targetId: Types.ObjectId;
  reason: string;
  notes?: string;
  status: ReportStatus;
  evidence?: string;
  resolvedById?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWithdrawRequest extends Document {
  userId: Types.ObjectId;
  amount: number;
  upiId: string;
  status: WithdrawStatus;
  processedById?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRating extends Document {
  chatId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  targetId: Types.ObjectId;
  score: number;
  comment?: string;
  status: RatingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFavorite extends Document {
  boyId: Types.ObjectId;
  girlId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlatformSetting extends Document {
  commissionPercentage: number;
  coinConversionRate: number; // e.g., 1 INR = 1 Coin
  coinsPerMinute: number; // e.g., 10 Coins
  minimumWithdrawalAmount: number;
  maximumRechargeAmount: number;
  isMaintenanceMode: boolean;
  isRegistrationEnabled: boolean;
  isGirlRegistrationEnabled: boolean;
  isBoyRegistrationEnabled: boolean;
  isGoogleLoginEnabled: boolean;
  isRazorpayEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
