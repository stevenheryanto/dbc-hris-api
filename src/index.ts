import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { errorHandler } from './plugins/error-handler'
import { authController } from './routes/auth'
import { mobileController } from './routes/mobile'
import { adminController } from './routes/admin'
import { employeesController } from './routes/employees'
import { attendanceController } from './routes/attendance'
import { config } from './config'
import { initDatabase } from './db'

// Initialize database
await initDatabase()

const app = new Elysia()
  .use(errorHandler)
  .use(cors({
    origin: config.server.cors.origin,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: config.server.cors.credentials
  }))
  .use(swagger({
    documentation: {
      info: {
        title: config.app.name,
        version: config.app.version,
        description: 'HRIS API with attendance photo upload functionality'
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Mobile', description: 'Mobile app endpoints' },
        { name: 'Admin', description: 'Admin panel endpoints' },
        { name: 'Employees', description: 'Employee management endpoints' },
        { name: 'Attendance', description: 'Attendance management endpoints' }
      ]
    }
  }))
  .get('/', () => ({ 
    message: config.app.name,
    version: config.app.version,
    framework: 'ElysiaJS with Bun',
    environment: config.app.environment
  }))
  .group('/api', (app) => 
    app
      .use(authController)
      .use(mobileController)
      .use(adminController)
      .use(employeesController)
      .use(attendanceController)
  )
  .listen(config.server.port)

console.log(`🚀 Server running at http://${config.server.host}:${config.server.port}`)
console.log(`📚 Swagger documentation at http://${config.server.host}:${config.server.port}/swagger`)
console.log(`🌍 Environment: ${config.app.environment}`)

export type App = typeof app