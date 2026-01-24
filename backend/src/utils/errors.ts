export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createError = (
  statusCode: number,
  code: string,
  message: string
) => {
  return new AppError(statusCode, code, message);
};

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
    });
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: errors[0]?.msg || 'Validation failed',
      errors: errors,
    });
  }

  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);

  return res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
  });
};
