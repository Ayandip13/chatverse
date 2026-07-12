import { WithdrawRequest } from '@/models';
import { IWithdrawRequest } from '@/types/models.type';
import { FilterQuery, Types } from 'mongoose';

class WithdrawRequestRepository {
  async getPaginatedRequests(filters: { status?: string }, page: number, limit: number) {
    const query: FilterQuery<IWithdrawRequest> = {};
    if (filters.status) {
      query.status = filters.status;
    }
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      WithdrawRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email phone avatar').exec(),
      WithdrawRequest.countDocuments(query).exec(),
    ]);

    return { requests, total };
  }

  async findById(id: string): Promise<IWithdrawRequest | null> {
    return WithdrawRequest.findById(id).exec();
  }

  async update(id: string, updateData: Partial<IWithdrawRequest>): Promise<IWithdrawRequest | null> {
    return WithdrawRequest.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
}

export const withdrawRequestRepository = new WithdrawRequestRepository();
