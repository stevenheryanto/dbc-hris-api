import { Elysia, t } from 'elysia'
import { adminPlugin } from '../middleware/auth'
import { AttendanceService } from '../services/attendance.service'
import { AttendanceModels, CommonModels } from '../models'

export const adminController = new Elysia({ prefix: '/admin' })
  .use(adminPlugin)
  .model({
    'attendance.review': AttendanceModels.review,
    'attendance.reportsQuery': AttendanceModels.reportsQuery,
    'attendance.response': AttendanceModels.response,
    'common.error': CommonModels.error
  })
  .get('/attendance/pending', async () => {
    const pendingAttendances = await AttendanceService.getPendingAttendances()

    return {
      attendances: pendingAttendances
    }
  }, {
    detail: {
      tags: ['Admin'],
      summary: 'Get pending attendance',
      description: 'Get all pending attendance submissions for review'
    }
  })
  .post('/attendance/:id/approve', async ({ params, body, set }) => {
    try {
      const id = parseInt(params.id)
      const { adminNotes } = body

      const updatedAttendance = await AttendanceService.updateAttendanceStatus(id, 'approved', adminNotes)

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
      return { 
        error: error instanceof Error ? error.message : 'Failed to approve attendance' 
      }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    body: 'attendance.review',
    response: {
      200: 'attendance.response',
      404: 'common.error',
      500: 'common.error'
    },
    detail: {
      tags: ['Admin'],
      summary: 'Approve attendance',
      description: 'Approve an attendance submission'
    }
  })
  .post('/attendance/:id/reject', async ({ params, body, set }) => {
    try {
      const id = parseInt(params.id)
      const { adminNotes } = body

      const updatedAttendance = await AttendanceService.updateAttendanceStatus(id, 'rejected', adminNotes)

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
      return { 
        error: error instanceof Error ? error.message : 'Failed to reject attendance' 
      }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    body: 'attendance.review',
    response: {
      200: 'attendance.response',
      404: 'common.error',
      500: 'common.error'
    },
    detail: {
      tags: ['Admin'],
      summary: 'Reject attendance',
      description: 'Reject an attendance submission'
    }
  })
  .get('/attendance/reports', async ({ query }) => {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = query.endDate ? new Date(query.endDate) : new Date()

    const reportAttendances = await AttendanceService.getAttendanceReports(startDate, endDate)

    return {
      attendances: reportAttendances,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }, {
    query: 'attendance.reportsQuery',
    detail: {
      tags: ['Admin'],
      summary: 'Get attendance reports',
      description: 'Get attendance reports within date range'
    }
  })