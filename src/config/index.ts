import { databaseConfig } from './database'

export const config = {
  database: databaseConfig,
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/jpg']
  },
  server: {
    port: parseInt(process.env.PORT || '8080'),
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      credentials: process.env.CORS_CREDENTIALS === 'true'
    }
  },
  app: {
    name: process.env.APP_NAME || 'DBC HRIS API',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }
} as const

export type Config = typeof config

// Legacy exports for backward compatibility
export const DATABASE_URL = config.database.url
export const JWT_SECRET = config.jwt.secret
export const UPLOAD_PATH = config.upload.path
export const PORT = config.server.port
export const NODE_ENV = config.app.environment