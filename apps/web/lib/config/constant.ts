export const API_CONSTANTS = {
    RATE_LIMITS: {
      PUBLIC_API_LIST: { requests: 100, window: '1m' },
      PUBLIC_API_DETAIL: { requests: 200, window: '1m' },
      PUBLIC_TESTING: { requests: 5, window: '1m' },
      AUTHENTICATED_GENERAL: { requests: 1000, window: '1m' },
      AUTHENTICATED_TESTING: { requests: 100, window: '1m' },
      API_CREATION: { requests: 10, window: '1h' },
      API_PURCHASE: { requests: 5, window: '1m' },
    },
    
    CACHE_TTL: {
      SHORT: 60,
      MEDIUM: 300,
      LONG: 1800,
      VERY_LONG: 3600,
    },
    
    PAGINATION: {
      DEFAULT_LIMIT: 10,
      MAX_LIMIT: 100,
    },
    
    API_TESTING: {
      PUBLIC_RESPONSE_LIMIT: 5000,
      PUBLIC_TIMEOUT: 15000,
      AUTHENTICATED_TIMEOUT: 30000,
    },
    
    PRICING: {
      PLATFORM_FEE_RATE: 0.15,
      TDS_RATE: 0.1,
    },
  } as const;
  
  export const ERROR_CODES = {
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  } as const;
  
  export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  } as const;