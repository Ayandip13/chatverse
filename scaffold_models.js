const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const constantsDir = path.join(backendDir, 'src', 'constants');
const typesDir = path.join(backendDir, 'src', 'types');
const modelsDir = path.join(backendDir, 'src', 'models');

if (!fs.existsSync(constantsDir)) fs.mkdirSync(constantsDir, { recursive: true });
if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir, { recursive: true });
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

const files = {
  'src/constants/enums.constant.ts': `export enum Role {
  BOY = 'BOY',
  GIRL = 'GIRL',
}

export enum BoyStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum GirlStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum ChatRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum ChatStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

export enum WithdrawStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum RatingStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

export enum TransactionType {
  RECHARGE = 'RECHARGE',
  CHAT_DEBIT = 'CHAT_DEBIT',
  GIRL_EARNING = 'GIRL_EARNING',
  WITHDRAWAL = 'WITHDRAWAL',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
  REFUND = 'REFUND',
  BONUS = 'BONUS',
}
`,
  'src/types/models.type.ts': `import { Document, Types } from 'mongoose';
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
  tokenVersion: number;
  averageRating: number;
  totalRatings: number;
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
  minimumWithdrawalAmount: number;
  maximumRechargeAmount: number;
  isMaintenanceMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}
`,
  'src/models/user.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IUser } from '@/types/models.type';
import { Role, BoyStatus, GirlStatus } from '@/constants/enums.constant';

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, select: false },
    authProvider: {
      type: String,
      enum: ['LOCAL', 'GOOGLE'],
      default: 'LOCAL',
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
    status: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          if (this.role === Role.BOY) {
            return Object.values(BoyStatus).includes(v as BoyStatus);
          }
          return Object.values(GirlStatus).includes(v as GirlStatus);
        },
        message: 'Invalid status for the given role.',
      },
    },
    name: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },
    bio: { type: String },
    tokenVersion: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
`,
  'src/models/admin.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IAdmin } from '@/types/models.type';

const AdminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, select: false, required: true },
    name: { type: String, required: true },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AdminSchema.index({ email: 1 }, { unique: true });

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
`,
  'src/models/wallet.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IWallet } from '@/types/models.type';

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentBalance: { type: Number, default: 0 },
    lifetimeRecharge: { type: Number, default: 0 },
    lifetimeEarnings: { type: Number, default: 0 },
    lifetimeSpent: { type: Number, default: 0 },
    lifetimeWithdraw: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WalletSchema.index({ userId: 1 }, { unique: true });

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
`,
  'src/models/walletTransaction.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IWalletTransaction } from '@/types/models.type';
import { TransactionType } from '@/constants/enums.constant';

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, type: 1 });

export const WalletTransaction = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  WalletTransactionSchema
);
`,
  'src/models/chatRequest.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IChatRequest } from '@/types/models.type';
import { ChatRequestStatus } from '@/constants/enums.constant';

const ChatRequestSchema = new Schema<IChatRequest>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(ChatRequestStatus),
      default: ChatRequestStatus.PENDING,
    },
  },
  { timestamps: true }
);

ChatRequestSchema.index({ senderId: 1, status: 1 });
ChatRequestSchema.index({ receiverId: 1, status: 1 });

export const ChatRequest = mongoose.model<IChatRequest>('ChatRequest', ChatRequestSchema);
`,
  'src/models/chat.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IChat } from '@/types/models.type';
import { ChatStatus } from '@/constants/enums.constant';

const ChatSchema = new Schema<IChat>(
  {
    boyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    girlId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chatRequestId: { type: Schema.Types.ObjectId, ref: 'ChatRequest', required: true },
    status: {
      type: String,
      enum: Object.values(ChatStatus),
      default: ChatStatus.ACTIVE,
    },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    durationInMinutes: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ChatSchema.index({ boyId: 1, status: 1 });
ChatSchema.index({ girlId: 1, status: 1 });

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);
`,
  'src/models/message.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IMessage } from '@/types/models.type';

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
`,
  'src/models/notification.model.ts': `import mongoose, { Schema } from 'mongoose';
import { INotification } from '@/types/models.type';
import { NotificationStatus } from '@/constants/enums.constant';

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.UNREAD,
    },
    type: { type: String, required: true },
    actionUrl: { type: String },
  },
  { timestamps: true }
);

// TTL Index to automatically delete read or old notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
NotificationSchema.index({ userId: 1, status: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
`,
  'src/models/report.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IReport } from '@/types/models.type';
import { ReportStatus } from '@/constants/enums.constant';

const ReportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
    },
    evidence: { type: String },
    resolvedById: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

ReportSchema.index({ targetId: 1, status: 1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
`,
  'src/models/withdrawRequest.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IWithdrawRequest } from '@/types/models.type';
import { WithdrawStatus } from '@/constants/enums.constant';

const WithdrawRequestSchema = new Schema<IWithdrawRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    upiId: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(WithdrawStatus),
      default: WithdrawStatus.PENDING,
    },
    processedById: { type: Schema.Types.ObjectId, ref: 'Admin' },
    notes: { type: String },
  },
  { timestamps: true }
);

WithdrawRequestSchema.index({ userId: 1, status: 1 });
WithdrawRequestSchema.index({ status: 1, createdAt: 1 });

export const WithdrawRequest = mongoose.model<IWithdrawRequest>(
  'WithdrawRequest',
  WithdrawRequestSchema
);
`,
  'src/models/rating.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IRating } from '@/types/models.type';
import { RatingStatus } from '@/constants/enums.constant';

const RatingSchema = new Schema<IRating>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(RatingStatus),
      default: RatingStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

RatingSchema.index({ chatId: 1, reviewerId: 1 }, { unique: true });
RatingSchema.index({ targetId: 1, status: 1 });

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
`,
  'src/models/favorite.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IFavorite } from '@/types/models.type';

const FavoriteSchema = new Schema<IFavorite>(
  {
    boyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    girlId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// A Boy can only favorite a specific Girl once
FavoriteSchema.index({ boyId: 1, girlId: 1 }, { unique: true });
FavoriteSchema.index({ girlId: 1 }); // to get favorite counts

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
`,
  'src/models/platformSetting.model.ts': `import mongoose, { Schema } from 'mongoose';
import { IPlatformSetting } from '@/types/models.type';

const PlatformSettingSchema = new Schema<IPlatformSetting>(
  {
    commissionPercentage: { type: Number, required: true, min: 0, max: 100, default: 20 },
    minimumWithdrawalAmount: { type: Number, required: true, default: 500 },
    maximumRechargeAmount: { type: Number, required: true, default: 100000 },
    isMaintenanceMode: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export const PlatformSetting = mongoose.model<IPlatformSetting>(
  'PlatformSetting',
  PlatformSettingSchema
);
`,
  'src/models/index.ts': `export * from './user.model';
export * from './admin.model';
export * from './wallet.model';
export * from './walletTransaction.model';
export * from './chatRequest.model';
export * from './chat.model';
export * from './message.model';
export * from './notification.model';
export * from './report.model';
export * from './withdrawRequest.model';
export * from './rating.model';
export * from './favorite.model';
export * from './platformSetting.model';
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Database models scaffolding complete.');
