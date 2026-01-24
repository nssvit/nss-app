'use client'

/**
 * ApprovalModal Component
 * Modal for approving or rejecting hours
 */

import { useState } from 'react'
import Image from 'next/image'

interface Participation {
  id: string
  hoursAttended: number
  volunteer?: { firstName: string; lastName: string; rollNumber: string; profilePic?: string | null }
  event?: { eventName: string; startDate: string }
}

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  participation: Participation | null
  mode: 'approve' | 'reject'
  onSubmit: (hours: number, notes: string) => Promise<void>
}

export function ApprovalModal({ isOpen, onClose, participation, mode, onSubmit }: ApprovalModalProps) {
  const [hours, setHours] = useState(participation?.hoursAttended || 0)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(hours, notes)
      setNotes('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !participation) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">{mode === 'approve' ? 'Approve Hours' : 'Reject Hours'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none p-1">&times;</button>
        </div>

        <div className="mb-6 p-4 bg-gray-800/30 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Image src={participation.volunteer?.profilePic || '/icon-192x192.png'}
              alt={participation.volunteer ? `${participation.volunteer.firstName} ${participation.volunteer.lastName}` : 'Unknown'}
              width={40} height={40} className="w-10 h-10 rounded-full" />
            <div>
              <h4 className="font-medium text-gray-200">{participation.volunteer ? `${participation.volunteer.firstName} ${participation.volunteer.lastName}` : 'Unknown'}</h4>
              <p className="text-sm text-gray-400">{participation.volunteer?.rollNumber}</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            <p><strong>Event:</strong> {participation.event?.eventName || 'Unknown'}</p>
            <p><strong>Date:</strong> {participation.event?.startDate ? new Date(participation.event.startDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Requested Hours:</strong> {participation.hoursAttended}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'approve' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Approved Hours</label>
              <input type="number" min={0} max={24} className="input-dark w-full text-sm rounded-lg px-4 py-3"
                value={hours} onChange={(e) => setHours(parseInt(e.target.value) || 0)} />
              <p className="text-xs text-gray-500 mt-1">You can adjust the hours if needed</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{mode === 'approve' ? 'Notes (Optional)' : 'Reason for Rejection'}</label>
            <textarea className="input-dark w-full text-sm rounded-lg px-4 py-3 resize-none" rows={3}
              placeholder={mode === 'approve' ? 'Add any notes...' : 'Please provide a reason for rejection...'}
              value={notes} onChange={(e) => setNotes(e.target.value)} required={mode === 'reject'} />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="button-glass-secondary hover-lift px-4 py-2 text-sm rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting}
              className={`hover-lift px-4 py-2 text-sm rounded-lg disabled:opacity-50 ${mode === 'approve' ? 'button-glass-primary' : 'bg-red-600/30 text-red-400 hover:bg-red-600/40'}`}>
              {submitting ? 'Processing...' : mode === 'approve' ? 'Approve Hours' : 'Reject Hours'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
