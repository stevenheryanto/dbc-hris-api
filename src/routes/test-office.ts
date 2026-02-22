import { Elysia, t } from 'elysia'
import { db, users, masterOffice } from '../db'
import { eq } from 'drizzle-orm'

export const testOfficeController = new Elysia({ prefix: '/test-office' })
  .get('/users-with-office', async () => {
    // Get all users with their office information
    const usersWithOffice = await db.query.users.findMany({
      columns: {
        password: false
      }
    })
    
    return {
      message: 'Users with office data',
      data: usersWithOffice.map(user => ({
        id: user.id,
        name: user.name,
        officeId: user.officeId,
        officeIdType: typeof user.officeId
      }))
    }
  })
  .get('/offices', async () => {
    // Get all offices
    const offices = await db.query.masterOffice.findMany()
    
    return {
      message: 'All offices',
      data: offices.map(office => ({
        id: office.id,
        officeName: office.officeName,
        idType: typeof office.id
      }))
    }
  })
  .post('/update-user-office', async ({ body }) => {
    const { userId, officeId } = body
    
    console.log('Updating user office:', { userId, officeId, officeIdType: typeof officeId })
    
    // Update user office
    const [updatedUser] = await db.update(users)
      .set({ 
        officeId: officeId ? parseInt(officeId) : null,
        updatedAt: new Date()
      })
      .where(eq(users.id, parseInt(userId)))
      .returning({
        id: users.id,
        name: users.name,
        officeId: users.officeId
      })
    
    console.log('Updated user result:', updatedUser)
    
    return {
      message: 'User office updated',
      data: updatedUser
    }
  }, {
    body: t.Object({
      userId: t.String(),
      officeId: t.Optional(t.String())
    })
  })
  .get('/user/:id', async ({ params }) => {
    const userId = parseInt(params.id)
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false
      }
    })
    
    return {
      message: 'User data',
      data: user ? {
        id: user.id,
        name: user.name,
        officeId: user.officeId,
        officeIdType: typeof user.officeId,
        rawUser: user
      } : null
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  })