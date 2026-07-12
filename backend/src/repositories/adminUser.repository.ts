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

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password').exec(),
      User.countDocuments(query).exec(),
    ]);

    return { users, total };
  }
}

export const adminUserRepository = new AdminUserRepository();
