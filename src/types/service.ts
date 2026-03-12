export type ServiceResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
