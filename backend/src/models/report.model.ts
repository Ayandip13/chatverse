import mongoose, { Schema } from 'mongoose';
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
  { timestamps: true },
);

ReportSchema.index({ targetId: 1, status: 1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
