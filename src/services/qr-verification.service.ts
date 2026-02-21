import jsQR from 'jsqr'
import sharp from 'sharp'
import { db, masterOffice } from '../db'
import { eq } from 'drizzle-orm'

export class QRVerificationService {
  /**
   * Detect and decode QR code from image file
   */
  static async detectQRCode(file: File): Promise<string | null> {
    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Convert image to raw pixel data using sharp
      const { data, info } = await sharp(buffer)
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true })

      // Use jsQR to detect QR code
      const code = jsQR(
        new Uint8ClampedArray(data),
        info.width,
        info.height
      )

      if (code) {
        console.log('QR Code detected:', code.data)
        return code.data
      }

      console.log('No QR code detected in image')
      return null
    } catch (error) {
      console.error('Error detecting QR code:', error)
      return null
    }
  }

  /**
   * Verify if the detected QR code matches any office QR code
   */
  static async verifyOfficeQRCode(qrData: string): Promise<{
    isValid: boolean
    officeId?: number
    officeName?: string
    message: string
  }> {
    try {
      // Get all offices
      const offices = await db.query.masterOffice.findMany({
        where: eq(masterOffice.status, 'active')
      })

      // Check if QR data matches any office
      for (const office of offices) {
        if (!office.qrCode) continue

        // The QR code in DB is a data URL, we need to extract the actual URL
        // Format: https://wa.me/{phone}?text=%23{officeName}
        const phone = process.env.CHATBOT_NO || ''
        const message = encodeURIComponent('#' + office.officeName)
        const expectedQRData = `https://wa.me/${phone}?text=${message}`

        if (qrData === expectedQRData) {
          return {
            isValid: true,
            officeId: office.id,
            officeName: office.officeName,
            message: `QR code verified for office: ${office.officeName}`
          }
        }
      }

      return {
        isValid: false,
        message: 'QR code does not match any registered office'
      }
    } catch (error) {
      console.error('Error verifying QR code:', error)
      return {
        isValid: false,
        message: 'Error verifying QR code'
      }
    }
  }

  /**
   * Verify attendance photo contains valid office QR code
   */
  static async verifyAttendancePhoto(file: File): Promise<{
    isValid: boolean
    officeId?: number
    officeName?: string
    qrData?: string
    message: string
  }> {
    // Detect QR code in image
    const qrData = await this.detectQRCode(file)

    if (!qrData) {
      return {
        isValid: false,
        message: 'No QR code detected in photo. Please ensure the office QR code is visible in your selfie.'
      }
    }

    // Verify QR code matches an office
    const verification = await this.verifyOfficeQRCode(qrData)

    return {
      ...verification,
      qrData
    }
  }
}
