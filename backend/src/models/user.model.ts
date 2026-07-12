import mongoose, { Schema } from 'mongoose';
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
