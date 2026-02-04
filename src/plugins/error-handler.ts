import { Elysia } from 'elysia'

export const errorHandler = new Elysia({ name: 'error-handler' })
  .error({
    VALIDATION_ERROR: Error,
    AUTHENTICATION_ERROR: Error,
    AUTHORIZATION_ERROR: Error,
    NOT_FOUND: Error,
    INTERNAL_SERVER_ERROR: Error
  })
  .onError(({ code, error, set }) => {
    console.error(`[${code}] ${error.message}`)

    switch (code) {
      case 'VALIDATION':
        set.status = 400
        return {
          error: 'Validation failed',
          message: error.message
        }

      case 'NOT_FOUND':
        set.status = 404
        return {
          error: 'Resource not found',
          message: error.message
        }

      case 'PARSE':
        set.status = 400
        return {
          error: 'Invalid request format',
          message: 'Unable to parse request body'
        }

      case 'AUTHENTICATION_ERROR':
        set.status = 401
        return {
          error: 'Authentication required',
          message: error.message
        }

      case 'AUTHORIZATION_ERROR':
        set.status = 403
        return {
          error: 'Access denied',
          message: error.message
        }

      case 'INTERNAL_SERVER_ERROR':
      default:
        set.status = 500
        return {
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        }
    }
  })