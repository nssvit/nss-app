import { requireApiAdmin } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const PUT = withApiHandler(async (request, { params }) => {
  await requireApiAdmin(request)
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.category_name ?? body.categoryName) updates.categoryName = body.category_name ?? body.categoryName
  if (body.code !== undefined) updates.code = body.code
  if (body.description !== undefined) updates.description = body.description
  if (body.color_hex !== undefined || body.colorHex !== undefined)
    updates.colorHex = body.color_hex ?? body.colorHex

  const result = await queries.updateCategory(parseInt(id, 10), updates)
  return apiSuccess(toSnakeCase(result))
})

export const DELETE = withApiHandler(async (request, { params }) => {
  await requireApiAdmin(request)
  const { id } = await params
  const result = await queries.deleteCategory(parseInt(id, 10))
  return apiSuccess(toSnakeCase(result))
})
