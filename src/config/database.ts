export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgres://myuser:mypass@postgres:5432/dbc_hris',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dbc_hris',
  username: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypass',
  ssl: process.env.DB_SSL === 'true',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000')
} as const

export type DatabaseConfig = typeof databaseConfig