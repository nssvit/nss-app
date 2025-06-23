'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { EventCard } from '@/components/EventCard'
import { EventModal } from '@/components/EventModal'

// Sample events data matching the prototype
const sampleEvents = [
  {
    id: 1,
    title: "Beach Clean-Up Drive",
    date: "Aug 15",
    description: "Annual Juhu Beach clean-up. Promote environmental awareness.",
    category: "Area Based - 1",
    hours: "4",
    participants: [
      { avatar: "https://i.imgur.com/gVo4gxC.png", alt: "User" },
      { avatar: "https://i.imgur.com/7OtnwP9.png", alt: "User" }
    ],
    participantCount: 73
  },
  {
    id: 2,
    title: "Blood Donation VIT",
    date: "Sep 10",
    description: "Organized with local hospitals to encourage blood donation among students and staff.",
    category: "College Event",
    hours: "3",
    participants: [
      { avatar: "https://i.imgur.com/gJgRz7n.png", alt: "User" }
    ],
    participantCount: 118
  },
  {
    id: 3,
    title: "NSS Camp - Kuderan",
    date: "Nov 27",
    description: "7-day camp: rural development, health, infrastructure. Theme: Sarvangin Vikas.",
    category: "Camp",
    hours: "50",
    participants: [
      { avatar: "https://i.imgur.com/xG2942s.png", alt: "User" },
      { avatar: "https://i.imgur.com/gVo4gxC.png", alt: "User" }
    ],
    participantCount: 48
  },
  {
    id: 4,
    title: "Digital Literacy Workshop",
    date: "Dec 5",
    description: "Teaching basic computer skills and digital literacy to local community members.",
    category: "Workshop",
    hours: "6",
    participants: [
      { avatar: "https://i.imgur.com/gVo4gxC.png", alt: "User" },
      { avatar: "https://i.imgur.com/7OtnwP9.png", alt: "User" },
      { avatar: "https://i.imgur.com/xG2942s.png", alt: "User" }
    ],
    participantCount: 32
  }
]

export default function Dashboard() {
  const [activeLink, setActiveLink] = useState('events')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState(sampleEvents)
  const [filteredEvents, setFilteredEvents] = useState(sampleEvents)

  // Filter events based on search and filters
  useEffect(() => {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter) {
      filtered = filtered.filter(event => event.category === categoryFilter)
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, categoryFilter])

  const handleCreateEvent = (eventData: any) => {
    const newEvent = {
      id: events.length + 1,
      title: eventData.eventName,
      date: new Date(eventData.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      description: eventData.eventDescription,
      category: eventData.eventCategory,
      hours: eventData.declaredHours,
      participants: [
        { avatar: "https://i.imgur.com/gVo4gxC.png", alt: "User" }
      ],
      participantCount: 0
    }
    setEvents([...events, newEvent])
  }

  const handleEditEvent = (eventId: number) => {
    console.log('Edit event:', eventId)
    // Implement edit functionality
  }

  const handleViewParticipants = (eventId: number) => {
    console.log('View participants:', eventId)
    // Implement view participants functionality
  }

  const handleDeleteEvent = (eventId: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(event => event.id !== eventId))
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSessionFilter('')
    setCategoryFilter('')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        activeLink={activeLink}
        onLinkClick={setActiveLink}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col header-bg">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 sticky top-0 z-20 header-bg h-16">
          <div className="flex items-center space-x-4 h-8">
            <div className="flex items-center space-x-3">
              <i className="fas fa-campground text-lg text-indigo-400"></i>
              <h1 className="text-lg font-semibold text-gray-100">
                NSS VIT / <span className="text-gray-400">Events</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search events..." 
                className="input-dark text-sm rounded-lg py-2 px-3 pl-9 focus:outline-none placeholder-gray-500" 
                style={{ width: '220px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
            </div>
            <button 
              className="button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg font-medium" 
              style={{ fontSize: '0.94rem' }}
              onClick={() => setIsModalOpen(true)}
            >
              <i className="fas fa-plus fa-sm"></i>
              <span>Create Event</span>
            </button>
            <button className="action-button hover-lift text-gray-400 hover:text-gray-200 p-2 rounded-lg">
              <i className="far fa-bell fa-sm"></i>
            </button>
          </div>
        </header>

        {/* Board Area for Events */}
        <div className="flex-1 p-4 overflow-x-hidden overflow-y-auto main-content-bg">
          {/* Filters Row */}
          <div className="flex items-center space-x-3 mb-4 px-1">
            <select 
              className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none"
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
            >
              <option value="">All Sessions</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
            </select>
            <select 
              className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Area Based - 1">Area Based - 1</option>
              <option value="Camp">Camp</option>
              <option value="College Event">College Event</option>
              <option value="Workshop">Workshop</option>
            </select>
            <button className="button-glass-secondary hover-lift flex items-center space-x-2 text-sm py-2 px-3 rounded-lg">
              <i className="fas fa-filter fa-sm"></i>
              <span>Filter</span>
            </button>
            <button 
              className="text-gray-500 hover:text-gray-300 text-sm py-2 px-3 transition-colors"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>

          {/* Events Grid */}
          <div 
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              sidebarCollapsed ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'
            } gap-4`}
          >
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                date={event.date}
                description={event.description}
                category={event.category}
                hours={event.hours}
                participants={event.participants}
                participantCount={event.participantCount}
                onEdit={() => handleEditEvent(event.id)}
                onViewParticipants={() => handleViewParticipants(event.id)}
                onDelete={() => handleDeleteEvent(event.id)}
              />
            ))}
          </div>

          {/* Enhanced Pagination */}
          <div className="flex justify-center mt-6">
            <nav className="flex space-x-2">
              <button className="pagination-button px-3 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                Previous
              </button>
              <button className="pagination-button active px-3 py-2 text-sm rounded-lg">1</button>
              <button className="pagination-button px-3 py-2 text-sm rounded-lg">2</button>
              <button className="pagination-button px-3 py-2 text-sm rounded-lg">3</button>
              <button className="pagination-button px-3 py-2 text-sm rounded-lg">Next</button>
            </nav>
          </div>
        </div>
      </main>

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  )
}
