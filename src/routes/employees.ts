import { Elysia, t } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { db, users } from '../db'
import { eq, desc } from 'drizzle-orm'

export const employeesController = new Elysia({ prefix: '/employees' })
  .use(authPlugin)
  .get('/', async () => {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      columns: {
        password: false // Exclude password from response
      }
    })

    return allUsers
  }, {
    detail: {
      tags: ['Employees'],
      summary: 'Get all users/employees',
      description: 'Get list of all users/employees'
    }
  })
  .get('/:id', async ({ params, set }) => {
    try {
      const id = parseInt(params.id)
      const employee = await db.query.employees.findFirst({
        where: eq(employees.id, id)
      })

      if (!employee) {
        set.status = 404
        return { error: 'Employee not found' }
      }

      return employee
    } catch (error) {
      set.status = 500
      return { error: 'Failed to get employee' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Get employee by ID',
      description: 'Get a specific employee by ID'
    }
  })
  .post('/', async ({ body, set }) => {
    try {
      const [newEmployee] = await db.insert(employees).values({
        employeeId: body.employeeId,
        fullname: body.fullname,
        employeeCode: body.employeeCode,
        status: body.status || 'A',
        startActiveDate: body.startActiveDate ? new Date(body.startActiveDate) : new Date(),
        areaCode: body.areaCode,
        territoryCode: body.territoryCode,
        type: body.type,
        source: body.source,
        country: body.country || 'ID',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      set.status = 201
      return newEmployee
    } catch (error) {
      set.status = 500
      return { error: 'Failed to create employee' }
    }
  }, {
    body: t.Object({
      employeeId: t.String(),
      fullname: t.String(),
      employeeCode: t.Optional(t.String()),
      status: t.Optional(t.String()),
      startActiveDate: t.Optional(t.String()),
      areaCode: t.Optional(t.String()),
      territoryCode: t.Optional(t.String()),
      type: t.Optional(t.String()),
      source: t.Optional(t.String()),
      country: t.Optional(t.String())
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Create employee',
      description: 'Create a new employee'
    }
  })
  .put('/:id', async ({ params, body, set }) => {
    try {
      const id = parseInt(params.id)
      
      const [updatedEmployee] = await db.update(employees)
        .set({
          employeeId: body.employeeId,
          fullname: body.fullname,
          employeeCode: body.employeeCode,
          status: body.status,
          startActiveDate: body.startActiveDate ? new Date(body.startActiveDate) : undefined,
          areaCode: body.areaCode,
          territoryCode: body.territoryCode,
          type: body.type,
          source: body.source,
          country: body.country,
          updatedAt: new Date()
        })
        .where(eq(employees.id, id))
        .returning()

      if (!updatedEmployee) {
        set.status = 404
        return { error: 'Employee not found' }
      }

      return updatedEmployee
    } catch (error) {
      set.status = 500
      return { error: 'Failed to update employee' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    body: t.Object({
      employeeId: t.Optional(t.String()),
      fullname: t.Optional(t.String()),
      employeeCode: t.Optional(t.String()),
      status: t.Optional(t.String()),
      startActiveDate: t.Optional(t.String()),
      areaCode: t.Optional(t.String()),
      territoryCode: t.Optional(t.String()),
      type: t.Optional(t.String()),
      source: t.Optional(t.String()),
      country: t.Optional(t.String())
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Update employee',
      description: 'Update an existing employee'
    }
  })
  .delete('/:id', async ({ params, set }) => {
    try {
      const id = parseInt(params.id)
      
      const deletedEmployee = await db.delete(employees)
        .where(eq(employees.id, id))
        .returning()

      if (deletedEmployee.length === 0) {
        set.status = 404
        return { error: 'Employee not found' }
      }

      set.status = 204
      return
    } catch (error) {
      set.status = 500
      return { error: 'Failed to delete employee' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Delete employee',
      description: 'Delete an employee'
    }
  })
  .post('/import', async ({ body, set }) => {
    try {
      const { employees: employeeData } = body
      let successCount = 0
      const errors: string[] = []

      for (const emp of employeeData) {
        try {
          await db.insert(employees).values({
            employeeId: emp.employeeId,
            fullname: emp.fullname,
            employeeCode: emp.employeeCode,
            status: emp.status || 'A',
            startActiveDate: emp.startActiveDate ? new Date(emp.startActiveDate) : new Date(),
            areaCode: emp.areaCode,
            territoryCode: emp.territoryCode,
            type: emp.type,
            source: emp.source || 'import',
            country: emp.country || 'ID',
            createdAt: new Date(),
            updatedAt: new Date()
          })
          successCount++
        } catch (error) {
          errors.push(`Failed to import employee ${emp.employeeId}: ${error}`)
        }
      }

      return {
        success: successCount,
        errors
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to import employees' }
    }
  }, {
    body: t.Object({
      employees: t.Array(t.Object({
        employeeId: t.String(),
        fullname: t.String(),
        employeeCode: t.Optional(t.String()),
        status: t.Optional(t.String()),
        startActiveDate: t.Optional(t.String()),
        areaCode: t.Optional(t.String()),
        territoryCode: t.Optional(t.String()),
        type: t.Optional(t.String()),
        source: t.Optional(t.String()),
        country: t.Optional(t.String())
      }))
    }),
    detail: {
      tags: ['Employees'],
      summary: 'Import employees',
      description: 'Import multiple employees from CSV/JSON'
    }
  })