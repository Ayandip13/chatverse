import { User } from '@/models';
import { FilterQuery } from 'mongoose';
import { IUser } from '@/types/models.type';

class AdminUserRepository {
  async getPaginatedUsers(
    filters: { role?: string; status?: string; search?: string },
    page: number,
    limit: number
  ) {
    const query: FilterQuery<IUser> = { deletedAt: null };

    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const pageNum = Number.isNaN(Number(page)) || Number(page) < 1 ? 1 : Number(page);
    const limitNum = Number.isNaN(Number(limit)) || Number(limit) < 1 ? 10 : Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).select('-password').exec(),
      User.countDocuments(query).exec(),
    ]);

    return { users, total };
  }
}

export const adminUserRepository = new AdminUserRepository();
