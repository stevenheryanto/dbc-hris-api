import { db, attendances, attendancePhotos } from '../db'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { config } from '../config'

export class AttendanceService {
  static async createAttendance(data: {
    userId: number // Changed from employeeId to userId
    checkInLat: number
    checkInLng: number
    checkInAddress?: string
    bssid?: string
    cellId?: string
    submissionType?: string
    isOfflineSubmission?: boolean
    offlineTimestamp?: Date
  }) {
    const checkInTime = data.isOfflineSubmission && data.offlineTimestamp 
      ? data.offlineTimestamp 
      : new Date()

    const [attendance] = await db.insert(attendances).values({
      userId: data.userId, // Changed from employeeId to userId
      checkInTime,
      checkInLat: data.checkInLat.toString(),
      checkInLng: data.checkInLng.toString(),
      checkInAddress: data.checkInAddress,
      bssid: data.bssid,
      cellId: data.cellId,
      submissionType: data.submissionType || 'check_in',
      isOfflineSubmission: data.isOfflineSubmission || false,
      offlineTimestamp: data.offlineTimestamp,
      status: 'pending'
    }).returning()

    return attendance
  }

  static async savePhoto(attendanceId: number, photoType: string, file: File) {
    // Ensure upload directory exists
    const uploadDir = config.upload.path
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${photoType}_${uuidv4()}_${Date.now()}.${ext}`
    const filePath = join(uploadDir, filename)

    // Save file
    await Bun.write(filePath, file)

    // Save photo record to database
    await db.insert(attendancePhotos).values({
      attendanceId,
      photoType,
      fileName: filename,
      filePath,
      fileSize: file.size,
      mimeType: file.type
    })
  }

  static async getAttendanceWithDetails(attendanceId: number) {
    return db.query.attendances.findFirst({
      where: eq(attendances.id, attendanceId),
      with: {
        user: true, // Changed from employee to user
        photos: true
      }
    })
  }

  static async getUserAttendanceHistory(userId: number, limit: number = 30) {
    return db.query.attendances.findMany({
      where: eq(attendances.userId, userId), // Changed from employeeId to userId
      orderBy: [desc(attendances.checkInTime)],
      limit,
      with: {
        photos: true
      }
    })
  }

  static async getUserAttendanceByDate(userId: number, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return db.query.attendances.findMany({
      where: and(
        eq(attendances.userId, userId), // Changed from employeeId to userId
        gte(attendances.checkInTime, startOfDay),
        lte(attendances.checkInTime, endOfDay)
      ),
      orderBy: [desc(attendances.checkInTime)],
      with: {
        photos: true
      }
    })
  }

  static async getOfflineSubmissions(userId: number) {
    return db.query.attendances.findMany({
      where: and(
        eq(attendances.userId, userId), // Changed from employeeId to userId
        eq(attendances.isOfflineSubmission, true)
      ),
      orderBy: [desc(attendances.offlineTimestamp)],
      with: {
        photos: true
      }
    })
  }

  static async getPendingAttendances() {
    return db.query.attendances.findMany({
      where: eq(attendances.status, 'pending'),
      orderBy: [desc(attendances.createdAt)],
      with: {
        user: true, // Changed from employee to user
        photos: true
      }
    })
  }

  static async updateAttendanceStatus(id: number, status: 'approved' | 'rejected', adminNotes?: string) {
    const [updatedAttendance] = await db
      .update(attendances)
      .set({
        status,
        adminNotes,
        updatedAt: new Date()
      })
      .where(eq(attendances.id, id))
      .returning()

    return updatedAttendance
  }

  static async getAttendanceReports(startDate: Date, endDate: Date) {
    return db.query.attendances.findMany({
      where: and(
        gte(attendances.createdAt, startDate),
        lte(attendances.createdAt, endDate)
      ),
      orderBy: [desc(attendances.createdAt)],
      with: {
        user: true, // Changed from employee to user
        photos: true
      }
    })
  }
}