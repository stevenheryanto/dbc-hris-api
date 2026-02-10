import { db, masterOffice } from '../db'
import { eq, desc } from 'drizzle-orm'
import QRCode from 'qrcode'

export class OfficeService {
  static async createOffice(data: {
    officeName: string;
    officeDescription: string;
    checkInLat: number;
    checkInLng: number;
    checkInAddress: string;
    // qrCode?: string;
    status?: string;
  }) {
    const tempQRCode = await QRCode.toDataURL(`OFFICE:${data.officeName}:${Date.now()}`);
    const [office] = await db.insert(masterOffice).values({
      officeName: data.officeName,
      officeDescription: data.officeDescription,
      checkInLat: data.checkInLat.toString(),
      checkInLng: data.checkInLng.toString(),
      checkInAddress: data.checkInAddress,
      qrCode: tempQRCode,
      status: data.status || 'active'
    }).returning()

    return office
  }

  static async getOfficeById(officeId: number) {
    const office = await db.query.masterOffice.findFirst({
      where: eq(masterOffice.id, officeId)
    })

    if (!office) return null

    // Postgres numeric/decimal types are often returned as strings by the driver.
    // Normalize to numbers for the API layer.
    return {
      ...office,
      checkInLat: office.checkInLat !== null && office.checkInLat !== undefined ? parseFloat((office.checkInLat as any) as string) : office.checkInLat,
      checkInLng: office.checkInLng !== null && office.checkInLng !== undefined ? parseFloat((office.checkInLng as any) as string) : office.checkInLng,
    }
  }

  static async getAllOffices() {
    const offices = await db.query.masterOffice.findMany({
      orderBy: [desc(masterOffice.createdAt)]
    })

    return offices.map(o => ({
      ...o,
      checkInLat: o.checkInLat !== null && o.checkInLat !== undefined ? parseFloat((o.checkInLat as any) as string) : o.checkInLat,
      checkInLng: o.checkInLng !== null && o.checkInLng !== undefined ? parseFloat((o.checkInLng as any) as string) : o.checkInLng,
    }))
  }

  static async updateOffice(id: number, data: Partial<{
    officeName: string;
    officeDescription: string;
    checkInLat: number;
    checkInLng: number;
    checkInAddress: string;
    qrCode: string;
    status: string;
  }>) {
    const updateData: any = { ...data, updatedAt: new Date() }
    
    if (data.checkInLat !== undefined) updateData.checkInLat = data.checkInLat.toString()
    if (data.checkInLng !== undefined) updateData.checkInLng = data.checkInLng.toString()
    if (data.qrCode !== undefined) {
      updateData.qr_code = data.qrCode
      delete updateData.qrCode
    }

    const [updatedOffice] = await db.update(masterOffice)
      .set(updateData)
      .where(eq(masterOffice.id, id))
      .returning()

    return updatedOffice
  }

  static async deleteOffice(id: number) {
    const [deletedOffice] = await db.delete(masterOffice)
      .where(eq(masterOffice.id, id))
      .returning()

    return deletedOffice
  }
}