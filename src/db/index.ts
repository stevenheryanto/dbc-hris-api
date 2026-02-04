import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config'
import * as schema from './schema'

const client = postgres(config.database.url)
export const db = drizzle(client, { schema })

export async function initDatabase() {
  try {
    // Test connection
    await client`SELECT 1`
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

export * from './schema'