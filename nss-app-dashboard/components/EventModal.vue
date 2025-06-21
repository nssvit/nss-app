<template>
  <!-- PWA Enhanced Modal -->
  <div 
    v-if="isOpen" 
    class="fixed inset-0 modal-backdrop flex items-center justify-center p-4 sm:p-6 z-50 pwa-optimized"
    @click="handleBackdropClick"
  >
    <div 
      class="card-glass rounded-xl shadow-2xl w-full max-w-sm sm:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
      @click.stop
    >
      <!-- Modal Header - PWA Enhanced -->
      <div class="flex justify-between items-center mb-5 sm:mb-6">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-100 leading-6">
          {{ event ? 'Edit Event' : 'Create New Event' }}
        </h2>
        <!-- 44px touch target for close button -->
        <button 
          @click="closeModal" 
          class="text-gray-500 hover:text-white text-xl leading-none p-2 transition-colors h-10 w-10 flex items-center justify-center rounded-lg"
        >
          ×
        </button>
      </div>

      <!-- Event Form - PWA Enhanced -->
      <form @submit.prevent="submitForm" class="space-y-5 sm:space-y-6">
        <!-- Event Name -->
        <div>
          <label for="eventName" class="block text-sm font-medium text-gray-300 mb-2">
            Event Name <span class="text-red-400">*</span>
          </label>
          <input 
            type="text" 
            id="eventName" 
            v-model="formData.eventName"
            required 
            class="input-dark w-full text-sm rounded-lg px-3 py-3 focus:outline-none h-10" 
            placeholder="e.g., Tree Plantation Drive"
          >
        </div>

        <!-- Date and Hours Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label for="eventDate" class="block text-sm font-medium text-gray-300 mb-2">
              Event Date <span class="text-red-400">*</span>
            </label>
            <input 
              type="date" 
              id="eventDate" 
              v-model="formData.eventDate"
              required 
              class="input-dark w-full text-sm rounded-lg px-3 py-3 focus:outline-none h-10"
            >
          </div>
          <div>
            <label for="declaredHours" class="block text-sm font-medium text-gray-300 mb-2">
              Declared Hours <span class="text-red-400">*</span>
            </label>
            <input 
              type="number" 
              id="declaredHours" 
              v-model="formData.declaredHours"
              required 
              min="1" 
              class="input-dark w-full text-sm rounded-lg px-3 py-3 focus:outline-none h-10" 
              placeholder="e.g., 4"
            >
          </div>
        </div>

        <!-- Category and Session Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label for="eventCategory" class="block text-sm font-medium text-gray-300 mb-2">
              Category <span class="text-red-400">*</span>
            </label>
            <select 
              id="eventCategory" 
              v-model="formData.eventCategory"
              required 
              class="input-dark w-full text-sm rounded-lg px-3 py-3 focus:outline-none h-10"
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
            <label for="academicSession" class="block text-sm font-medium text-gray-300 mb-2">
              Academic Session <span class="text-red-400">*</span>
            </label>
            <input 
              type="text" 
              id="academicSession" 
              v-model="formData.academicSession"
              required 
              class="input-dark w-full text-sm rounded-lg px-3 py-3 focus:outline-none h-10" 
              placeholder="e.g., 2024-2025"
            >
          </div>
        </div>

        <!-- Location -->
        <div>
          <label for="eventLocation" class="block text-base font-medium text-gray-300 mb-3">
            Location <span class="text-gray-500 text-sm">(Optional)</span>
          </label>
          <input 
            type="text" 
            id="eventLocation" 
            v-model="formData.eventLocation"
            class="input-dark w-full text-base rounded-lg px-4 py-4 focus:outline-none h-12" 
            placeholder="e.g., Juhu Beach, Mumbai"
          >
        </div>

        <!-- Description -->
        <div>
          <label for="eventDescription" class="block text-base font-medium text-gray-300 mb-3">
            Description
          </label>
          <textarea 
            id="eventDescription" 
            v-model="formData.eventDescription"
            rows="4" 
            class="input-dark w-full text-base rounded-lg px-4 py-4 focus:outline-none resize-none min-h-[120px]" 
            placeholder="Provide a detailed description of the event..."
          ></textarea>
        </div>

        <!-- Form Actions - PWA Enhanced -->
        <div class="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-6 sm:pt-8">
          <button 
            type="button" 
            @click="closeModal" 
            class="button-glass-secondary hover-lift px-6 sm:px-8 py-4 text-base font-medium rounded-lg order-2 sm:order-1 min-h-[48px]"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="button-glass-primary hover-lift px-6 sm:px-8 py-4 text-base font-medium rounded-lg order-1 sm:order-2 min-h-[48px]"
            :disabled="!isFormValid"
            :class="{ 'opacity-50 cursor-not-allowed': !isFormValid }"
          >
            {{ event ? 'Update Event' : 'Save Event' }}
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

// Form data
const formData = ref({
  eventName: '',
  eventDate: '',
  declaredHours: '',
  eventCategory: '',
  academicSession: '',
  eventLocation: '',
  eventDescription: ''
})

// Form validation
const isFormValid = computed(() => {
  return formData.value.eventName && 
         formData.value.eventDate && 
         formData.value.declaredHours && 
         formData.value.eventCategory && 
         formData.value.academicSession
})

// Reset form data
const resetForm = () => {
  formData.value = {
    eventName: '',
    eventDate: '',
    declaredHours: '',
    eventCategory: '',
    academicSession: '',
    eventLocation: '',
    eventDescription: ''
  }
}

// Populate form when editing
const populateForm = (event) => {
  if (event) {
    formData.value = {
      eventName: event.title || '',
      eventDate: event.date || '',
      declaredHours: event.hours || '',
      eventCategory: event.category || '',
      academicSession: event.session || '2024-2025',
      eventLocation: event.location || '',
      eventDescription: event.description || ''
    }
  }
}

// Watch for prop changes
watch(() => props.event, (newEvent) => {
  if (props.isOpen) {
    if (newEvent) {
      populateForm(newEvent)
    } else {
      resetForm()
    }
  }
})

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    if (props.event) {
      populateForm(props.event)
    } else {
      resetForm()
    }
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
  } else {
    // Restore body scroll when modal is closed
    document.body.style.overflow = ''
  }
})

// Handle form submission
const submitForm = () => {
  if (isFormValid.value) {
    emit('save', formData.value)
    closeModal()
  }
}

// Handle modal close
const closeModal = () => {
  emit('close')
  // Reset form after a short delay to allow for smooth closing animation
  setTimeout(() => {
    resetForm()
  }, 300)
}

// Handle backdrop click
const handleBackdropClick = (event) => {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

// Handle escape key
const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && props.isOpen) {
    closeModal()
  }
}

// Setup keyboard listeners
onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  // Ensure body scroll is restored
  if (process.client) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.modal-backdrop {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Mobile-specific adjustments */
@media (max-width: 640px) {
  .card-glass {
    margin: 0.5rem;
    border-radius: 0.75rem;
  }
}

/* Smooth transitions */
.modal-backdrop {
  animation: fadeIn 0.3s ease-out;
}

.card-glass {
  animation: slideIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Touch-friendly form elements */
@media (max-width: 768px) {
  input, select, textarea {
    min-height: 44px;
  }
  
  button {
    min-height: 44px;
  }
}
</style> 