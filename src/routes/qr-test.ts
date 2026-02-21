import { Elysia, t } from 'elysia'
import { QRVerificationService } from '../services/qr-verification.service'

export const qrTestController = new Elysia({ prefix: '/qr-test' })
  .post('/detect', async ({ body, set }) => {
    try {
      const { photo } = body as { photo: File }

      if (!photo) {
        set.status = 400
        return { error: 'Photo is required' }
      }

      console.log('=== QR Test Endpoint ===')
      console.log('File:', photo.name, photo.type, photo.size)

      // Detect QR code
      const qrData = await QRVerificationService.detectQRCode(photo)

      if (!qrData) {
        return {
          success: false,
          message: 'No QR code detected',
          qrData: null
        }
      }

      // Verify against offices
      const verification = await QRVerificationService.verifyOfficeQRCode(qrData)

      return {
        success: true,
        qrData,
        verification
      }
    } catch (error) {
      console.error('QR test error:', error)
      set.status = 500
      return {
        error: error instanceof Error ? error.message : 'Failed to process image'
      }
    }
  }, {
    body: t.Object({
      photo: t.File()
    }),
    detail: {
      tags: ['QR Test'],
      summary: 'Test QR code detection',
      description: 'Upload a photo to test QR code detection and verification'
    }
  })
  .get('/offices', async () => {
    const { db, masterOffice } = await import('../db')
    const { eq } = await import('drizzle-orm')
    
    const offices = await db.query.masterOffice.findMany({
      where: eq(masterOffice.status, 'active')
    })

    const phone = process.env.CHATBOT_NO || ''

    return offices.map(office => ({
      id: office.id,
      name: office.officeName,
      expectedQRData: `https://wa.me/${phone}?text=${encodeURIComponent('#' + office.officeName)}`,
      hasQRCode: !!office.qrCode
    }))
  }, {
    detail: {
      tags: ['QR Test'],
      summary: 'List offices with expected QR data',
      description: 'Get list of offices and their expected QR code data for testing'
    }
  })
