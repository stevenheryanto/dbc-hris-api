import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgres://myuser:mypass@localhost:5432/dbc_hris'
  }
} satisfies Config