<template>
  <div class="min-h-screen flex flex-col bg-canvas text-ink selection:bg-primary/30 selection:text-white">
    <!-- Navbar -->
    <Navbar
      :active-view="activeView"
      :sync-state="syncState"
      :is-terminal-open="isTerminalOpen"
      @change-view="activeView = $event"
      @toggle-terminal="isTerminalOpen = !isTerminalOpen"
      @refresh="loadFeatures"
    />

    <!-- Main Workspace Area -->
    <main class="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto pb-24">
      <!-- High Level Metrics Overview -->
      <MetricsHeader
        :features-count="features.length"
        :total-tasks="totalTasks"
        :completed-tasks="completedTasks"
        :overall-progress="overallProgress"
      />

      <!-- Notification Toast -->
      <transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="toastMessage"
          class="fixed top-16 right-6 z-40 bg-surface-2 border border-hairline-strong shadow-xl rounded-lg px-4 py-3 flex items-center gap-3 text-xs font-mono text-white"
        >
          <span class="text-primary-hover">⚡</span>
          <span>{{ toastMessage }}</span>
          <button @click="toastMessage = null" class="text-ink-muted hover:text-white ml-2">✕</button>
        </div>
      </transition>

      <!-- VIEW 1: Specifications Cascade -->
      <div v-show="activeView === 'specs'">
        <SpecsCascade :features="features" />
      </div>

      <!-- VIEW 2: Interactive Human-AI Kanban Board -->
      <div v-show="activeView === 'kanban'">
        <KanbanBoard
          :features="features"
          @update-task="handleTaskUpdate"
          @dispatch-agent="handleDispatchAgent"
        />
      </div>

      <!-- VIEW 3: Memory Graph View -->
      <div v-show="activeView === 'memory'">
        <MemoryGraphView />
      </div>
    </main>

    <!-- Embedded Terminal Drawer -->
    <TerminalDrawer
      ref="terminalDrawerRef"
      :is-open="isTerminalOpen"
      @close="isTerminalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import Navbar from './components/Navbar.vue';
import MetricsHeader from './components/MetricsHeader.vue';
import SpecsCascade from './components/SpecsCascade.vue';
import KanbanBoard from './components/KanbanBoard.vue';
import MemoryGraphView from './components/MemoryGraphView.vue';
import TerminalDrawer from './components/TerminalDrawer.vue';

const activeView = ref('specs');
const features = ref([]);
const syncState = ref('syncing');
const isTerminalOpen = ref(false);
const terminalDrawerRef = ref(null);
const toastMessage = ref(null);

let toastTimer = null;
let eventSource = null;

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 4000);
}

const totalTasks = computed(() => {
  return features.value.reduce((acc, f) => acc + (f.totalTasks || (f.tasks ? f.tasks.length : 0)), 0);
});

const completedTasks = computed(() => {
  return features.value.reduce((acc, f) => acc + (f.completedTasks || 0), 0);
});

const overallProgress = computed(() => {
  if (totalTasks.value === 0) return 0;
  return Math.round((completedTasks.value / totalTasks.value) * 100);
});

async function loadFeatures() {
  syncState.value = 'syncing';
  try {
    const res = await fetch('/api/features');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    features.value = Array.isArray(data) ? data : (data.features || []);
    syncState.value = 'connected';
  } catch (err) {
    console.error('Failed to load features:', err);
    syncState.value = 'error';
  }
}

async function handleTaskUpdate({ featureId, taskId, status, feedback }) {
  try {
    const res = await fetch(`/api/features/${encodeURIComponent(featureId)}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        feedbackOrEvidence: feedback
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const updated = await res.json();
    showToast(`Tarefa ${taskId} sincronizada para "${status}" em tasks.md`);
    await loadFeatures();
  } catch (err) {
    console.error('Error updating task:', err);
    showToast(`Falha ao atualizar tarefa ${taskId}: ${err.message}`);
  }
}

function handleDispatchAgent(task) {
  const prompt = `[HUMAN-AI DELEGATION]\nFeature: ${task.featureId}\nTask: ${task.id} (${task.type})\nDescription: ${task.description}\nTarget Files: ${task.targetFiles || 'N/A'}\nDependencies: ${task.dependencies || 'None'}\n\nExecute atomicamente seguindo o ciclo TDD (sdd-executor).`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(prompt).catch(() => {});
  }

  isTerminalOpen.value = true;
  showToast(`Tarefa ${task.id} delegada! Prompt copiado para a área de transferência.`);
}

function initSSE() {
  try {
    eventSource = new EventSource('/api/events');
    eventSource.onopen = () => {
      syncState.value = 'connected';
    };
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'reload' || payload.event === 'init') {
          loadFeatures();
        }
      } catch (e) {
        loadFeatures();
      }
    };
    eventSource.onerror = () => {
      syncState.value = 'disconnected';
    };
  } catch (err) {
    syncState.value = 'disconnected';
  }
}

function handleKeyDown(e) {
  // Toggle terminal drawer with Ctrl+` or Cmd+`
  if ((e.ctrlKey || e.metaKey) && e.key === '`') {
    e.preventDefault();
    isTerminalOpen.value = !isTerminalOpen.value;
  }
}

onMounted(() => {
  loadFeatures();
  initSSE();
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  if (eventSource) {
    eventSource.close();
  }
  window.removeEventListener('keydown', handleKeyDown);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>
