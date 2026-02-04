import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

export interface JWTPayload {
  userId: number
  username: string
  role: string
  iat?: number
  exp?: number
}

export const authPlugin = new Elysia({ name: 'auth' })
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  }))
  .derive(async ({ headers, jwt, set }) => {
    const authorization = headers.authorization
    
    if (!authorization) {
      set.status = 401
      throw new Error('Authorization header required')
    }

    const token = authorization.startsWith('Bearer ') 
      ? authorization.slice(7) 
      : authorization

    try {
      const payload = await jwt.verify(token) as JWTPayload | false
      
      if (!payload) {
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

export const adminPlugin = new Elysia({ name: 'admin' })
  .use(authPlugin)
  .derive(({ user, set }) => {
    if (user.role !== 'admin') {
      set.status = 403
      throw new Error('Admin access required')
    }
    
    return { user }
  })