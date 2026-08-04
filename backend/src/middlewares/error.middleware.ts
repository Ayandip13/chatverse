import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger.config';
import { ApiError } from '@/utils/ApiError.util';
import envConfig from '@/config/env.config';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { ERROR_MESSAGES } from '@/constants/errorMessages.constant';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(STATUS_CODES.NOT_FOUND, `Resource not found: ${req.originalUrl}`);
  next(error);
};

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  let statusCode: number = STATUS_CODES.INTERNAL_SERVER_ERROR;
  let message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  let code = 'INTERNAL_SERVER_ERROR';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || code;
  }

  logger.error(
    `[${req.method}] ${req.originalUrl} >> StatusCode:: ${statusCode}, Message:: ${message}`,
  );
  if (envConfig.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details: envConfig.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};
