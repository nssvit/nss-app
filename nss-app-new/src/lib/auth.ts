import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { dash } from '@better-auth/infra'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import * as schema from '@/db/schema'

/**
 * Send an email via Resend (HTTP fetch, no packages needed).
 * Falls back to console logging when RESEND_API_KEY is not set.
 */
async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'NSS App <onboarding@resend.dev>'

  if (!apiKey) {
    console.log(`\n📧 [EMAIL] To: ${to}`)
    console.log(`📧 [EMAIL] Subject: ${subject}`)
    console.log(`📧 [EMAIL] Set RESEND_API_KEY to send real emails`)
    console.log(`📧 [EMAIL] HTML:\n${html}\n`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    console.error(`[EMAIL] Failed to send to ${to}:`, await res.text())
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    password: {
      // Supabase Auth uses bcrypt — keep compatibility for migrated users
      hash: (password) => bcrypt.hash(password, 10),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
    sendResetPassword: async ({ user, url }) => {
      void sendEmail(
        user.email,
        'Reset your password',
        `<h2>Password Reset</h2>
        <p>Hi ${user.name ?? 'there'},</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${url}" style="background:#6366f1;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#888;font-size:12px">This link expires in 1 hour.</p>`
      )
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail(
        user.email,
        'Verify your email',
        `<h2>Email Verification</h2>
        <p>Hi ${user.name ?? 'there'},</p>
        <p>Click the link below to verify your email:</p>
        <p><a href="${url}" style="background:#6366f1;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Verify Email</a></p>`
      )
    },
  },
  trustedOrigins: [
    'https://*.ngrok-free.app',
  ],
  session: {
    cookieCache: { enabled: true, maxAge: 300 },
  },
  plugins: [nextCookies(), dash()],
})
