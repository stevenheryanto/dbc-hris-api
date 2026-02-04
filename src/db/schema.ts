import { pgTable, bigserial, varchar, text, timestamp, boolean, decimal, bigint, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const employees = pgTable('employee', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().unique(),
  userAccount: varchar('user_account', { length: 50 }),
  fullname: varchar('fullname', { length: 191 }),
  employeeCode: varchar('employee_code', { length: 50 }),
  status: varchar('status', { length: 1 }).notNull().default('A'),
  startActiveDate: timestamp('start_active_date'),
  areaCode: varchar('area_code', { length: 50 }),
  territoryCode: varchar('territory_code', { length: 50 }),
  type: varchar('type', { length: 50 }),
  source: varchar('source', { length: 191 }),
  country: varchar('country', { length: 3 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  statusActiveIdx: index('idx_employee_status_active_date').on(table.status, table.startActiveDate),
  locationIdx: index('idx_employee_location').on(table.areaCode)
}))

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }).unique(),
  name: varchar('name', { length: 100 }),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).default('user'),
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const attendances = pgTable('attendances', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id),
  checkInTime: timestamp('check_in_time').notNull(),
  checkInLat: decimal('check_in_lat', { precision: 10, scale: 8 }),
  checkInLng: decimal('check_in_lng', { precision: 11, scale: 8 }),
  checkInAddress: varchar('check_in_address', { length: 255 }),
  bssid: varchar('bssid', { length: 17 }), // MAC address format: XX:XX:XX:XX:XX:XX
  cellId: varchar('cell_id', { length: 50 }), // Cell tower ID
  checkOutTime: timestamp('check_out_time'),
  checkOutLat: decimal('check_out_lat', { precision: 10, scale: 8 }),
  checkOutLng: decimal('check_out_lng', { precision: 11, scale: 8 }),
  checkOutAddress: varchar('check_out_address', { length: 255 }),
  status: varchar('status', { length: 20 }).default('pending'),
  adminNotes: text('admin_notes'),
  submissionType: varchar('submission_type', { length: 20 }).default('check_in'), // 'check_in', 'check_out', 'break_start', 'break_end'
  isOfflineSubmission: boolean('is_offline_submission').default(false),
  offlineTimestamp: timestamp('offline_timestamp'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  employeeIdx: index('idx_attendances_employee').on(table.employeeId),
  statusCreatedIdx: index('idx_attendances_status_created').on(table.status, table.createdAt),
  employeeDateIdx: index('idx_attendances_employee_date').on(table.employeeId, table.checkInTime),
  offlineIdx: index('idx_attendances_offline').on(table.isOfflineSubmission, table.offlineTimestamp)
}))

export const attendancePhotos = pgTable('attendance_photos', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  attendanceId: bigint('attendance_id', { mode: 'number' }).notNull().references(() => attendances.id, { onDelete: 'cascade' }),
  photoType: varchar('photo_type', { length: 20 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  mimeType: varchar('mime_type', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  attendanceIdx: index('idx_attendance_photos_attendance').on(table.attendanceId),
  deletedAtIdx: index('idx_attendance_photos_deleted_at').on(table.deletedAt)
}))

// Relations
export const employeesRelations = relations(employees, ({ many, one }) => ({
  user: one(users, {
    fields: [employees.id],
    references: [users.employeeId]
  }),
  attendances: many(attendances)
}))

export const usersRelations = relations(users, ({ one }) => ({
  employee: one(employees, {
    fields: [users.employeeId],
    references: [employees.id]
  })
}))

export const attendancesRelations = relations(attendances, ({ one, many }) => ({
  employee: one(employees, {
    fields: [attendances.employeeId],
    references: [employees.id]
  }),
  photos: many(attendancePhotos)
}))

export const attendancePhotosRelations = relations(attendancePhotos, ({ one }) => ({
  attendance: one(attendances, {
    fields: [attendancePhotos.attendanceId],
    references: [attendances.id]
  })
}))

export type Employee = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Attendance = typeof attendances.$inferSelect
export type NewAttendance = typeof attendances.$inferInsert
export type AttendancePhoto = typeof attendancePhotos.$inferSelect
export type NewAttendancePhoto = typeof attendancePhotos.$inferInsert