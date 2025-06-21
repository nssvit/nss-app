<template>
  <!-- PWA Enhanced Events Page -->
  <div class="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden overflow-y-auto main-content-bg pwa-optimized">
    <!-- Filters Row - PWA Enhanced -->
    <div class="filter-row flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4 px-1">
      <div class="flex flex-col sm:flex-row space-y-1.5 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
        <select class="input-dark text-xs sm:text-sm rounded-md py-1.5 px-2.5 focus:outline-none w-full sm:w-auto min-w-[120px] h-8 sm:h-9">
          <option value="">All Sessions</option>
          <option value="2024-2025">2024-2025</option>
          <option value="2023-2024">2023-2024</option>
        </select>
        <select class="input-dark text-xs sm:text-sm rounded-md py-1.5 px-2.5 focus:outline-none w-full sm:w-auto min-w-[120px] h-8 sm:h-9">
          <option value="">All Categories</option>
          <option value="Area Based - 1">Area Based - 1</option>
          <option value="Camp">Camp</option>
        </select>
          </div>
          
      <div class="flex items-center space-x-2 w-full sm:w-auto">
        <button class="button-glass-secondary hover-lift flex items-center space-x-1.5 text-xs sm:text-sm py-1.5 px-3 rounded-md flex-1 sm:flex-none justify-center min-h-[36px] sm:min-h-[40px]">
          <i class="fas fa-filter text-xs"></i>
          <span>Filter</span>
        </button>
        <button class="text-gray-500 hover:text-gray-300 text-xs sm:text-sm py-1.5 px-2.5 transition-colors min-h-[36px] sm:min-h-[40px] flex items-center">
          Clear
        </button>
      </div>
    </div>

    <!-- Events Grid - PWA Enhanced Responsive -->
    <div class="responsive-grid mb-8 w-full" id="eventsGrid">
      <EventCard 
        v-for="event in events" 
        :key="event.id"
        :event="event"
        @edit="editEvent"
        @view-participants="viewParticipants"
        @delete="deleteEvent"
      />
    </div>

    <!-- PWA Enhanced Pagination -->
    <div class="flex justify-center mt-3">
      <nav class="flex flex-wrap justify-center space-x-1 sm:space-x-2">
        <button class="pagination-button px-3 sm:px-4 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center" disabled>
          <span class="hidden sm:inline">Previous</span>
          <span class="sm:hidden">Prev</span>
        </button>
        <button class="pagination-button active px-3 sm:px-4 py-2 text-sm rounded-lg min-h-[44px] flex items-center min-w-[44px] justify-center">1</button>
        <button class="pagination-button px-3 sm:px-4 py-2 text-sm rounded-lg min-h-[44px] flex items-center min-w-[44px] justify-center">2</button>
        <button class="pagination-button px-3 sm:px-4 py-2 text-sm rounded-lg min-h-[44px] flex items-center min-w-[44px] justify-center">3</button>
        <button class="pagination-button px-3 sm:px-4 py-2 text-sm rounded-lg min-h-[44px] flex items-center">
          <span class="hidden sm:inline">Next</span>
          <span class="sm:hidden">Next</span>
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
const isMobile = inject('isMobile', ref(false))

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

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  // Filter events based on search query
  console.log('Search query changed:', newQuery)
  // Implement search filtering logic here
})
</script>

<style scoped>
/* Additional page-specific styles if needed */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
