import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { AuthService } from '../services/auth.service'
import { AuthModels, CommonModels } from '../models'
import { config } from '../config'

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
          email: user.username,
          name: user.username,
          role: user.role
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
      const { name, email, password } = body

      const user = await AuthService.createUser({
        username: email,
        email,
        name,
        password,
        role: 'user'
      })

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
          role: user.role
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