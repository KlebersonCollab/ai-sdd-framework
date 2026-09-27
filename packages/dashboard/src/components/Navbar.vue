<template>
  <nav class="h-14 border-b border-hairline bg-surface-1/90 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
    <!-- Brand -->
    <div class="flex items-center gap-3">
      <span class="font-bold text-primary text-lg tracking-tight">AI-SDD</span>
      <span class="text-white font-semibold text-sm hidden sm:inline">Cockpit Workspace</span>
      <span class="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary-hover border border-primary/20">
        Linear Dark v2.0
      </span>
    </div>

    <!-- Center Navigation Tabs -->
    <div class="flex items-center gap-1 bg-surface-3 p-1 rounded-md border border-hairline">
      <button
        type="button"
        @click="$emit('change-view', 'specs')"
        :class="[
          'px-3 py-1 text-xs font-semibold rounded transition-all',
          activeView === 'specs'
            ? 'bg-primary text-white shadow-sm'
            : 'text-ink-muted hover:text-white hover:bg-surface-4'
        ]"
      >
        📋 Specifications
      </button>
      <button
        type="button"
        @click="$emit('change-view', 'docs')"
        :class="[
          'px-3 py-1 text-xs font-semibold rounded transition-all',
          activeView === 'docs'
            ? 'bg-primary text-white shadow-sm'
            : 'text-ink-muted hover:text-white hover:bg-surface-4'
        ]"
      >
        📚 Living Docs
      </button>

      <button
        type="button"
        @click="$emit('change-view', 'memory')"
        :class="[
          'px-3 py-1 text-xs font-semibold rounded transition-all',
          activeView === 'memory'
            ? 'bg-primary text-white shadow-sm'
            : 'text-ink-muted hover:text-white hover:bg-surface-4'
        ]"
      >
        🧠 Memory Graph
      </button>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-3">
      <span
        :class="[
          'text-xs font-mono px-2.5 py-1 rounded border transition-colors',
          syncState === 'connected' ? 'bg-semantic-success/15 text-semantic-success border-semantic-success/30' :
          syncState === 'syncing' ? 'bg-primary/20 text-primary-hover border-primary/40' :
          'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30'
        ]"
      >
        {{ syncState === 'connected' ? '● Live Sync' : syncState === 'syncing' ? '⚡ Syncing...' : '○ Reconnecting' }}
      </span>

      <button
        type="button"
        @click="$emit('toggle-terminal')"
        :class="[
          'px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 border transition-all',
          isTerminalOpen ? 'bg-surface-3 text-primary-hover border-primary/40' : 'bg-surface-2 text-ink-muted border-hairline hover:text-white hover:border-hairline-strong'
        ]"
        title="Toggle Integrated Terminal (Ctrl + `)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
        Terminal
      </button>

      <button
        type="button"
        @click="$emit('refresh')"
        :disabled="isLoading"
        class="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
      >
        <svg :class="['w-3.5 h-3.5', isLoading ? 'animate-spin' : '']" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
        Refresh
      </button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  activeView: { type: String, default: 'specs' },
  syncState: { type: String, default: 'connected' },
  isLoading: { type: Boolean, default: false },
  isTerminalOpen: { type: Boolean, default: false }
});

defineEmits(['change-view', 'refresh', 'toggle-terminal']);
</script>
