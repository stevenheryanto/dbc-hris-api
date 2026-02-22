import { db, masterOffice } from './index'

async function seedOffices() {
  console.log('🌱 Seeding offices...')

  try {
    // Create sample offices
    const offices = await db.insert(masterOffice).values([
      {
        officeName: 'Head Office Jakarta',
        officeDescription: 'Main headquarters in Jakarta',
        checkInLat: -6.2088,
        checkInLng: 106.8456,
        checkInAddress: 'Jakarta, Indonesia',
        qrCode: 'HO-JKT-001',
        status: 'active'
      },
      {
        officeName: 'Branch Office Surabaya',
        officeDescription: 'Branch office in Surabaya',
        checkInLat: -7.2575,
        checkInLng: 112.7521,
        checkInAddress: 'Surabaya, Indonesia',
        qrCode: 'BR-SBY-001',
        status: 'active'
      },
      {
        officeName: 'Branch Office Bandung',
        officeDescription: 'Branch office in Bandung',
        checkInLat: -6.9175,
        checkInLng: 107.6191,
        checkInAddress: 'Bandung, Indonesia',
        qrCode: 'BR-BDG-001',
        status: 'active'
      }
    ]).onConflictDoNothing().returning()

    console.log('✅ Sample offices created:', offices.length)
    offices.forEach(office => {
      console.log(`   - ${office.officeName} (ID: ${office.id})`)
    })
    
  } catch (error) {
    console.error('❌ Office seeding failed:', error)
  }
}

// Run seed if called directly
if (import.meta.main) {
  await seedOffices()
  process.exit(0)
}

export { seedOffices }