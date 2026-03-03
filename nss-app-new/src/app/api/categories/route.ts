import { getApiUser, requireApiAdmin, ApiError } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase, toSnakeCaseArray } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  await getApiUser(request)
  const categories = await queries.getActiveCategories()
  return apiSuccess(toSnakeCaseArray(categories))
})

export const POST = withApiHandler(async (request) => {
  await requireApiAdmin(request)
  const body = await request.json()

  const categoryName = body.category_name ?? body.categoryName
  const code = body.code

  if (!categoryName || !code) {
    throw new ApiError('category_name and code are required')
  }

  const result = await queries.createCategory({
    categoryName,
    code,
    description: body.description,
    colorHex: body.color_hex ?? body.colorHex,
  })

  return apiSuccess(toSnakeCase(result), 201)
})
