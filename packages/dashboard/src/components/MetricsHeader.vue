<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Total Features -->
    <div class="bg-surface-1 border border-hairline rounded-lg p-4 flex flex-col justify-between">
      <span class="text-xs uppercase font-mono tracking-wider text-ink-muted">Total Features</span>
      <span class="text-2xl font-bold text-white mt-1">{{ featuresCount }}</span>
    </div>

    <!-- Total Tasks -->
    <div class="bg-surface-1 border border-hairline rounded-lg p-4 flex flex-col justify-between">
      <span class="text-xs uppercase font-mono tracking-wider text-ink-muted">Total Tasks</span>
      <span class="text-2xl font-bold text-white mt-1">{{ totalTasks }}</span>
    </div>

    <!-- Completed Tasks -->
    <div class="bg-surface-1 border border-hairline rounded-lg p-4 flex flex-col justify-between">
      <span class="text-xs uppercase font-mono tracking-wider text-ink-muted">Completed Tasks</span>
      <span class="text-2xl font-bold text-semantic-success mt-1">{{ completedTasks }}</span>
    </div>

    <!-- Overall Progress -->
    <div class="bg-surface-1 border border-hairline rounded-lg p-4 flex flex-col justify-between">
      <div class="flex justify-between items-baseline">
        <span class="text-xs uppercase font-mono tracking-wider text-ink-muted">Overall Progress</span>
        <span class="text-lg font-bold text-white font-mono">{{ overallProgress }}%</span>
      </div>
      <div class="h-2 w-full bg-surface-4 border border-hairline rounded-full overflow-hidden mt-3">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          :class="overallProgress === 100 ? 'bg-semantic-success shadow-[0_0_8px_rgba(39,166,68,0.5)]' : 'bg-primary'"
          :style="{ width: overallProgress + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  featuresCount: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  overallProgress: { type: Number, default: 0 }
});
</script>
