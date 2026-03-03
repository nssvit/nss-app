/**
 * API Response Helpers
 *
 * Standard response format and error handling for REST API routes.
 * Includes snake_case conversion for Flutter compatibility.
 */

import { NextResponse } from 'next/server'
import { ApiError } from './api-auth'
import { getErrorMessage } from './error-utils'

/** Standard success response: { data: T } */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status })
}

/** Standard error response: { error: string } */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response>

/**
 * Wrap a route handler with error catching.
 * Converts ApiError → structured JSON response.
 * Catches unexpected errors → 500.
 */
export function withApiHandler(fn: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await fn(request, context)
    } catch (err) {
      if (err instanceof ApiError) {
        return apiError(err.message, err.status)
      }
      console.error('[API Error]', err)
      return apiError(getErrorMessage(err, 'Internal server error'), 500)
    }
  }
}

/**
 * Convert a camelCase key to snake_case.
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Recursively convert all keys in an object from camelCase to snake_case.
 * Handles nested objects, arrays, and preserves null/primitive values.
 */
export function toSnakeCase<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj.toISOString() as T
  if (Array.isArray(obj)) return obj.map(toSnakeCase) as T
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[camelToSnake(key)] = toSnakeCase(value)
    }
    return result as T
  }
  return obj
}

/** Convenience: convert an array of objects to snake_case */
export function toSnakeCaseArray<T>(arr: T[]): T[] {
  return arr.map(toSnakeCase)
}
