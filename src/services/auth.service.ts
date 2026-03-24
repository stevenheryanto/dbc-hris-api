import bcrypt from 'bcryptjs'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'

export class AuthService {
  static async validateCredentials(email: string, password: string) {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
    
    if (user.length === 0) {
      throw new Error('Invalid credentials')
    }

    const foundUser = user[0]

    const isValidPassword = await bcrypt.compare(password, foundUser.password)
    if (!isValidPassword) throw new Error('Invalid credentials')
    if (!foundUser.isActive) throw new Error('Account is inactive')

    return {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role || 'user',
      employeeId: foundUser.employeeId,
      phone: foundUser.phone ?? null
    }
  }

  static async createUser(userData: {
    username: string;
    email: string;
    name: string;
    employeeId?: string;
    phone?: string;
    password: string;
    role?: string;
  }) {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.username, userData.username)).limit(1)
    
    if (existingUser.length > 0) {
      throw new Error('User already exists')
    }

    // Check if email already exists
    if (userData.email) {
      const existingEmail = await db.select().from(users).where(eq(users.email, userData.email)).limit(1)
      
      if (existingEmail.length > 0) {
        throw new Error('Email already exists')
      }
    }

    // Check if employeeId already exists
    if (userData.employeeId) {
      const existingEmployeeId = await db.select().from(users).where(eq(users.employeeId, userData.employeeId)).limit(1)
      
      if (existingEmployeeId.length > 0) {
        throw new Error('Employee ID already exists')
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password)

    // Create user
    const newUser = await db.insert(users).values({
      username: userData.username,
      email: userData.email,
      name: userData.name,
      employeeId: userData.employeeId,
      phone: userData.phone,
      password: hashedPassword,
      role: userData.role || 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()

    return {
      id: newUser[0].id,
      username: newUser[0].username,
      email: newUser[0].email,
      name: newUser[0].name,
      role: newUser[0].role,
      phone: newUser[0].phone ?? null
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }
}