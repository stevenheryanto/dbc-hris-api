import { status, t } from 'elysia'

// Auth Models
export const LoginModel = t.Object({
  email: t.String({ format: 'email', maxLength: 100 }),
  password: t.String({ minLength: 1, maxLength: 255 })
})

export const RegisterModel = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  email: t.String({ format: 'email', maxLength: 100 }),
  password: t.String({ minLength: 6, maxLength: 255 }),
  confirmPassword: t.String({ minLength: 6, maxLength: 255 })
})

export const LoginResponseModel = t.Object({
  token: t.String(),
  user: t.Object({
    id: t.Number(),
    email: t.String(),
    name: t.String(),
    role: t.String()
  })
})

// Attendance Models
export const AttendanceSubmissionModel = t.Object({
  checkInLat: t.Union([t.Number({ minimum: -90, maximum: 90 }), t.String()]), // Accept both number and string for multipart
  checkInLng: t.Union([t.Number({ minimum: -180, maximum: 180 }), t.String()]), // Accept both number and string for multipart
  checkInAddress: t.Optional(t.String({ maxLength: 255 })),
  bssid: t.Optional(t.String({ maxLength: 17 })), // Wi-Fi MAC address
  cellId: t.Optional(t.String({ maxLength: 50 })), // Cell tower ID
  submissionType: t.Optional(t.Union([
    t.Literal('check_in'),
    t.Literal('check_out'), 
    t.Literal('break_start'),
    t.Literal('break_end')
  ])),
  isOfflineSubmission: t.Optional(t.Union([t.Boolean(), t.String()])), // Accept both boolean and string for multipart
  offlineTimestamp: t.Optional(t.Union([t.String(), t.Date()])), // ISO string or Date object
  checkInPhoto: t.Optional(t.File()),
  checkOutPhoto: t.Optional(t.File())
})

export const AttendanceHistoryQueryModel = t.Object({
  limit: t.Optional(t.String({ pattern: '^[0-9]+$' }))
})

export const ReviewRequestModel = t.Object({
  adminNotes: t.Optional(t.String({ maxLength: 1000 }))
})

export const AttendanceReportsQueryModel = t.Object({
  startDate: t.Optional(t.String({ format: 'date' })),
  endDate: t.Optional(t.String({ format: 'date' }))
})

// Response Models
export const AttendanceResponseModel = t.Object({
  message: t.String(),
  attendance: t.Any() // Will be inferred from database schema
})

export const ErrorResponseModel = t.Object({
  error: t.String()
})

// Model Groups
export const AuthModels = {
  login: LoginModel,
  register: RegisterModel,
  loginResponse: LoginResponseModel
}

export const AttendanceModels = {
  submission: AttendanceSubmissionModel,
  historyQuery: AttendanceHistoryQueryModel,
  review: ReviewRequestModel,
  reportsQuery: AttendanceReportsQueryModel,
  response: AttendanceResponseModel
}

export const MasterOfficeModels = {
  officeName: t.String({ minLength: 1, maxLength: 255 }),
  officeDescription: t.String({ minLength: 1, maxLength: 255 }),
  checkInLat: t.Number({ minimum: -90, maximum: 90 }),
  checkInLng: t.Number({ minimum: -180, maximum: 180 }),
  checkInAddress: t.String({ maxLength: 255 }),
  qrCode: t.String(),
  status: t.String({ maxLength: 20 })
}

export const CreateOfficeModel = {
  officeName: t.String({ minLength: 1, maxLength: 255 }),
  officeDescription: t.String({ minLength: 1, maxLength: 255 }),
  checkInLat: t.Number({ minimum: -90, maximum: 90 }),
  checkInLng: t.Number({ minimum: -180, maximum: 180 }),
  checkInAddress: t.Optional(t.String({ maxLength: 255 }))
}

export const UpdateOfficeModel = {
  officeName: t.String({ minLength: 1, maxLength: 255 }),
  officeDescription: t.String({ minLength: 1, maxLength: 255 }),
  checkInLat: t.Number({ minimum: -90, maximum: 90 }),
  checkInLng: t.Number({ minimum: -180, maximum: 180 }),
  checkInAddress: t.Optional(t.String({ maxLength: 255 })),
  qrCode: t.Optional(t.String())
}

export const UserDeviceModels = {
  manufacturer: t.String({ maxLength: 100 }),
  model: t.String({ maxLength: 100 }),
  device: t.String({ maxLength: 100 }),
  product: t.String({ maxLength: 100 }),
  sdkInt: t.Number({ minimum: 1 }),
  androidVersion: t.String({ maxLength: 32 }),
  firstSeenAt: t.Date(),
  lastSeenAt: t.Date()
}

export const CommonModels = {
  error: ErrorResponseModel
}

// Type inference
export type LoginBody = typeof LoginModel.static
export type AttendanceSubmission = typeof AttendanceSubmissionModel.static
export type ReviewRequest = typeof ReviewRequestModel.static