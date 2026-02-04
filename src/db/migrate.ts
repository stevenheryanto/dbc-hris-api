import { db } from './index'
import { sql } from 'drizzle-orm'

async function migrate() {
  console.log('🔄 Running database migrations...')

  try {
    // Add email and name columns to users table if they don't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE,
      ADD COLUMN IF NOT EXISTS name VARCHAR(100)
    `)

    // Update role default from 'employee' to 'user' if needed
    await db.execute(sql`
      ALTER TABLE users 
      ALTER COLUMN role SET DEFAULT 'user'
    `)

    console.log('✅ Database migration completed successfully')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration if called directly
if (import.meta.main) {
  await migrate()
  process.exit(0)
}

export { migrate }