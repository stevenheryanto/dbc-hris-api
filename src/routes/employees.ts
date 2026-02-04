import { Elysia, t } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { db, users } from '../db'
import { eq, desc, like, and, or } from 'drizzle-orm'
import { AuthService } from '../services/auth.service'

export const employeesController = new Elysia({ prefix: '/employees' })
  .use(authPlugin)
  .get('/', async ({ query }) => {
    const { search, status, limit = '50', offset = '0' } = query
    
    let whereConditions = []
    
    if (search) {
      whereConditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.username, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.employeeId, `%${search}%`),
          like(users.employeeCode, `%${search}%`)
        )
      )
    }
    
    if (status) {
      whereConditions.push(eq(users.status, status))
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined
    
    const allUsers = await db.query.users.findMany({
      where: whereClause,
      orderBy: [desc(users.createdAt)],
      limit: parseInt(limit),
      offset: parseInt(offset),
      columns: {
        password: false // Exclude password from response
      }
    })

    return allUsers
  }, {
    detail: {
      tags: ['Employees'],
      summary: 'Get all users/employees',
      description: 'Get list of all users/employees with optional search and filtering'
    }
  })
  .get('/:id', async ({ params, set }) => {
    try {
      const id = parseInt(params.id)
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: {
          password: false // Exclude password from response
        }
      })

      if (!user) {
        set.status = 404
        return { error: 'User not found' }
      }

      return user
    } catch (error) {
      set.status = 500
      return { error: 'Failed to get user' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Get user by ID',
      description: 'Get a specific user by ID'
    }
  })
  .post('/', async ({ body, set }) => {
    try {
      // Hash password before storing
      const hashedPassword = await AuthService.hashPassword(body.password)
      
      const [newUser] = await db.insert(users).values({
        username: body.username,
        email: body.email,
        name: body.name,
        password: hashedPassword,
        role: body.role || 'employee',
        employeeId: body.employeeId,
        employeeCode: body.employeeCode,
        status: body.status || 'A',
        startActiveDate: body.startActiveDate ? new Date(body.startActiveDate) : new Date(),
        areaCode: body.areaCode,
        territoryCode: body.territoryCode,
        type: body.type,
        source: body.source,
        country: body.country || 'ID',
        isActive: body.isActive !== undefined ? body.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        employeeId: users.employeeId,
        employeeCode: users.employeeCode,
        status: users.status,
        startActiveDate: users.startActiveDate,
        areaCode: users.areaCode,
        territoryCode: users.territoryCode,
        type: users.type,
        source: users.source,
        country: users.country,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })

      set.status = 201
      return newUser
    } catch (error) {
      set.status = 500
      return { error: 'Failed to create user' }
    }
  }, {
    body: t.Object({
      username: t.String(),
      email: t.String({ format: 'email' }),
      name: t.String(),
      password: t.String({ minLength: 6 }),
      role: t.Optional(t.String()),
      employeeId: t.Optional(t.String()),
      employeeCode: t.Optional(t.String()),
      status: t.Optional(t.String()),
      startActiveDate: t.Optional(t.String()),
      areaCode: t.Optional(t.String()),
      territoryCode: t.Optional(t.String()),
      type: t.Optional(t.String()),
      source: t.Optional(t.String()),
      country: t.Optional(t.String()),
      isActive: t.Optional(t.Boolean())
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Create user',
      description: 'Create a new user/employee'
    }
  })
  .put('/:id', async ({ params, body, set }) => {
    try {
      const id = parseInt(params.id)
      
      const updateData: any = {
        updatedAt: new Date()
      }
      
      // Only update fields that are provided
      if (body.username) updateData.username = body.username
      if (body.email) updateData.email = body.email
      if (body.name) updateData.name = body.name
      if (body.role) updateData.role = body.role
      if (body.employeeId) updateData.employeeId = body.employeeId
      if (body.employeeCode) updateData.employeeCode = body.employeeCode
      if (body.status) updateData.status = body.status
      if (body.startActiveDate) updateData.startActiveDate = new Date(body.startActiveDate)
      if (body.areaCode) updateData.areaCode = body.areaCode
      if (body.territoryCode) updateData.territoryCode = body.territoryCode
      if (body.type) updateData.type = body.type
      if (body.source) updateData.source = body.source
      if (body.country) updateData.country = body.country
      if (body.isActive !== undefined) updateData.isActive = body.isActive
      
      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          employeeId: users.employeeId,
          employeeCode: users.employeeCode,
          status: users.status,
          startActiveDate: users.startActiveDate,
          areaCode: users.areaCode,
          territoryCode: users.territoryCode,
          type: users.type,
          source: users.source,
          country: users.country,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })

      if (!updatedUser) {
        set.status = 404
        return { error: 'User not found' }
      }

      return updatedUser
    } catch (error) {
      set.status = 500
      return { error: 'Failed to update user' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    body: t.Object({
      username: t.Optional(t.String()),
      email: t.Optional(t.String({ format: 'email' })),
      name: t.Optional(t.String()),
      role: t.Optional(t.String()),
      employeeId: t.Optional(t.String()),
      employeeCode: t.Optional(t.String()),
      status: t.Optional(t.String()),
      startActiveDate: t.Optional(t.String()),
      areaCode: t.Optional(t.String()),
      territoryCode: t.Optional(t.String()),
      type: t.Optional(t.String()),
      source: t.Optional(t.String()),
      country: t.Optional(t.String()),
      isActive: t.Optional(t.Boolean())
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Update user',
      description: 'Update an existing user/employee'
    }
  })
  .delete('/:id', async ({ params, set }) => {
    try {
      const id = parseInt(params.id)
      
      const deletedUser = await db.delete(users)
        .where(eq(users.id, id))
        .returning()

      if (deletedUser.length === 0) {
        set.status = 404
        return { error: 'User not found' }
      }

      set.status = 204
      return
    } catch (error) {
      set.status = 500
      return { error: 'Failed to delete user' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Delete user',
      description: 'Delete a user/employee'
    }
  })
  .post('/import', async ({ body, set }) => {
    try {
      const { users: userData } = body
      let successCount = 0
      const errors: string[] = []

      for (const user of userData) {
        try {
          // Hash password before storing
          const hashedPassword = await AuthService.hashPassword(user.password)
          
          await db.insert(users).values({
            username: user.username,
            email: user.email,
            name: user.name,
            password: hashedPassword,
            role: user.role || 'employee',
            employeeId: user.employeeId,
            employeeCode: user.employeeCode,
            status: user.status || 'A',
            startActiveDate: user.startActiveDate ? new Date(user.startActiveDate) : new Date(),
            areaCode: user.areaCode,
            territoryCode: user.territoryCode,
            type: user.type,
            source: user.source || 'import',
            country: user.country || 'ID',
            isActive: user.isActive !== undefined ? user.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          successCount++
        } catch (error) {
          errors.push(`Failed to import user ${user.username}: ${error}`)
        }
      }

      return {
        success: successCount,
        errors
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to import users' }
    }
  }, {
    body: t.Object({
      users: t.Array(t.Object({
        username: t.String(),
        email: t.String({ format: 'email' }),
        name: t.String(),
        password: t.String({ minLength: 6 }),
        role: t.Optional(t.String()),
        employeeId: t.Optional(t.String()),
        employeeCode: t.Optional(t.String()),
        status: t.Optional(t.String()),
        startActiveDate: t.Optional(t.String()),
        areaCode: t.Optional(t.String()),
        territoryCode: t.Optional(t.String()),
        type: t.Optional(t.String()),
        source: t.Optional(t.String()),
        country: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean())
      }))
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Import users',
      description: 'Import multiple users/employees from CSV/JSON'
    }
  })