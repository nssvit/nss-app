<template>
  <div 
    class="card-glass hover-lift rounded-xl flex flex-col transition-all duration-300 ease-out" 
    style="padding: 0.85rem;"
  >
    <div class="flex-grow">
      <div class="flex justify-between items-start mb-2">
        <h3 
          class="font-semibold text-gray-100 truncate pr-2" 
          style="font-size: 0.94rem;" 
          :title="event.title"
        >
          {{ event.title }}
        </h3>
        <span class="text-xs text-gray-400 whitespace-nowrap">{{ formatDate(event.date) }}</span>
      </div>
      
      <p class="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">
        {{ event.description }}
      </p>
      
      <div class="flex flex-wrap items-center mb-3">
        <span class="tag">
          <span class="tag-dot" :class="getCategoryColor(event.category)"></span>
          {{ event.category }}
        </span>
        <span class="tag">
          <span class="tag-dot bg-green-500"></span>
          {{ event.hours }} {{ event.hours === 1 ? 'Hr' : 'Hrs' }}
        </span>
      </div>
    </div>
    
    <div class="flex items-center justify-between pt-3 border-t border-gray-700/20 mt-auto">
      <div class="flex items-center -space-x-2">
        <img 
          v-for="(participant, index) in event.participants.slice(0, 3)" 
          :key="index"
          :src="participant.avatar" 
          :alt="participant.name" 
          class="w-5 h-5 rounded-full border-2 border-gray-700/50"
        >
        <span class="text-xs text-gray-500 pl-3">
          +{{ event.participants.length - 3 > 0 ? event.participants.length - 3 : event.participants.length }}
        </span>
      </div>
      
      <div class="flex space-x-1">
        <button 
          title="Edit" 
          class="action-button text-gray-400 hover:text-blue-400 p-1.5 rounded-lg text-xs"
          @click="$emit('edit', event)"
        >
          <i class="fas fa-pencil-alt"></i>
        </button>
        <button 
          title="Participants" 
          class="action-button text-gray-400 hover:text-green-400 p-1.5 rounded-lg text-xs"
          @click="$emit('view-participants', event)"
        >
          <i class="fas fa-users"></i>
        </button>
        <button 
          title="Delete" 
          class="action-button text-gray-400 hover:text-red-500 p-1.5 rounded-lg text-xs"
          @click="$emit('delete', event)"
        >
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  event: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'view-participants', 'delete'])

const formatDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getCategoryColor = (category) => {
  const colors = {
    'Area Based - 1': 'bg-blue-500',
    'Area Based - 2': 'bg-cyan-500',
    'College Event': 'bg-purple-500',
    'University Event': 'bg-pink-500',
    'Camp': 'bg-orange-500',
    'Workshop': 'bg-indigo-500',
    'Competition': 'bg-yellow-500',
    'Other': 'bg-gray-500'
  }
  return colors[category] || 'bg-gray-500'
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 