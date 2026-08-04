import mongoose, { Schema } from 'mongoose';
import { IFavorite } from '@/types/models.type';

const FavoriteSchema = new Schema<IFavorite>(
  {
    boyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    girlId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// A Boy can only favorite a specific Girl once
FavoriteSchema.index({ boyId: 1, girlId: 1 }, { unique: true });
FavoriteSchema.index({ girlId: 1 }); // to get favorite counts

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
