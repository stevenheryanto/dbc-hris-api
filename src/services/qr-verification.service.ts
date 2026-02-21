import jsQR from 'jsqr'
import sharp from 'sharp'
import { db, masterOffice } from '../db'
import { eq } from 'drizzle-orm'

export class QRVerificationService {
  /**
   * Detect and decode QR code from image file with multiple attempts
   */
  static async detectQRCode(file: File): Promise<string | null> {
    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      console.log('Starting QR detection, file size:', buffer.length)

      // Try multiple image processing strategies
      const strategies = [
        // Strategy 1: Original image
        { resize: null, grayscale: false, contrast: 1.0, brightness: 1.0 },
        // Strategy 2: Resize to standard size
        { resize: 800, grayscale: false, contrast: 1.0, brightness: 1.0 },
        // Strategy 3: Grayscale
        { resize: 800, grayscale: true, contrast: 1.0, brightness: 1.0 },
        // Strategy 4: High contrast
        { resize: 800, grayscale: true, contrast: 1.5, brightness: 1.0 },
        // Strategy 5: Adjusted brightness
        { resize: 800, grayscale: true, contrast: 1.5, brightness: 1.2 },
        // Strategy 6: Larger size
        { resize: 1200, grayscale: true, contrast: 1.3, brightness: 1.1 },
      ]

      for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i]
        console.log(`Trying strategy ${i + 1}:`, strategy)

        try {
          let processor = sharp(buffer).rotate() // Auto-rotate based on EXIF

          // Apply resize
          if (strategy.resize) {
            processor = processor.resize(strategy.resize, strategy.resize, {
              fit: 'inside',
              withoutEnlargement: false
            })
          }

          // Apply grayscale
          if (strategy.grayscale) {
            processor = processor.grayscale()
          }

          // Apply contrast and brightness
          if (strategy.contrast !== 1.0 || strategy.brightness !== 1.0) {
            processor = processor.modulate({
              brightness: strategy.brightness,
              saturation: strategy.grayscale ? 0 : 1
            }).linear(strategy.contrast, -(128 * strategy.contrast) + 128)
          }

          // Convert to raw pixel data
          const { data, info } = await processor
            .raw()
            .ensureAlpha()
            .toBuffer({ resolveWithObject: true })

          console.log(`Processed image: ${info.width}x${info.height}, channels: ${info.channels}`)

          // Use jsQR to detect QR code
          const code = jsQR(
            new Uint8ClampedArray(data),
            info.width,
            info.height
          )

          if (code) {
            console.log('✓ QR Code detected with strategy', i + 1, ':', code.data)
            return code.data
          }
        } catch (strategyError) {
          console.error(`Strategy ${i + 1} failed:`, strategyError)
        }
      }

      console.log('✗ No QR code detected after all strategies')
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
      console.log('Verifying QR data:', qrData)

      // Get all active offices
      const offices = await db.query.masterOffice.findMany({
        where: eq(masterOffice.status, 'active')
      })

      console.log(`Checking against ${offices.length} active offices`)

      // Check if QR data matches any office
      for (const office of offices) {
        if (!office.qrCode) continue

        // The QR code in DB is a data URL, we need to extract the actual URL
        // Format: https://wa.me/{phone}?text=%23{officeName}
        const phone = process.env.CHATBOT_NO || ''
        const message = encodeURIComponent('#' + office.officeName)
        const expectedQRData = `https://wa.me/${phone}?text=${message}`

        console.log(`Comparing with office "${office.officeName}":`)
        console.log(`  Expected: ${expectedQRData}`)
        console.log(`  Got:      ${qrData}`)

        // Try exact match
        if (qrData === expectedQRData) {
          console.log('✓ Exact match found!')
          return {
            isValid: true,
            officeId: office.id,
            officeName: office.officeName,
            message: `QR code verified for office: ${office.officeName}`
          }
        }

        // Try partial match (in case of URL encoding differences)
        if (qrData.includes(office.officeName) || 
            qrData.includes(encodeURIComponent(office.officeName))) {
          console.log('✓ Partial match found!')
          return {
            isValid: true,
            officeId: office.id,
            officeName: office.officeName,
            message: `QR code verified for office: ${office.officeName}`
          }
        }

        // Try matching the phone number and office name separately
        if (qrData.includes(phone) && qrData.toLowerCase().includes(office.officeName.toLowerCase())) {
          console.log('✓ Phone and office name match found!')
          return {
            isValid: true,
            officeId: office.id,
            officeName: office.officeName,
            message: `QR code verified for office: ${office.officeName}`
          }
        }
      }

      console.log('✗ No matching office found')
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
    console.log('=== Starting QR Verification ===')
    console.log('File name:', file.name)
    console.log('File type:', file.type)
    console.log('File size:', file.size)

    // Detect QR code in image
    const qrData = await this.detectQRCode(file)

    if (!qrData) {
      console.log('✗ Verification failed: No QR code detected')
      return {
        isValid: false,
        message: 'Tidak ada QR code terdeteksi. Pastikan QR code kantor terlihat jelas dalam foto selfie Anda.'
      }
    }

    console.log('QR data found:', qrData)

    // Verify QR code matches an office
    const verification = await this.verifyOfficeQRCode(qrData)

    console.log('Verification result:', verification)
    console.log('=== QR Verification Complete ===')

    return {
      ...verification,
      qrData
    }
  }
}
