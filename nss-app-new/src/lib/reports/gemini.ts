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

/**
 * Call Gemini and return the raw markdown report content.
 * Extracts the ```md ... ``` fenced block from the response.
 */
export async function generateNssMarkdown(input: NssReportInput): Promise<string> {
  const systemInstruction = await loadSystemPrompt()
  const client = getClient()
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'text/plain',
    },
  })

  const userMessage = [
    `Event: ${input.eventData}`,
    `Major Objective: ${input.majorObjective}`,
    `Scheme & organizing unit: ${input.schemeOrganizer}`,
  ].join('\n')

  const result = await model.generateContent(userMessage)
  const text = result.response.text()

  const fence = text.match(/```(?:md|markdown)\s*([\s\S]*?)```/i)
  if (!fence) {
    throw new Error('Gemini response did not contain a ```md fenced block')
  }
  return fence[1].trim()
}
