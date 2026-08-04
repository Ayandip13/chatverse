import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { getMyProfile } from '../api/users/user.controller';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError.util';

jest.mock('../repositories/user.repository');

describe('User Controller - getMyProfile', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      user: { userId: 'mock-user-id' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should return user profile if user exists', async () => {
    const mockUser = { _id: 'mock-user-id', email: 'test@example.com' };
    (userRepository.findById as jest.Mock<any>).mockResolvedValue(mockUser);

    await getMyProfile(mockReq, mockRes, mockNext);

    expect(userRepository.findById).toHaveBeenCalledWith('mock-user-id');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: mockUser,
      }),
    );
  });

  it('should call next with ApiError if user not found', async () => {
    (userRepository.findById as jest.Mock<any>).mockResolvedValue(null);

    await getMyProfile(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
  });
});
