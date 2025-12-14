import { Request, Response, NextFunction } from 'express';
import { validate } from '../../src/middleware/validator';
import { validationResult } from 'express-validator';

// Mock express-validator
jest.mock('express-validator', () => ({
  ...jest.requireActual('express-validator'),
  validationResult: jest.fn(),
}));

describe('Validator Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() when no validation errors', () => {
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    validate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should throw AppError when validation fails', () => {
    const mockErrors = [
      { msg: 'Email is required' },
      { msg: 'Password must be at least 6 characters' },
    ];

    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    expect(() => {
      validate(mockRequest as Request, mockResponse as Response, nextFunction);
    }).toThrow('Email is required, Password must be at least 6 characters');
  });

  it('should throw with 400 status code', () => {
    const mockErrors = [{ msg: 'Invalid input' }];

    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    try {
      validate(mockRequest as Request, mockResponse as Response, nextFunction);
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
    }
  });
});
