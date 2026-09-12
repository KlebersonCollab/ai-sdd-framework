<template>
  <div>
    <!-- Top Filter Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 bg-surface-1 border border-hairline p-3 rounded-lg">
      <div class="flex items-center gap-2">
        <span class="text-xs uppercase font-mono font-semibold text-ink-muted">Kanban Controls:</span>
        
        <!-- Feature Filter -->
        <select
          v-model="selectedFeatureId"
          class="bg-surface-2 border border-hairline rounded px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-primary font-mono"
        >
          <option value="ALL">All Features ({{ features.length }})</option>
          <option v-for="f in features" :key="f.id" :value="f.id">{{ f.title || f.id }}</option>
        </select>

        <!-- Type Filter -->
        <select
          v-model="selectedType"
          class="bg-surface-2 border border-hairline rounded px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-primary font-mono"
        >
          <option value="ALL">All Types</option>
          <option value="feat">feat</option>
          <option value="test">test</option>
          <option value="refactor">refactor</option>
          <option value="fix">fix</option>
          <option value="review">review</option>
          <option value="docs">docs</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <!-- Quick search -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter cards..."
          class="bg-surface-2 border border-hairline rounded px-3 py-1 text-xs text-white placeholder-ink-subtle focus:outline-none focus:border-primary w-48"
        />
      </div>
    </div>

    <!-- 3-Column Kanban Board -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- COLUMN 1: TO DO (Pending) -->
      <div
        class="bg-surface-1 border border-hairline rounded-lg p-3 flex flex-col min-h-[600px]"
        @dragover.prevent
        @drop="handleDrop('pending')"
      >
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-hairline">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-ink-subtle"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-ink">To Do (Pending)</span>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-mono bg-surface-3 text-ink-muted border border-hairline">
            {{ pendingTasks.length }}
          </span>
        </div>

        <div class="space-y-3 flex-1 overflow-y-auto pr-1">
          <div
            v-for="task in pendingTasks"
            :key="task.id + task.featureId"
            draggable="true"
            @dragstart="onDragStart(task)"
            class="bg-surface-2 border border-hairline rounded-md p-3 hover:border-hairline-strong transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono font-bold text-xs text-white">{{ task.id }}</span>
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-3 text-ink-muted border border-hairline">
                  {{ task.type }}
                </span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-4 text-primary-hover border border-primary/20 truncate max-w-[90px]">
                  {{ task.featureId }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-ink mb-2 line-clamp-3 leading-relaxed">{{ task.description }}</p>

            <!-- Target Files -->
            <div v-if="task.targetFiles" class="mb-2">
              <code class="text-[10px] font-mono text-ink-muted bg-surface-3 px-1.5 py-0.5 rounded border border-hairline truncate block">
                {{ task.targetFiles }}
              </code>
            </div>

            <!-- Reversion Feedback Note if any -->
            <div v-if="task.evidence && task.evidence.includes('[Reverted]')" class="mb-3 p-2 rounded bg-semantic-danger/10 border border-semantic-danger/30 text-[11px] text-semantic-danger font-mono">
              {{ task.evidence }}
            </div>

            <!-- Card Actions -->
            <div class="pt-2 border-t border-hairline flex items-center justify-between gap-2">
              <button
                type="button"
                @click="dispatchToAgent(task)"
                class="px-2 py-1 rounded text-[11px] font-mono font-semibold bg-primary/20 hover:bg-primary/30 text-primary-hover border border-primary/30 flex items-center gap-1 transition-colors"
                title="Send task prompt directly to AI Agent / Terminal"
              >
                ⚡ Delegar
              </button>

              <button
                type="button"
                @click="moveTaskDirectly(task, 'in_progress')"
                class="px-2 py-1 rounded text-[11px] font-mono text-ink-muted hover:text-white bg-surface-3 hover:bg-surface-4 border border-hairline transition-colors"
                title="Move to In Progress"
              >
                Iniciar ▶
              </button>
            </div>
          </div>

          <div v-if="pendingTasks.length === 0" class="h-32 flex items-center justify-center text-xs font-mono text-ink-subtle border border-dashed border-hairline rounded">
            No pending tasks
          </div>
        </div>
      </div>

      <!-- COLUMN 2: IN PROGRESS (Agent Working) -->
      <div
        class="bg-surface-1 border border-hairline rounded-lg p-3 flex flex-col min-h-[600px]"
        @dragover.prevent
        @drop="handleDrop('in_progress')"
      >
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-hairline">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-primary-hover">In Progress</span>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary-hover border border-primary/20">
            {{ inProgressTasks.length }}
          </span>
        </div>

        <div class="space-y-3 flex-1 overflow-y-auto pr-1">
          <div
            v-for="task in inProgressTasks"
            :key="task.id + task.featureId"
            draggable="true"
            @dragstart="onDragStart(task)"
            class="bg-surface-2 border border-primary/30 rounded-md p-3 hover:border-primary transition-all cursor-grab active:cursor-grabbing shadow-sm"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-xs text-white">{{ task.id }}</span>
                <span class="w-2 h-2 rounded-full bg-primary-hover animate-ping"></span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/20 text-primary-hover border border-primary/30">
                  {{ task.type }}
                </span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-4 text-primary-hover border border-primary/20 truncate max-w-[90px]">
                  {{ task.featureId }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-ink mb-2 line-clamp-3 leading-relaxed">{{ task.description }}</p>

            <!-- Target Files -->
            <div v-if="task.targetFiles" class="mb-2">
              <code class="text-[10px] font-mono text-ink-muted bg-surface-3 px-1.5 py-0.5 rounded border border-hairline truncate block">
                {{ task.targetFiles }}
              </code>
            </div>

            <!-- Dependencies -->
            <div v-if="task.dependencies && task.dependencies !== 'None'" class="mb-2 text-[10px] font-mono text-ink-subtle">
              Deps: <span class="text-ink-muted">{{ task.dependencies }}</span>
            </div>

            <!-- Card Actions -->
            <div class="pt-2 border-t border-hairline flex items-center justify-between gap-2">
              <button
                type="button"
                @click="openRejectModal(task)"
                class="px-2 py-1 rounded text-[11px] font-mono text-semantic-danger hover:bg-semantic-danger/10 border border-semantic-danger/30 transition-colors"
                title="Reject or revert task back to To Do"
              >
                ↩ Rejeitar
              </button>

              <button
                type="button"
                @click="moveTaskDirectly(task, 'done')"
                class="px-2 py-1 rounded text-[11px] font-mono font-semibold bg-semantic-success/20 hover:bg-semantic-success/30 text-semantic-success border border-semantic-success/40 transition-colors"
                title="Mark as Done / Verified"
              >
                ✓ Concluir
              </button>
            </div>
          </div>

          <div v-if="inProgressTasks.length === 0" class="h-32 flex items-center justify-center text-xs font-mono text-ink-subtle border border-dashed border-hairline rounded">
            No tasks in progress
          </div>
        </div>
      </div>

      <!-- COLUMN 3: DONE (Verified / Gate) -->
      <div
        class="bg-surface-1 border border-hairline rounded-lg p-3 flex flex-col min-h-[600px]"
        @dragover.prevent
        @drop="handleDrop('done')"
      >
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-hairline">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-semantic-success"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-semantic-success">Done (Verified)</span>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-mono bg-semantic-success/15 text-semantic-success border border-semantic-success/30">
            {{ doneTasks.length }}
          </span>
        </div>

        <div class="space-y-3 flex-1 overflow-y-auto pr-1">
          <div
            v-for="task in doneTasks"
            :key="task.id + task.featureId"
            draggable="true"
            @dragstart="onDragStart(task)"
            class="bg-surface-2 border border-hairline rounded-md p-3 hover:border-hairline-strong transition-all cursor-grab active:cursor-grabbing opacity-90 hover:opacity-100 shadow-sm"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-1.5">
                <span class="text-semantic-success font-bold text-xs">✓</span>
                <span class="font-mono font-bold text-xs text-white">{{ task.id }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-3 text-ink-muted border border-hairline">
                  {{ task.type }}
                </span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-4 text-ink-muted border border-hairline truncate max-w-[90px]">
                  {{ task.featureId }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-ink-muted mb-2 line-clamp-2">{{ task.description }}</p>

            <!-- Evidence snippet -->
            <div v-if="task.evidence" class="mb-2">
              <div class="text-[10px] font-mono text-semantic-success bg-semantic-success/10 px-1.5 py-0.5 rounded border border-semantic-success/20 truncate">
                Ev: {{ task.evidence }}
              </div>
            </div>

            <!-- Card Actions -->
            <div class="pt-2 border-t border-hairline flex items-center justify-between gap-2">
              <button
                type="button"
                @click="openRejectModal(task)"
                class="px-2 py-1 rounded text-[11px] font-mono text-semantic-danger hover:bg-semantic-danger/10 border border-semantic-danger/30 transition-colors w-full text-center"
                title="Reopen/Reject if delivery quality is insufficient"
              >
                ↩ Solicitar Ajustes (Reverter)
              </button>
            </div>
          </div>

          <div v-if="doneTasks.length === 0" class="h-32 flex items-center justify-center text-xs font-mono text-ink-subtle border border-dashed border-hairline rounded">
            No completed tasks
          </div>
        </div>
      </div>
    </div>

    <!-- Rejection & Feedback Modal -->
    <div
      v-if="isRejectModalOpen"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div class="bg-surface-1 border border-hairline-strong rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-hairline">
          <div class="flex items-center gap-2">
            <span class="text-lg">↩️</span>
            <h4 class="font-bold text-sm text-white font-mono">Rejeitar Entrega: {{ activeTaskForModal?.id }}</h4>
          </div>
          <button
            type="button"
            @click="closeRejectModal"
            class="text-ink-muted hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        <p class="text-xs text-ink-muted leading-relaxed">
          Ao reverter a tarefa para <strong>To Do (Pendente)</strong>, descreva o que a IA precisa corrigir.
          Esse feedback será gravado no <code>tasks.md</code> e ficará imediatamente visível para o agente.
        </p>

        <div>
          <label class="block text-xs uppercase font-mono font-semibold text-ink-muted mb-1.5">
            Motivo da Rejeição / Instrução de Ajuste:
          </label>
          <textarea
            v-model="rejectionFeedback"
            rows="3"
            placeholder="Ex: O teste de borda falhou no cenário de timeout; a função precisa validar campos nulos antes de processar..."
            class="w-full bg-surface-2 border border-hairline rounded-md p-2.5 text-xs text-white placeholder-ink-subtle focus:outline-none focus:border-semantic-danger focus:ring-1 focus:ring-semantic-danger font-mono"
          ></textarea>
        </div>

        <div class="flex justify-end items-center gap-3 pt-2">
          <button
            type="button"
            @click="closeRejectModal"
            class="px-3 py-1.5 rounded text-xs text-ink-muted hover:text-white bg-surface-3 hover:bg-surface-4 border border-hairline font-mono"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="submitRejection"
            class="px-3.5 py-1.5 rounded text-xs font-semibold text-white bg-semantic-danger hover:bg-semantic-danger/90 font-mono shadow"
          >
            Gravar & Mover para To Do
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  features: { type: Array, default: () => [] }
});

const emit = defineEmits(['update-task', 'dispatch-agent']);

const selectedFeatureId = ref('ALL');
const selectedType = ref('ALL');
const searchQuery = ref('');

const draggedTask = ref(null);

// Modal state
const isRejectModalOpen = ref(false);
const activeTaskForModal = ref(null);
const rejectionFeedback = ref('');

// Flatten all tasks with their respective featureId
const allTasks = computed(() => {
  const list = [];
  (props.features || []).forEach(f => {
    (f.tasks || []).forEach(t => {
      list.push({
        ...t,
        featureId: f.id,
        featureTitle: f.title
      });
    });
  });
  return list;
});

const filteredTasks = computed(() => {
  return allTasks.value.filter(t => {
    if (selectedFeatureId.value !== 'ALL' && t.featureId !== selectedFeatureId.value) return false;
    if (selectedType.value !== 'ALL' && t.type !== selectedType.value) return false;
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      const matchId = t.id && t.id.toLowerCase().includes(q);
      const matchDesc = t.description && t.description.toLowerCase().includes(q);
      if (!matchId && !matchDesc) return false;
    }
    return true;
  });
});

const pendingTasks = computed(() => filteredTasks.value.filter(t => t.status === 'pending'));
const inProgressTasks = computed(() => filteredTasks.value.filter(t => t.status === 'in_progress'));
const doneTasks = computed(() => filteredTasks.value.filter(t => t.status === 'done'));

function onDragStart(task) {
  draggedTask.value = task;
}

function handleDrop(targetStatus) {
  if (!draggedTask.value) return;
  const task = draggedTask.value;
  draggedTask.value = null;

  if (task.status === targetStatus) return;

  // If reverting from done to pending, prompt for feedback
  if (task.status === 'done' && (targetStatus === 'pending' || targetStatus === 'in_progress')) {
    openRejectModal(task);
    return;
  }

  moveTaskDirectly(task, targetStatus);
}

function moveTaskDirectly(task, status, feedback) {
  emit('update-task', {
    featureId: task.featureId,
    taskId: task.id,
    status,
    feedback
  });
}

function openRejectModal(task) {
  activeTaskForModal.value = task;
  rejectionFeedback.value = '';
  isRejectModalOpen.value = true;
}

function closeRejectModal() {
  isRejectModalOpen.value = false;
  activeTaskForModal.value = null;
  rejectionFeedback.value = '';
}

function submitRejection() {
  if (!activeTaskForModal.value) return;
  const task = activeTaskForModal.value;
  moveTaskDirectly(task, 'pending', rejectionFeedback.value.trim() || 'Needs revision');
  closeRejectModal();
}

function dispatchToAgent(task) {
  emit('dispatch-agent', task);
}
</script>
