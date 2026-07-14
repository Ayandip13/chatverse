import { Request, Response, NextFunction } from 'express';
import { Rating, User, Chat } from '@/models';
import { ApiError } from '@/utils/ApiError.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import logger from '@/config/logger.config';
import mongoose from 'mongoose';

export const rateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewerId = req.user!.userId;
    const { targetUserId, score, review } = req.body;
    const chatId = req.params.id || req.body.chatId;

    if (reviewerId === targetUserId) {
      throw new ApiError(400, 'Cannot rate yourself');
    }

    if (!chatId) throw new ApiError(400, 'Chat ID is required');

    // Verify chat existed between these users
    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, 'Chat not found');
    
    const isParticipant = (chat.boyId.toString() === reviewerId && chat.girlId.toString() === targetUserId) ||
                          (chat.girlId.toString() === reviewerId && chat.boyId.toString() === targetUserId);
                          
    if (!isParticipant) throw new ApiError(403, 'You can only rate participants of your chats');

    // Prevent duplicate rating for same chat
    const existing = await Rating.findOne({ reviewerId, chatId });
    if (existing) throw new ApiError(400, 'Already rated this chat');

    const newRating = await Rating.create({
      reviewerId,
      targetUserId,
      chatId,
      score,
      review
    });

    // Update User Average
    const agg = await Rating.aggregate([
      { $match: { targetUserId: new mongoose.Types.ObjectId(targetUserId) } },
      { $group: { _id: null, avgScore: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);

    if (agg.length > 0) {
      await User.findByIdAndUpdate(targetUserId, {
        averageRating: parseFloat(agg[0].avgScore.toFixed(1)),
        totalRatings: agg[0].count
      });
    }

    logger.info(`User ${reviewerId} rated ${targetUserId} with ${score} stars`);
    res.status(201).json(new ApiResponse(newRating, 'Rating submitted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getRatings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const targetUserId = req.query.targetUserId as string;

    const query: any = {};
    if (targetUserId) query.targetUserId = targetUserId;
    // If no targetUserId, maybe return caller's ratings? Or just require it for public profiles.
    if (!targetUserId) query.targetUserId = req.user!.userId;

    const ratings = await Rating.find(query)
      .populate('reviewerId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Rating.countDocuments(query);

    res.status(200).json({ success: true, data: ratings, meta: { total, page, limit } });
  } catch (error) {
    next(error);
  }
};

export const updateRating = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewerId = req.user!.userId;
    const ratingId = req.params.id;
    const { score, comment } = req.body;

    const rating = await Rating.findOne({ _id: ratingId, reviewerId });
    if (!rating) {
      throw new ApiError(404, 'Rating not found or you are not authorized to edit it');
    }

    if (score !== undefined) rating.score = score;
    if (comment !== undefined) rating.comment = comment;
    
    await rating.save();

    // Update aggregate logic here if score changed...
    const agg = await Rating.aggregate([
      { $match: { targetId: rating.targetId } },
      { $group: { _id: null, avgScore: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);

    if (agg.length > 0) {
      await User.findByIdAndUpdate(rating.targetId, {
        averageRating: parseFloat(agg[0].avgScore.toFixed(1)),
        totalRatings: agg[0].count
      });
    }

    res.status(200).json(new ApiResponse(rating, 'Rating updated successfully'));
  } catch (error) {
    next(error);
  }
};
