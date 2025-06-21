<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50"
    @click="handleBackdropClick"
  >
    <div 
      class="card-glass p-5 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      ref="modalContent"
    >
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-100">
          {{ isEditing ? 'Edit Event' : 'Create New Event' }}
        </h2>
        <button 
          @click="closeModal" 
          class="text-gray-500 hover:text-white text-2xl leading-none p-1 transition-colors"
        >
          ×
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="eventName" class="block text-sm font-medium text-gray-300 mb-2">Event Name</label>
          <input 
            type="text" 
            id="eventName" 
            v-model="formData.name"
            required 
            class="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none" 
            placeholder="e.g., Tree Plantation Drive"
          >
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="eventDate" class="block text-sm font-medium text-gray-300 mb-2">Event Date</label>
            <input 
              type="date" 
              id="eventDate" 
              v-model="formData.date"
              required 
              class="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none"
            >
          </div>
          <div>
            <label for="declaredHours" class="block text-sm font-medium text-gray-300 mb-2">Declared Hours</label>
            <input 
              type="number" 
              id="declaredHours" 
              v-model="formData.hours"
              required 
              min="1" 
              class="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none" 
              placeholder="e.g., 4"
            >
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="eventCategory" class="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select 
              id="eventCategory" 
              v-model="formData.category"
              required 
              class="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none"
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
            <label for="academicSession" class="block text-sm font-medium text-gray-300 mb-2">Academic Session</label>
            <input 
              type="text" 
              id="academicSession" 
              v-model="formData.session"
              required 
              class="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none" 
              placeholder="e.g., 2024-2025"
            >
          </div>
        </div>
        
        <div>
          <label for="eventLocation" class="block text-sm font-medium text-gray-300 mb-2">Location (Optional)</label>
          <input 
            type="text" 
            id="eventLocation" 
            v-model="formData.location"
            class="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none" 
            placeholder="e.g., Juhu Beach, Mumbai"
          >
        </div>
        
        <div>
          <label for="eventDescription" class="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea 
            id="eventDescription" 
            v-model="formData.description"
            rows="4" 
            class="input-dark w-full text-sm rounded-lg px-4 py-3 focus:outline-none resize-none" 
            placeholder="Provide a detailed description of the event..."
          ></textarea>
        </div>
        
        <div class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
          <button 
            type="button" 
            @click="closeModal" 
            class="button-glass-secondary hover-lift px-6 py-3 text-sm font-medium rounded-lg"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="button-glass-primary hover-lift px-6 py-3 text-sm font-medium rounded-lg"
          >
            {{ isEditing ? 'Update Event' : 'Save Event' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  event: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const modalContent = ref(null)

const isEditing = computed(() => !!props.event)

const formData = reactive({
  name: '',
  date: '',
  hours: '',
  category: '',
  session: '2024-2025',
  location: '',
  description: ''
})

// Define resetForm function first
const resetForm = () => {
  formData.name = ''
  formData.date = ''
  formData.hours = ''
  formData.category = ''
  formData.session = '2024-2025'
  formData.location = ''
  formData.description = ''
}

// Watch for changes in props.event to populate form (now resetForm is available)
watch(() => props.event, (newEvent) => {
  if (newEvent) {
    formData.name = newEvent.title || ''
    formData.date = newEvent.date || ''
    formData.hours = newEvent.hours || ''
    formData.category = newEvent.category || ''
    formData.session = newEvent.session || '2024-2025'
    formData.location = newEvent.location || ''
    formData.description = newEvent.description || ''
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal opening/closing
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      if (modalContent.value) {
        modalContent.value.style.opacity = '0'
        modalContent.value.style.transform = 'scale(0.95)'
        modalContent.value.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        
        requestAnimationFrame(() => {
          modalContent.value.style.opacity = '1'
          modalContent.value.style.transform = 'scale(1)'
        })
      }
    })
  } else {
    document.body.style.overflow = ''
  }
})

const closeModal = () => {
  if (modalContent.value) {
    modalContent.value.style.opacity = '0'
    modalContent.value.style.transform = 'scale(0.95)'
    
    setTimeout(() => {
      emit('close')
      resetForm()
    }, 300)
  } else {
    emit('close')
    resetForm()
  }
}

const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    closeModal()
  }
}

const handleSubmit = () => {
  const eventData = {
    id: props.event?.id || Date.now(),
    title: formData.name,
    date: formData.date,
    hours: parseInt(formData.hours),
    category: formData.category,
    session: formData.session,
    location: formData.location,
    description: formData.description,
    participants: props.event?.participants || []
  }
  
  emit('save', eventData)
  closeModal()
}

// Handle escape key
onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.isOpen) {
      closeModal()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style scoped>
/* Additional modal-specific styles if needed */
</style> 