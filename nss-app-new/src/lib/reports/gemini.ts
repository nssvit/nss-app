import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_NAME = 'gemini-2.5-flash'
const PROMPT_PATH = join(process.cwd(), 'src', 'lib', 'reports', 'prompts', 'nss-report.txt')

let cachedPrompt: string | null = null

async function loadSystemPrompt(): Promise<string> {
  if (cachedPrompt) return cachedPrompt
  cachedPrompt = await readFile(PROMPT_PATH, 'utf-8')
  return cachedPrompt
}

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  return new GoogleGenerativeAI(key)
}

export interface NssReportInput {
  /** Pre-formatted event details block (name, date, venue, time, volunteers with gender). */
  eventData: string
  /** The one-sentence major objective supplied by the user. */
  majorObjective: string
  /** Scheme and organizing unit string (e.g. "AB2 / Shivprerna"). */
  schemeOrganizer: string
}

/** Primary model — falls back if it's overloaded. */
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash']

function isTransientGeminiError(err: unknown): boolean {
  const e = err as { status?: number; message?: string }
  if (e?.status === 503 || e?.status === 429 || e?.status === 500) return true
  const msg = (e?.message ?? '').toLowerCase()
  return msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand')
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Call Gemini and return the raw markdown report content.
 * Extracts the ```md ... ``` fenced block from the response.
 * Retries on transient 503/429; falls back to older Flash models if
 * the primary model stays overloaded.
 */
export async function generateNssMarkdown(input: NssReportInput): Promise<string> {
  const systemInstruction = await loadSystemPrompt()
  const client = getClient()
  const userMessage = [
    `Event: ${input.eventData}`,
    `Major Objective: ${input.majorObjective}`,
    `Scheme & organizing unit: ${input.schemeOrganizer}`,
  ].join('\n')

  const modelsToTry = [MODEL_NAME, ...FALLBACK_MODELS]
  let lastErr: unknown

  for (const modelName of modelsToTry) {
    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction,
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'text/plain',
      },
    })

    // Retry up to 3 attempts per model with exponential backoff (1s, 2s, 4s).
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(userMessage)
        const text = result.response.text()
        const fence = text.match(/```(?:md|markdown)\s*([\s\S]*?)```/i)
        if (!fence) {
          throw new Error('Gemini response did not contain a ```md fenced block')
        }
        return fence[1].trim()
      } catch (err) {
        lastErr = err
        if (!isTransientGeminiError(err)) throw err
        if (attempt < 2) await sleep(1000 * Math.pow(2, attempt))
      }
    }
    // All retries exhausted for this model — try next fallback.
  }

  throw new Error(
    'Gemini is overloaded right now. Please try again in a minute. ' +
      (lastErr instanceof Error ? `(${lastErr.message})` : '')
  )
}
