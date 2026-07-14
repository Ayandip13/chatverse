import { Request, Response, NextFunction } from 'express';
import { userRepository } from '@/repositories/user.repository';
import { ApiError } from '@/utils/ApiError.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import logger from '@/config/logger.config';

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(user, 'Profile retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const updates = req.body;

    const user = await userRepository.update(userId, updates);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    logger.info(`User ${userId} updated profile`);
    res.status(200).json(new ApiResponse(user, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteMyAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    const user = await userRepository.update(userId, {
      deletedAt: new Date(),
      status: 'REJECTED' as any, // Mapped to generic rejected state
      email: `${userId}@deleted.chatverse.com`
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    logger.info(`User ${userId} deleted account`);
    res.status(200).json(new ApiResponse(null, 'Account deleted successfully'));
  } catch (error) {
    next(error);
  }
};
