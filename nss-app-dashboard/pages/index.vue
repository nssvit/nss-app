<template>
  <div class="p-4">
    <!-- Filters Row -->
    <div class="flex items-center space-x-3 mb-4 px-1">
      <select 
        v-model="selectedSession"
        class="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none"
      >
        <option value="">All Sessions</option>
        <option value="2024-2025">2024-2025</option>
        <option value="2023-2024">2023-2024</option>
      </select>
      
      <select 
        v-model="selectedCategory"
        class="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none"
      >
        <option value="">All Categories</option>
        <option value="Area Based - 1">Area Based - 1</option>
        <option value="Area Based - 2">Area Based - 2</option>
        <option value="College Event">College Event</option>
        <option value="University Event">University Event</option>
        <option value="Camp">Camp</option>
        <option value="Workshop">Workshop</option>
        <option value="Competition">Competition</option>
      </select>
      
      <button 
        class="button-glass-secondary hover-lift flex items-center space-x-2 text-sm py-2 px-3 rounded-lg"
        @click="applyFilters"
      >
        <i class="fas fa-filter fa-sm"></i>
        <span>Filter</span>
      </button>
      
      <button 
        class="text-gray-500 hover:text-gray-300 text-sm py-2 px-3 transition-colors"
        @click="clearFilters"
      >
        Clear
      </button>
    </div>

    <!-- Events Grid -->
    <div 
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
      :class="{ 'lg:grid-cols-4 xl:grid-cols-5': sidebarCollapsed }"
      id="eventsGrid"
    >
      <EventCard
        v-for="event in filteredEvents"
        :key="event.id"
        :event="event"
        @edit="editEvent"
        @view-participants="viewParticipants"
        @delete="deleteEvent"
      />
    </div>

    <!-- Pagination -->
    <div class="flex justify-center mt-6">
      <nav class="flex space-x-2">
        <button 
          class="pagination-button px-3 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          Previous
        </button>
        
        <button 
          v-for="page in paginationPages"
          :key="page"
          class="pagination-button px-3 py-2 text-sm rounded-lg"
          :class="{ 'active': page === currentPage }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        
        <button 
          class="pagination-button px-3 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Next
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'NSS VIT Dashboard - Events'
})

// Inject search query and modal functions from layout
const searchQuery = inject('searchQuery', ref(''))
const openEventModal = inject('openEventModal', () => {})

// Reactive data
const selectedSession = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const itemsPerPage = 12
const sidebarCollapsed = ref(false)

// Sample events data (same as in prototype)
const events = ref([
  {
    id: 1,
    title: 'Beach Clean-Up Drive',
    date: '2024-08-15',
    description: 'Annual Juhu Beach clean-up. Promote environmental awareness.',
    category: 'Area Based - 1',
    hours: 4,
    session: '2024-2025',
    location: 'Juhu Beach, Mumbai',
    participants: [
      { name: 'User 1', avatar: 'https://i.imgur.com/gVo4gxC.png' },
      { name: 'User 2', avatar: 'https://i.imgur.com/7OtnwP9.png' },
      ...Array(73).fill().map((_, i) => ({ name: `User ${i + 3}`, avatar: 'https://i.imgur.com/gVo4gxC.png' }))
    ]
  },
  {
    id: 2,
    title: 'Blood Donation VIT',
    date: '2024-09-10',
    description: 'Organized with local hospitals to encourage blood donation among students and staff.',
    category: 'College Event',
    hours: 3,
    session: '2024-2025',
    location: 'VIT Campus',
    participants: [
      { name: 'User 1', avatar: 'https://i.imgur.com/gJgRz7n.png' },
      ...Array(118).fill().map((_, i) => ({ name: `User ${i + 2}`, avatar: 'https://i.imgur.com/gJgRz7n.png' }))
    ]
  },
  {
    id: 3,
    title: 'NSS Camp - Kuderan',
    date: '2024-11-27',
    description: '7-day camp: rural development, health, infrastructure. Theme: Sarvangin Vikas.',
    category: 'Camp',
    hours: 50,
    session: '2024-2025',
    location: 'Kuderan Village',
    participants: [
      { name: 'User 1', avatar: 'https://i.imgur.com/xG2942s.png' },
      { name: 'User 2', avatar: 'https://i.imgur.com/gVo4gxC.png' },
      ...Array(48).fill().map((_, i) => ({ name: `User ${i + 3}`, avatar: 'https://i.imgur.com/xG2942s.png' }))
    ]
  },
  {
    id: 4,
    title: 'Digital Literacy Workshop',
    date: '2024-12-05',
    description: 'Teaching basic computer skills and digital literacy to local community members.',
    category: 'Workshop',
    hours: 6,
    session: '2024-2025',
    location: 'Community Center',
    participants: [
      { name: 'User 1', avatar: 'https://i.imgur.com/gVo4gxC.png' },
      { name: 'User 2', avatar: 'https://i.imgur.com/7OtnwP9.png' },
      { name: 'User 3', avatar: 'https://i.imgur.com/xG2942s.png' },
      ...Array(32).fill().map((_, i) => ({ name: `User ${i + 4}`, avatar: 'https://i.imgur.com/gVo4gxC.png' }))
    ]
  }
])

// Computed properties
const filteredEvents = computed(() => {
  let filtered = events.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query)
    )
  }

  // Apply session filter
  if (selectedSession.value) {
    filtered = filtered.filter(event => event.session === selectedSession.value)
  }

  // Apply category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(event => event.category === selectedCategory.value)
  }

  // Apply pagination
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  let filtered = events.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query)
    )
  }

  if (selectedSession.value) {
    filtered = filtered.filter(event => event.session === selectedSession.value)
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(event => event.category === selectedCategory.value)
  }

  return Math.ceil(filtered.length / itemsPerPage)
})

const paginationPages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5)
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total)
    } else {
      pages.push(current - 2, current - 1, current, current + 1, current + 2)
    }
  }
  
  return pages
})

// Methods
const applyFilters = () => {
  currentPage.value = 1
  console.log('Filters applied:', { selectedSession: selectedSession.value, selectedCategory: selectedCategory.value })
}

const clearFilters = () => {
  selectedSession.value = ''
  selectedCategory.value = ''
  currentPage.value = 1
  searchQuery.value = ''
}

const editEvent = (event) => {
  openEventModal(event)
}

const viewParticipants = (event) => {
  console.log('View participants for:', event.title)
  // Implement participants view logic
}

const deleteEvent = (event) => {
  if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
    const index = events.value.findIndex(e => e.id === event.id)
    if (index > -1) {
      events.value.splice(index, 1)
    }
  }
}

// Watch for sidebar collapse changes from layout
provide('sidebarCollapsed', sidebarCollapsed)
</script>

<style scoped>
/* Additional page-specific styles if needed */
</style>
