export class ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  timestamp: string;

  constructor(data: T | null, message: string, success = true) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = 'Operation successful'): ApiResponse<T> {
    return new ApiResponse(data, message, true);
  }

  static error<T>(message = 'Operation failed', data: T | null = null): ApiResponse<T> {
    return new ApiResponse(data, message, false);
  }
}

export class PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };

  constructor(
    data: T[], 
    pagination: { total: number; page: number; limit: number; pages: number }, 
    message = 'Operation successful'
  ) {
    super(data, message);
    this.pagination = pagination;
  }

  static fromResponse<T>(
    response: { data: T[]; pagination: any },
    message = 'Operation successful'
  ): PaginatedResponse<T> {
    return new PaginatedResponse(response.data, response.pagination, message);
  }
}