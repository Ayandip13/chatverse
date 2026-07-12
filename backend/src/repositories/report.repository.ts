import { Report } from '@/models';
import { IReport } from '@/types/models.type';
import { FilterQuery, Types } from 'mongoose';

class ReportRepository {
  async create(data: Partial<IReport>): Promise<IReport> {
    return Report.create(data);
  }

  async findDuplicate(reporterId: string, targetId: string, reason: string): Promise<IReport | null> {
    // A duplicate is considered the same reporter reporting the same target for the same reason
    // while the previous report is still PENDING or UNDER_REVIEW
    return Report.findOne({
      reporterId: new Types.ObjectId(reporterId),
      targetId: new Types.ObjectId(targetId),
      reason,
      status: { $in: ['PENDING', 'UNDER_REVIEW'] }
    }).exec();
  }

  async findById(id: string): Promise<IReport | null> {
    return Report.findById(id).populate('reporterId targetId resolvedById', 'name email role').exec();
  }

  async getPaginatedReports(filters: FilterQuery<IReport>, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reporterId targetId', 'name email role avatar')
        .exec(),
      Report.countDocuments(filters).exec(),
    ]);

    return { reports, total };
  }

  async updateStatus(id: string, updateData: Partial<IReport>): Promise<IReport | null> {
    return Report.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
}

export const reportRepository = new ReportRepository();
