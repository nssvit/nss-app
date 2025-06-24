'use client'

import { useState, useEffect } from 'react'

interface EventFormData {
  eventName: string
  eventDate: string
  declaredHours: string
  eventCategory: string
  academicSession: string
  eventLocation: string
  eventDescription: string
}

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventData: EventFormData) => void
  title?: string
  initialData?: EventFormData
}

export function EventModal({ isOpen, onClose, onSubmit, title = "Create New Event", initialData }: EventModalProps) {
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    declaredHours: '',
    eventCategory: '',
    academicSession: '',
    eventLocation: '',
    eventDescription: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        eventName: '',
        eventDate: '',
        declaredHours: '',
        eventCategory: '',
        academicSession: '',
        eventLocation: '',
        eventDescription: ''
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="card-glass p-5 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none p-1 transition-colors"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-gray-300 mb-2">
              Event Name
            </label>
            <input 
              type="text" 
              id="eventName" 
              name="eventName" 
              required 
              className="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none" 
              placeholder="e.g., Tree Plantation Drive"
              value={formData.eventName}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-gray-300 mb-2">
                Event Date
              </label>
              <input 
                type="date" 
                id="eventDate" 
                name="eventDate" 
                required 
                className="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none"
                value={formData.eventDate}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="declaredHours" className="block text-sm font-medium text-gray-300 mb-2">
                Declared Hours
              </label>
              <input 
                type="number" 
                id="declaredHours" 
                name="declaredHours" 
                required 
                min="1" 
                className="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none" 
                placeholder="e.g., 4"
                value={formData.declaredHours}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventCategory" className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select 
                id="eventCategory" 
                name="eventCategory" 
                required 
                className="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none"
                value={formData.eventCategory}
                onChange={handleInputChange}
              >
                <option value="">Select Category...</option>
                <option value="Area Based - 1">Area Based - 1</option>
                <option value="Area Based - 2">Area Based - 2</option>
                <option value="University Event">University Event</option>
                <option value="College Event">College Event</option>
                <option value="Camp">Camp</option>
                <option value="Competition">Competition</option>
                <option value="Workshop">Workshop</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="academicSession" className="block text-sm font-medium text-gray-300 mb-2">
                Academic Session
              </label>
              <input 
                type="text" 
                id="academicSession" 
                name="academicSession" 
                required 
                className="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none" 
                placeholder="e.g., 2024-2025"
                value={formData.academicSession}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div>
            <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-300 mb-2">
              Location (Optional)
            </label>
            <input 
              type="text" 
              id="eventLocation" 
              name="eventLocation" 
              className="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none" 
              placeholder="e.g., Juhu Beach, Mumbai"
              value={formData.eventLocation}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea 
              id="eventDescription" 
              name="eventDescription" 
              rows={4} 
              className="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none resize-none" 
              placeholder="Provide a detailed description of the event..."
              value={formData.eventDescription}
              onChange={handleInputChange}
            ></textarea>
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="button-glass-secondary hover-lift px-6 py-3 text-sm font-medium rounded-lg"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="button-glass-primary hover-lift px-6 py-3 text-sm font-medium rounded-lg"
            >
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 