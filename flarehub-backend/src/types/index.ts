import type { UserRole } from '@prisma/client';

export interface AuthUser {
  id:       string;
  email:    string;
  role:     UserRole;
  isMentor: boolean;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data:    T;
}

export interface ApiResponsePaginated<T = unknown> {
  success: true;
  data:    T[];
  meta: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code:     string;
    message:  string;
    details?: unknown;
  };
}

export interface PaginationQuery {
  page?:      number;
  limit?:     number;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
  search?:    string;
}

export class AppError extends Error {
  constructor(
    public readonly code:       string,
    message:                    string,
    public readonly statusCode: number = 400,
    public readonly details?:   unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
