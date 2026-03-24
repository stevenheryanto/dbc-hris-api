import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { AuthService } from '../services/auth.service'
import { AuthModels, CommonModels } from '../models'
import { config } from '../config'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'

export const authController = new Elysia({ prefix: '/auth' })
  .use(jwt({
    name: 'jwt',
    secret: config.jwt.secret
  }))
  .model({
    'auth.login': AuthModels.login,
    'auth.register': AuthModels.register,
    'auth.loginResponse': AuthModels.loginResponse,
    'common.error': CommonModels.error
  })
  .post('/login', async ({ body, jwt, set }) => {
    try {
      const { email, password } = body

      const user = await AuthService.validateCredentials(email, password)

      // Generate JWT token
      const token = await jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role
      })

      return {
        token,
        user: {
          id: user.id,
          email: user.email || user.username,
          name: user.name || user.username,
          role: user.role,
          phone: user.phone ?? null
        }
      }
    } catch (error) {
      set.status = 401
      return { 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      }
    }
  }, {
    body: 'auth.login',
    response: {
      200: 'auth.loginResponse',
      401: 'common.error'
    },
    detail: {
      tags: ['Auth'],
      summary: 'User login',
      description: 'Authenticate user and return JWT token'
    }
  })
  .post('/register', async ({ body, jwt, set }) => {
    try {
      const { name, employeeId, email, phone, password } = body

      const user = await AuthService.createUser({
        username: email,
        email,
        name,
        employeeId,
        phone,
        password,
        role: 'user'
      })

      const token = await jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role
      })

      return {
        token,
        user: {
          id: user.id,
          email: user.email || user.username,
          name: user.name || user.username,
          role: user.role,
          phone: user.phone ?? null
        }
      }
    } catch (error) {
      set.status = 400
      return { 
        error: error instanceof Error ? error.message : 'Registration failed' 
      }
    }
  }, {
    body: 'auth.register',
    response: {
      200: 'auth.loginResponse',
      400: 'common.error'
    },
    detail: {
      tags: ['Auth'],
      summary: 'User registration',
      description: 'Register new user and return JWT token'
    }
  })
  .post('/google-login', async ({ body, jwt, set }) => {
    try {
      const { email } = body

      const found = await db.select().from(users).where(eq(users.email, email)).limit(1)

      if (found.length === 0) {
        // User doesn't exist — tell the app to show registration form
        set.status = 404
        return { error: 'USER_NOT_FOUND' }
      }

      const foundUser = found[0]

      if (!foundUser.isActive) {
        set.status = 403
        return { error: 'Account is inactive' }
      }

      const token = await jwt.sign({
        userId: foundUser.id,
        username: foundUser.username,
        role: foundUser.role
      })

      return {
        token,
        user: {
          id: foundUser.id,
          email: foundUser.email || foundUser.username,
          name: foundUser.name || foundUser.username,
          role: foundUser.role,
          phone: foundUser.source ?? null
        }
      }
    } catch (error) {
      set.status = 400
      return { error: error instanceof Error ? error.message : 'Google login failed' }
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' })
    }),
    detail: {
      tags: ['Auth'],
      summary: 'Google login',
      description: 'Login existing user via Google. Returns 404 with USER_NOT_FOUND if not registered yet.'
    }
  })
  .post('/google-register', async ({ body, jwt, set }) => {
    try {
      const { email, name, employeeId, phone } = body

      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (existing.length > 0) {
        set.status = 409
        return { error: 'Email already registered' }
      }

      const randomPassword = Math.random().toString(36).slice(-16)
      const hashedPassword = await AuthService.hashPassword(randomPassword)

      const inserted = await db.insert(users).values({
        username: email,
        email,
        name,
        employeeId,
        password: hashedPassword,
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      const newUser = inserted[0]

      const token = await jwt.sign({
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role
      })

      return {
        token,
        user: {
          id: newUser.id,
          email: newUser.email || newUser.username,
          name: newUser.name || newUser.username,
          role: newUser.role,
          phone: phone ?? null
        }
      }
    } catch (error) {
      set.status = 400
      return { error: error instanceof Error ? error.message : 'Google registration failed' }
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      name: t.String(),
      employeeId: t.String(),
      phone: t.Optional(t.String())
    }),
    detail: {
      tags: ['Auth'],
      summary: 'Google register',
      description: 'Register a new user via Google with NIP/ID and phone number'
    }
  })