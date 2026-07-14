import { User, Favorite } from '@/models';
import { Role, GirlStatus } from '@/constants/enums.constant';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import mongoose from 'mongoose';

class GirlsService {
  private getBaseQuery() {
    return {
      role: Role.GIRL,
      status: GirlStatus.APPROVED,
      deletedAt: null
    };
  }
  
  private async enrichWithFavorites(userId: string, girls: any[]) {
    if (!girls || girls.length === 0) return [];
    
    const girlIds = girls.map(g => g._id);
    const favorites = await Favorite.find({ boyId: userId, girlId: { $in: girlIds } }).select('girlId').lean();
    const favSet = new Set(favorites.map(f => f.girlId.toString()));
    
    return girls.map(girl => ({
      ...girl,
      isFavorite: favSet.has(girl._id.toString()),
      isOnline: new Date(girl.updatedAt).getTime() > Date.now() - 15 * 60000
    }));
  }

  async discoverGirls(userId: string, filters: any) {
    const { online, recommended, popular, recentlyJoined, search, favorites } = filters;

    if (search) return this.searchGirls(userId, filters);
    if (favorites) return this.getFavoriteGirls(userId, filters);
    if (online) return this.getOnlineGirls(userId, filters);
    if (recommended) return this.getRecommendedGirls(userId, filters);
    if (popular) return this.getPopularGirls(userId, filters);
    if (recentlyJoined) return this.getRecentGirls(userId, filters);
    
    // Default fallback list
    return this.getAllGirls(userId, filters);
  }

  async getAllGirls(userId: string, { page, limit, sort, rating }: any) {
    const query: any = this.getBaseQuery();
    if (rating) query.averageRating = { $gte: rating };

    let sortObj: any = { createdAt: -1 };
    if (sort === '-rating') sortObj = { averageRating: -1 };
    
    return this.executePaginatedQuery(userId, query, sortObj, page, limit);
  }

  async searchGirls(userId: string, { page, limit, search }: any) {
    const query: any = this.getBaseQuery();
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } }
    ];
    return this.executePaginatedQuery(userId, query, { createdAt: -1 }, page, limit);
  }

  async getOnlineGirls(userId: string, { page, limit }: any) {
    const query: any = this.getBaseQuery();
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000);
    query.updatedAt = { $gte: fifteenMinsAgo };
    // Order by last active, rating
    const sortObj = { updatedAt: -1, averageRating: -1 };
    return this.executePaginatedQuery(userId, query, sortObj, page, limit);
  }

  async getRecommendedGirls(userId: string, { page, limit }: any) {
    const query: any = this.getBaseQuery();
    // Highest ratings and most recently active
    const sortObj = { averageRating: -1, updatedAt: -1 };
    return this.executePaginatedQuery(userId, query, sortObj, page, limit);
  }

  async getPopularGirls(userId: string, { page, limit }: any) {
    const query: any = this.getBaseQuery();
    // Popular based on rating and totalRatings
    const sortObj = { averageRating: -1, totalRatings: -1 };
    return this.executePaginatedQuery(userId, query, sortObj, page, limit);
  }

  async getRecentGirls(userId: string, { page, limit }: any) {
    const query: any = this.getBaseQuery();
    // Recently joined
    const sortObj = { createdAt: -1 };
    return this.executePaginatedQuery(userId, query, sortObj, page, limit);
  }

  async getFavoriteGirls(userId: string, { page, limit }: any) {
    const userFavorites = await Favorite.find({ boyId: userId }).select('girlId').lean();
    const girlIds = userFavorites.map(f => f.girlId);
    
    const query: any = this.getBaseQuery();
    query._id = { $in: girlIds };
    
    return this.executePaginatedQuery(userId, query, { createdAt: -1 }, page, limit);
  }

  private async executePaginatedQuery(userId: string, query: any, sort: any, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [girls, total] = await Promise.all([
      User.find(query)
        .select('-password -tokenVersion -authProvider -phone -email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);
    
    const enrichedGirls = await this.enrichWithFavorites(userId, girls);

    return { girls: enrichedGirls, total };
  }
  
  async getGirlDetails(userId: string, targetId: string) {
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Invalid girl ID', 'VALIDATION_ERROR');
    }

    const girl = await User.findOne({
      _id: targetId,
      ...this.getBaseQuery()
    }).select('-password -tokenVersion -authProvider -phone -email').lean();
    
    if (!girl) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Girl not found', 'GIRL_NOT_FOUND');
    }
    
    const isFavorite = await Favorite.exists({ boyId: userId, girlId: targetId });
    
    return {
      ...girl,
      isFavorite: !!isFavorite,
      isOnline: new Date(girl.updatedAt).getTime() > Date.now() - 15 * 60000
    };
  }

  async toggleFavorite(boyId: string, girlId: string, isFavorite: boolean) {
    if (!mongoose.Types.ObjectId.isValid(girlId)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Invalid girl ID', 'VALIDATION_ERROR');
    }

    if (isFavorite) {
      await Favorite.updateOne(
        { boyId, girlId },
        { boyId, girlId },
        { upsert: true }
      );
    } else {
      await Favorite.deleteOne({ boyId, girlId });
    }
  }
}

export const girlsService = new GirlsService();
