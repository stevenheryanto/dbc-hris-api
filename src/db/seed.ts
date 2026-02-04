import { db, users, employees } from './index'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Create sample employee
    const [employee] = await db.insert(employees).values({
      taCode: 'EMP001',
      employeeId: 'E001',
      fullname: 'John Doe',
      employeeCode: 'JD001',
      status: 'A',
      startActiveDate: new Date(),
      country: 'ID'
    }).onConflictDoNothing().returning()

    console.log('✅ Sample employee created:', employee?.fullname || 'Already exists')

    // Hash passwords
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create admin user
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    }).onConflictDoNothing()

    // Create employee user
    await db.insert(users).values({
      username: 'employee',
      password: hashedPassword,
      role: 'employee',
      employeeId: employee?.id,
      isActive: true
    }).onConflictDoNothing()

    console.log('✅ Sample users created')
    console.log('   - Admin: admin/admin123')
    console.log('   - Employee: employee/admin123')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  }
}

// Run seed if called directly
if (import.meta.main) {
  await seed()
  process.exit(0)
}

export { seed }