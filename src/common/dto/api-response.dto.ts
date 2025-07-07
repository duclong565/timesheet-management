import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
    type: Boolean,
  })
  readonly success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Operation completed successfully',
    type: String,
  })
  readonly message: string;

  @ApiProperty({
    description: 'The response data payload',
    example: { id: '123e4567-e89b-12d3-a456-426614174000', name: 'John Doe' },
  })
  readonly data: T;

  @ApiProperty({
    description: 'Timestamp when the response was generated',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  readonly timestamp: string;

  constructor(data: T, message: string = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  // Static factory method for error responses
  static createError(message: string, success = false): ApiResponse<null> {
    return {
      success,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export class PaginationMeta {
  @ApiProperty({
    description: 'Current page number (1-based)',
    example: 1,
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items available',
    example: 150,
    minimum: 0,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages available',
    example: 15,
    minimum: 0,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page available',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page available',
    example: false,
  })
  hasPrev: boolean;
}

// Helper function to convert old pagination format to new PaginationMeta
export function convertToPaginationMeta(oldPagination: {
  total: number;
  page: number;
  limit: number;
  pages: number;
}): PaginationMeta {
  return {
    page: oldPagination.page,
    limit: oldPagination.limit,
    total: oldPagination.total,
    totalPages: oldPagination.pages,
    hasNext: oldPagination.page < oldPagination.pages,
    hasPrev: oldPagination.page > 1,
  };
}

export class PaginatedResponse<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
    type: Boolean,
  })
  readonly success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Data retrieved successfully',
    type: String,
  })
  readonly message: string;

  @ApiProperty({
    description: 'Array of data items for the current page',
    isArray: true,
  })
  readonly data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMeta,
  })
  readonly pagination: PaginationMeta;

  @ApiProperty({
    description: 'Timestamp when the response was generated',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  readonly timestamp: string;

  constructor(
    data: T[],
    pagination:
      | PaginationMeta
      | { total: number; page: number; limit: number; pages: number },
    message: string = 'Data retrieved successfully',
  ) {
    this.success = true;
    this.message = message;
    this.data = data;
    // Convert old pagination format to new format if needed
    this.pagination =
      'totalPages' in pagination
        ? pagination
        : convertToPaginationMeta(pagination);
    this.timestamp = new Date().toISOString();
  }
}

// Common Error Response Schemas
export class ErrorResponse {
  @ApiProperty({
    description: 'Indicates the request failed',
    example: false,
    type: Boolean,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message describing what went wrong',
    example: 'Validation failed',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
    type: Number,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path that caused the error',
    example: '/time-management/users',
    type: String,
  })
  path: string;
}

export class ValidationErrorResponse extends ErrorResponse {
  @ApiProperty({
    description: 'Detailed validation errors',
    example: [
      {
        field: 'email',
        message: 'Invalid email format',
        value: 'invalid-email',
      },
      {
        field: 'password',
        message: 'Password must be at least 8 characters',
        value: '',
      },
    ],
    isArray: true,
  })
  errors: Array<{
    field: string;
    message: string;
    value: any;
  }>;
}
