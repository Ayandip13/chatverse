export enum Role {
  BOY = 'BOY',
  GIRL = 'GIRL',
  ADMIN = 'ADMIN',
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

export enum AdminStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
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
  PAID = 'COMPLETED', // Alias for COMPLETED
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
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
