import { Elysia, t } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { OfficeService } from '../services/office.service'
import { MasterOfficeModels, CreateOfficeModel, UpdateOfficeModel } from '../models'

export const officeController = new Elysia({ prefix: '/offices' })
  .use(authPlugin)
  .model({
    'office.create': t.Object({
      ...CreateOfficeModel
    }),
    'office.update': t.Object({
      ...UpdateOfficeModel
    })
  })
  .get('/', async () => {
    const offices = await OfficeService.getAllOffices()
    return offices
  }, {
    detail: {
      tags: ['Offices'],
      summary: 'Get all offices',
      description: 'Get list of all master offices'
    }
  })
  .get('/:id', async ({ params, set }) => {
    const id = parseInt(params.id)
    const office = await OfficeService.getOfficeById(id)

    if (!office) {
      set.status = 404
      return { error: 'Office not found' }
    }

    return office
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    detail: {
      tags: ['Offices'],
      summary: 'Get office by ID',
      description: 'Get details of a specific office'
    }
  })
  .post('/', async ({ body, set }) => {
    try {
      const office = await OfficeService.createOffice(body)
      set.status = 201
      return office
    } catch (error) {
      set.status = 500
      return { error: 'Failed to create office' }
    }
  }, {
    body: 'office.create',
    detail: {
      tags: ['Offices'],
      summary: 'Create office',
      description: 'Create a new master office'
    }
  })
  .put('/:id', async ({ params, body, set }) => {
    try {
      const id = parseInt(params.id)
      const office = await OfficeService.updateOffice(id, body)

      if (!office) {
        set.status = 404
        return { error: 'Office not found' }
      }

      return office
    } catch (error) {
      set.status = 500
      return { error: 'Failed to update office' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    body: 'office.update',
    detail: {
      tags: ['Offices'],
      summary: 'Update office',
      description: 'Update an existing master office'
    }
  })
  .delete('/:id', async ({ params, set }) => {
    try {
      const id = parseInt(params.id)
      const office = await OfficeService.deleteOffice(id)

      if (!office) {
        set.status = 404
        return { error: 'Office not found' }
      }

      return { message: 'Office deleted successfully' }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to delete office' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9]+$' })
    }),
    detail: {
      tags: ['Offices'],
      summary: 'Delete office',
      description: 'Delete a master office'
    }
  })