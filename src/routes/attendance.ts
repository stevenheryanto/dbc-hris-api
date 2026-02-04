import { Elysia, t } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { AttendanceService } from '../services/attendance.service'

export const attendanceController = new Elysia({ prefix: '/attendance' })
  .use(authPlugin)
  .get('/', async ({ query }) => {
    // Get all attendances with optional filters
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = query.endDate ? new Date(query.endDate) : new Date()

    const attendances = await AttendanceService.getAttendanceReports(startDate, endDate)
    return attendances
  }, {
    query: t.Object({
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String()),
      status: t.Optional(t.String()),
      employeeId: t.Optional(t.String())
    }),
    detail: {
      tags: ['Attendance'],
      summary: 'Get all attendance records',
      description: 'Get attendance records with optional filters'
    }
  })
  .get('/employee/:employeeId', async ({ params, query }) => {
    const employeeId = parseInt(params.employeeId)
    const limit = query.limit ? parseInt(query.limit) : 30

    const attendances = await AttendanceService.getUserAttendanceHistory(employeeId, limit)
    return attendances
  }, {
    params: t.Object({
      employeeId: t.String({ pattern: '^[0-9]+$' })
    }),
    query: t.Object({
      limit: t.Optional(t.String()),
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String())
    }),
    detail: {
      tags: ['Attendance'],
      summary: 'Get employee attendance',
      description: 'Get attendance records for a specific employee'
    }
  })
  .put('/:id/approve', async ({ params, set }) => {
    try {
      const id = parseInt(params.id)
      const updatedAttendance = await AttendanceService.updateAttendanceStatus(id, 'approved')

      if (!updatedAttendance) {
        set.status = 404
        return { error: 'Attendance not found' }
      }

      return {
        message: 'Attendance approved successfully',
        attendance: updatedAttendance
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to approve attendance' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    detail: {
      tags: ['Attendance'],
      summary: 'Approve attendance',
      description: 'Approve an attendance record'
    }
  })
  .put('/:id/reject', async ({ params, body, set }) => {
    try {
      const id = parseInt(params.id)
      const { reason } = body
      
      const updatedAttendance = await AttendanceService.updateAttendanceStatus(id, 'rejected', reason)

      if (!updatedAttendance) {
        set.status = 404
        return { error: 'Attendance not found' }
      }

      return {
        message: 'Attendance rejected successfully',
        attendance: updatedAttendance
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to reject attendance' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    body: t.Object({
      reason: t.String()
    }),
    detail: {
      tags: ['Attendance'],
      summary: 'Reject attendance',
      description: 'Reject an attendance record with reason'
    }
  })