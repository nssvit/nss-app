'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [branch, setBranch] = useState<'EXCS' | 'CMPN' | 'IT' | 'BIO-MED' | 'EXTC'>('CMPN')
  const [year, setYear] = useState<'FE' | 'SE' | 'TE'>('SE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password)
        if (error) setError(error.message)
      } else {
        const { error } = await signUpWithEmail(email, password, {
          first_name: firstName,
          last_name: lastName,
          roll_number: rollNumber,
          branch,
          year,
        })
        if (error) setError(error.message)
        else setError('Check your email for the confirmation link!')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #070709 0%, #0c0c0e 50%, #131315 100%)' }}
    >
      <div className="card-glass w-full max-w-md space-y-8 rounded-2xl p-8">
        <div>
          <div className="mb-4 flex items-center justify-center">
            <i className="fas fa-users text-4xl text-indigo-400"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            {mode === 'signin' ? 'Sign in to NSS Dashboard' : 'Create NSS Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {mode === 'signin' ? 'Welcome back!' : 'Join the NSS community'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-red-700/50 bg-red-900/30 px-4 py-3 text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-300">
                    Roll Number
                  </label>
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-300">
                      Branch
                    </label>
                    <select
                      id="branch"
                      name="branch"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value as any)}
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-gray-200 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="CMPN">Computer</option>
                      <option value="IT">Information Technology</option>
                      <option value="EXTC">Electronics & Telecom</option>
                      <option value="EXCS">Electronics & Computer</option>
                      <option value="BIO-MED">Biomedical</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-300">
                      Year
                    </label>
                    <select
                      id="year"
                      name="year"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value as any)}
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-gray-200 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="FE">First Year</option>
                      <option value="SE">Second Year</option>
                      <option value="TE">Third Year</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group button-glass-primary relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </div>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
