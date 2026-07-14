import { Chat, Message } from '@/models';
import { ChatStatus } from '@/constants/enums.constant';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import mongoose from 'mongoose';

class ChatService {
  async getChats(userId: string, filters: any) {
    const { page, limit, search, status, unread } = filters;
    const skip = (page - 1) * limit;
    const userObjId = new mongoose.Types.ObjectId(userId);

    const matchStage: any = {
      $or: [{ boyId: userObjId }, { girlId: userObjId }],
      deletedAt: null
    };

    if (status) {
      matchStage.status = status;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $addFields: {
          otherParticipantId: {
            $cond: {
              if: { $eq: ['$boyId', userObjId] },
              then: '$girlId',
              else: '$boyId'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'otherParticipantId',
          foreignField: '_id',
          as: 'participant'
        }
      },
      { $unwind: '$participant' }
    ];

    if (search) {
      pipeline.push({
        $match: {
          'participant.name': { $regex: search, $options: 'i' }
        }
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$chatId', '$$chatId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessageArr'
        }
      },
      {
        $addFields: {
          lastMessage: { $arrayElemAt: ['$lastMessageArr', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          status: 1,
          startTime: 1,
          endTime: 1,
          durationInMinutes: 1,
          totalCost: 1,
          createdAt: 1,
          updatedAt: 1,
          lastActivity: { $ifNull: ['$lastMessage.createdAt', '$updatedAt'] },
          otherParticipant: {
            _id: '$participant._id',
            name: '$participant.name',
            avatar: '$participant.avatar',
            isOnline: { 
              $gte: ['$participant.updatedAt', new Date(Date.now() - 15 * 60000)]
            }
          },
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            senderId: '$lastMessage.senderId'
          },
          unreadCount: { $literal: 0 } // Mock unread count for now
        }
      }
    );

    // Filter by unread if requested
    if (unread) {
      pipeline.push({
        $match: { unreadCount: { $gt: 0 } }
      });
    }

    // Sort, facet for pagination
    pipeline.push({ $sort: { lastActivity: -1 } });
    
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    });

    const result = await Chat.aggregate(pipeline);
    
    const chats = result[0].data;
    const total = result[0].metadata[0]?.total || 0;

    return { chats, total };
  }
  
  async getChatDetails(userId: string, chatId: string) {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Invalid chat ID', 'VALIDATION_ERROR');
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const chatObjId = new mongoose.Types.ObjectId(chatId);

    const pipeline = [
      {
        $match: {
          _id: chatObjId,
          $or: [{ boyId: userObjId }, { girlId: userObjId }],
          deletedAt: null
        }
      },
      {
        $addFields: {
          otherParticipantId: {
            $cond: {
              if: { $eq: ['$boyId', userObjId] },
              then: '$girlId',
              else: '$boyId'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'otherParticipantId',
          foreignField: '_id',
          as: 'participant'
        }
      },
      { $unwind: '$participant' },
      {
        $project: {
          _id: 1,
          status: 1,
          startTime: 1,
          endTime: 1,
          durationInMinutes: 1,
          totalCost: 1,
          createdAt: 1,
          updatedAt: 1,
          otherParticipant: {
            _id: '$participant._id',
            name: '$participant.name',
            avatar: '$participant.avatar',
            isOnline: { 
              $gte: ['$participant.updatedAt', new Date(Date.now() - 15 * 60000)]
            }
          }
        }
      }
    ];

    const result = await Chat.aggregate(pipeline);

    if (!result || result.length === 0) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Chat not found', 'CHAT_NOT_FOUND');
    }

    return result[0];
  }

  async getChatMessages(userId: string, chatId: string, { page, limit }: any) {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Invalid chat ID', 'VALIDATION_ERROR');
    }

    const chat = await Chat.findOne({
      _id: chatId,
      $or: [{ boyId: userId }, { girlId: userId }],
      deletedAt: null
    }).lean();

    if (!chat) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Chat not found', 'CHAT_NOT_FOUND');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ chatId })
    ]);

    return { messages, total };
  }

  async endChat(userId: string, chatId: string) {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Invalid chat ID', 'VALIDATION_ERROR');
    }

    const chat = await Chat.findOne({
      _id: chatId,
      $or: [{ boyId: userId }, { girlId: userId }],
      deletedAt: null,
      status: ChatStatus.ACTIVE
    });

    if (!chat) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Active chat not found', 'CHAT_NOT_FOUND');
    }

    chat.status = ChatStatus.ENDED;
    chat.endTime = new Date();
    // Simplified logic: duration and cost should ideally be calculated cleanly
    // For this module scope, we just close it out
    const diffMs = chat.endTime.getTime() - chat.startTime.getTime();
    const durationMins = Math.ceil(diffMs / 60000);
    chat.durationInMinutes = durationMins;
    
    await chat.save();
    return chat;
  }
}

export const chatService = new ChatService();
