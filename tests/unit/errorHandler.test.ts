import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();

    // Set NODE_ENV for tests
    process.env.NODE_ENV = 'test';
  });

  describe('errorHandler', () => {
    it('should return 500 for generic errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Something went wrong',
          }),
        })
      );
    });

    it('should return custom status code for AppError', () => {
      const error = new AppError('Not found', 404);

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Not found',
          }),
        })
      );
    });

    it('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new AppError('Test error', 400);

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String),
          }),
        })
      );
    });

    it('should NOT include stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new AppError('Test error', 400);

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.error.stack).toBeUndefined();
    });
  });

  describe('AppError', () => {
    it('should create error with default status 500', () => {
      const error = new AppError('Test error');

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Test error');
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom status', () => {
      const error = new AppError('Bad request', 400);

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });
});
