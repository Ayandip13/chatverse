import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { userRepository } from '@/repositories/user.repository';
import { ApiError } from '@/utils/ApiError.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import logger from '@/config/logger.config';
import { deleteFromCloudinary } from '@/services/upload.service';

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

    // Prevent modification of restricted fields just in case they bypass validator
    delete updates.role;
    delete updates.status;
    delete updates.tokenVersion;
    delete updates.deletedAt;
    delete updates.averageRating;
    delete updates.totalRatings;

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

export const uploadMyAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      throw new ApiError(400, 'No file uploaded or invalid file type');
    }

    const file = req.file as any;
    let avatarUrl = '';
    if (file.secure_url) {
      avatarUrl = file.secure_url;
    } else if (file.path && file.path.startsWith('http')) {
      avatarUrl = file.path;
    } else if (file.filename) {
      avatarUrl = `/uploads/avatars/${file.filename}`;
    } else {
      avatarUrl = `/uploads/avatars/${path.basename(file.path)}`;
    }

    // Cleanup old avatar if exists
    const currentUser = await userRepository.findById(userId);
    if (currentUser && currentUser.avatar && currentUser.avatar.includes('cloudinary')) {
      await deleteFromCloudinary(currentUser.avatar);
    }

    const user = await userRepository.update(userId, { avatar: avatarUrl });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    logger.info(`User ${userId} uploaded new avatar`);
    res.status(200).json(new ApiResponse(user, 'Avatar uploaded successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteMyAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const currentUser = await userRepository.findById(userId);

    if (!currentUser || !currentUser.avatar) {
      throw new ApiError(400, 'No avatar to delete');
    }

    if (currentUser.avatar.includes('cloudinary')) {
      await deleteFromCloudinary(currentUser.avatar);
    }

    const user = await userRepository.update(userId, { avatar: '' });

    logger.info(`User ${userId} deleted their avatar`);
    res.status(200).json(new ApiResponse(user, 'Avatar deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userRepository.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Exclude sensitive fields
    const publicData = {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      averageRating: user.averageRating,
      totalRatings: user.totalRatings,
      role: user.role,
      status: user.status,
    };

    res.status(200).json(new ApiResponse(publicData, 'Public profile retrieved'));
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
      email: `${userId}@deleted.chatverse.com`,
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
