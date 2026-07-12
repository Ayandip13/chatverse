import mongoose, { Schema } from 'mongoose';
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
