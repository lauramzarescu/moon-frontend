export interface PaginatedResult<T> {
    data: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
        hasNextPage: boolean
        hasPreviousPage: boolean
    }
}

export interface PaginationParams {
    page?: number | string
    limit?: number | string
    filters?: Record<string, string>[]
    orderBy?: string
    order?: 'asc' | 'desc'
}
