import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { AttendanceService } from '../services/attendance.service'
import { AttendanceModels, CommonModels } from '../models'

export const mobileController = new Elysia({ prefix: '/mobile' })
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  }))
  .model({
    'attendance.submission': AttendanceModels.submission,
    'attendance.historyQuery': AttendanceModels.historyQuery,
    'attendance.response': AttendanceModels.response,
    'common.error': CommonModels.error
  })
  .derive(async ({ headers, jwt, set }) => {
    // Manual JWT decoding since auth middleware doesn't work properly in Docker
    const authorization = headers.authorization
    
    if (!authorization) {
      set.status = 401
      throw new Error('Authorization header required')
    }

    const token = authorization.startsWith('Bearer ') 
      ? authorization.slice(7) 
      : authorization

    try {
      const payload = await jwt.verify(token) as any
      if (!payload || !payload.userId) {
        set.status = 401
        throw new Error('Invalid token')
      }
      
      return {
        user: payload
      }
    } catch (error) {
      console.error('JWT verification error:', error)
      set.status = 401
      throw new Error('Token verification failed')
    }
  })
  .post('/attendance', async ({ body, user, set }) => {
    try {
      let checkInLat: number, checkInLng: number, checkInAddress: string | undefined
      let checkInPhoto: File | undefined, checkOutPhoto: File | undefined
      let bssid: string | undefined, cellId: string | undefined
      let submissionType: string | undefined, isOfflineSubmission: boolean | undefined
      let offlineTimestamp: Date | undefined

      if (body instanceof FormData || (body && typeof body === 'object' && 'checkInLat' in body)) {
        // Mobile app sends multipart form data
        checkInLat = parseFloat(body.checkInLat as string)
        checkInLng = parseFloat(body.checkInLng as string)
        checkInAddress = body.checkInAddress as string | undefined
        checkInPhoto = body.checkInPhoto as File | undefined
        checkOutPhoto = body.checkOutPhoto as File | undefined
        bssid = body.bssid as string | undefined
        cellId = body.cellId as string | undefined
        submissionType = body.submissionType as string | undefined
        
        // Handle boolean conversion for multipart form data
        isOfflineSubmission = body.isOfflineSubmission === 'true' || body.isOfflineSubmission === true
        
        // Parse offline timestamp if provided
        if (body.offlineTimestamp) {
          offlineTimestamp = new Date(body.offlineTimestamp as string)
        }
      } else {
        // Web app sends JSON
        const jsonBody = body as any
        checkInLat = jsonBody.checkInLat
        checkInLng = jsonBody.checkInLng
        checkInAddress = jsonBody.checkInAddress
        checkInPhoto = jsonBody.checkInPhoto
        checkOutPhoto = jsonBody.checkOutPhoto
        bssid = jsonBody.bssid
        cellId = jsonBody.cellId
        submissionType = jsonBody.submissionType
        isOfflineSubmission = jsonBody.isOfflineSubmission
        offlineTimestamp = jsonBody.offlineTimestamp ? new Date(jsonBody.offlineTimestamp) : undefined
      }

      // Validate required fields
      if (isNaN(checkInLat) || isNaN(checkInLng)) {
        set.status = 422
        return { error: 'Invalid latitude or longitude' }
      }

      // Log sync requests for debugging
      if (isOfflineSubmission) {
        console.log(`📱 Mobile sync request: ${submissionType} at ${offlineTimestamp?.toISOString()} from user ${user.userId}`)
      }

      // Validate offline timestamp if provided
      if (offlineTimestamp && isNaN(offlineTimestamp.getTime())) {
        set.status = 422
        return { error: 'Invalid offline timestamp' }
      }

      // Create attendance record using userId directly
      const attendance = await AttendanceService.createAttendance({
        userId: user.userId, // Use userId directly instead of employeeId
        checkInLat,
        checkInLng,
        checkInAddress,
        bssid,
        cellId,
        submissionType,
        isOfflineSubmission,
        offlineTimestamp
      })

      // Handle photo uploads
      const photoPromises = []

      if (checkInPhoto) {
        photoPromises.push(AttendanceService.savePhoto(attendance.id, 'check_in', checkInPhoto))
      }

      if (checkOutPhoto) {
        photoPromises.push(AttendanceService.savePhoto(attendance.id, 'check_out', checkOutPhoto))
      }

      await Promise.all(photoPromises)

      // Fetch complete attendance with photos
      const completeAttendance = await AttendanceService.getAttendanceWithDetails(attendance.id)

      set.status = 201
      return {
        message: isOfflineSubmission 
          ? 'Offline attendance submitted successfully' 
          : 'Attendance submitted successfully',
        attendance: completeAttendance,
        submissionType: submissionType || 'check_in',
        isOfflineSubmission: isOfflineSubmission || false
      }
    } catch (error) {
      set.status = 500
      return { 
        error: error instanceof Error ? error.message : 'Failed to submit attendance' 
      }
    }
  }, {
    body: 'attendance.submission',
    response: {
      201: 'attendance.response',
      500: 'common.error'
    },
    detail: {
      tags: ['Mobile'],
      summary: 'Submit attendance',
      description: 'Submit attendance with GPS coordinates, photos, and support for offline submissions'
    }
  })
  .get('/attendance/today', async ({ user }) => {
    const todayAttendances = await AttendanceService.getUserAttendanceByDate(
      user.userId, // Use userId directly
      new Date()
    )

    return {
      attendances: todayAttendances,
      date: new Date().toISOString().split('T')[0],
      count: todayAttendances.length
    }
  }, {
    detail: {
      tags: ['Mobile'],
      summary: 'Get today\'s attendance',
      description: 'Get all attendance submissions for today'
    }
  })
  .get('/attendance/offline', async ({ user }) => {
    const offlineAttendances = await AttendanceService.getOfflineSubmissions(user.userId) // Use userId directly

    return {
      attendances: offlineAttendances,
      count: offlineAttendances.length
    }
  }, {
    detail: {
      tags: ['Mobile'],
      summary: 'Get offline submissions',
      description: 'Get all attendance submissions that were made offline'
    }
  })
  .get('/attendance/history', async ({ query, user }) => {
    const limit = query.limit ? parseInt(query.limit) : 30

    const userAttendances = await AttendanceService.getUserAttendanceHistory(user.userId, limit) // Use userId directly

    return {
      attendances: userAttendances
    }
  }, {
    query: 'attendance.historyQuery',
    detail: {
      tags: ['Mobile'],
      summary: 'Get attendance history',
      description: 'Get user attendance history with optional limit'
    }
  })