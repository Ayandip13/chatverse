import { User } from '@/models';
import { IUser } from '@/types/models.type';

class UserRepository {
  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email, deletedAt: null });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, deletedAt: null }).exec();
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findOneAndUpdate({ _id: id, deletedAt: null }, updateData, { new: true }).exec();
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await User.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } }).exec();
  }
}

export const userRepository = new UserRepository();
