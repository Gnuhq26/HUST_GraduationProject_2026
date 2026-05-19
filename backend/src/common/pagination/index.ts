export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export function parsePagination(page?: number, limit?: number, maxLimit = 100): PaginationParams {
  const p = Math.max(1, page ?? 1);
  const l = Math.min(maxLimit, Math.max(1, limit ?? 20));
  return { page: p, limit: l };
}

export function paginateResult<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
