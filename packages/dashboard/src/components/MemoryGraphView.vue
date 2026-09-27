<template>
  <div class="flex flex-col lg:flex-row gap-4 h-[750px] relative">
    <!-- Main Graph Canvas Container -->
    <div class="flex-1 bg-surface-1 border border-hairline rounded-lg flex flex-col overflow-hidden relative shadow-sm">
      <!-- Graph Header & Toolbar -->
      <div class="h-12 px-4 bg-surface-2 border-b border-hairline flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono font-bold text-ink uppercase tracking-wider">SDD Memory Graph</span>
          <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-3 text-ink-muted border border-hairline">
            {{ nodes.length }} nodes · {{ edges.length }} edges
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Type Filter -->
          <select
            v-model="selectedType"
            class="bg-surface-3 border border-hairline rounded px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-primary font-mono"
          >
            <option value="ALL">All Types ({{ typeList.length }})</option>
            <option v-for="t in typeList" :key="t" :value="t">{{ t }}</option>
          </select>

          <!-- Search Node -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search entity..."
            class="bg-surface-3 border border-hairline rounded px-2.5 py-1 text-xs text-white placeholder-ink-subtle focus:outline-none focus:border-primary w-36 sm:w-44 font-mono"
          />

          <!-- Fit / Reset -->
          <button
            type="button"
            @click="fitNetwork"
            class="px-2.5 py-1 bg-surface-3 hover:bg-surface-4 border border-hairline rounded text-xs font-mono text-ink-muted hover:text-white transition-colors"
            title="Reset zoom and center graph"
          >
            Fit ⛶
          </button>

          <!-- Refresh -->
          <button
            type="button"
            @click="fetchMemory"
            :disabled="loading"
            class="px-2.5 py-1 bg-surface-3 hover:bg-surface-4 border border-hairline rounded text-xs font-mono text-primary-hover transition-colors"
            title="Reload memory from disk"
          >
            {{ loading ? '...' : '↻' }}
          </button>
        </div>
      </div>

      <!-- Network Canvas -->
      <div ref="networkContainer" class="flex-1 w-full h-full bg-[#0d0f14]"></div>

      <!-- Legend -->
      <div class="absolute bottom-3 left-3 bg-surface-2/90 backdrop-blur border border-hairline rounded px-3 py-1.5 flex flex-wrap items-center gap-3 text-[10px] font-mono pointer-events-none">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#5e6ad2]"></span>
          <span class="text-ink-muted">Service/Core</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#4ade80]"></span>
          <span class="text-ink-muted">Pattern/Rule</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
          <span class="text-ink-muted">Module/UI</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#64748b]"></span>
          <span class="text-ink-muted">Inferred</span>
        </div>
      </div>
    </div>

    <!-- Side Node Inspector Drawer -->
    <div
      v-if="selectedNode"
      class="w-full lg:w-80 bg-surface-1 border border-hairline rounded-lg flex flex-col overflow-hidden shadow-lg"
    >
      <div class="h-12 px-4 bg-surface-2 border-b border-hairline flex items-center justify-between">
        <span class="text-xs font-mono font-bold text-ink uppercase tracking-wider">Entity Inspector</span>
        <button
          type="button"
          @click="selectedNode = null"
          class="text-ink-muted hover:text-white text-xs font-mono p-1"
        >
          ✕
        </button>
      </div>

      <div class="flex-1 p-4 overflow-y-auto space-y-4">
        <!-- Node Title & Status -->
        <div>
          <div class="flex items-center justify-between gap-2 mb-1">
            <h4 class="font-mono font-bold text-sm text-white break-all">{{ selectedNode.label || selectedNode.id }}</h4>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
              :class="selectedNode.status === 'active' ? 'bg-semantic-success/20 text-semantic-success border border-semantic-success/30' : 'bg-surface-3 text-ink-subtle border border-hairline'"
            >
              {{ selectedNode.status || 'active' }}
            </span>
          </div>
          <p class="text-[11px] font-mono text-primary-hover">{{ selectedNode.entityType || 'entity' }}</p>
        </div>

        <!-- Metadata Grid -->
        <div class="bg-surface-2 border border-hairline rounded p-3 space-y-2 text-xs font-mono">
          <div class="flex justify-between">
            <span class="text-ink-muted">Role:</span>
            <span class="text-ink">{{ selectedNode.role || 'N/A' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-muted">Confidence:</span>
            <span class="text-ink">{{ selectedNode.confidence || 'high' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-muted">Namespace:</span>
            <span class="text-ink">{{ selectedNode.namespace || 'global' }}</span>
          </div>
          <div v-if="selectedNode.tenantId" class="flex justify-between">
            <span class="text-ink-muted">Tenant:</span>
            <span class="text-ink">{{ selectedNode.tenantId }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-muted">Access Count:</span>
            <span class="text-ink">{{ selectedNode.accessCount || 0 }}</span>
          </div>
        </div>

        <!-- Connected Relations -->
        <div>
          <h5 class="text-xs font-mono font-bold text-ink-muted uppercase tracking-wider mb-2">Connected Relations ({{ connectedEdges.length }})</h5>
          <div v-if="connectedEdges.length === 0" class="text-xs text-ink-subtle italic">No relations recorded.</div>
          <div v-else class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            <div
              v-for="(edge, idx) in connectedEdges"
              :key="idx"
              class="p-2 rounded bg-surface-2 border border-hairline text-xs font-mono"
            >
              <div class="flex items-center gap-1.5 text-primary-hover">
                <span class="text-[11px] font-bold">{{ edge.predicate || edge.label || 'RELATED_TO' }}</span>
                <span class="text-ink-subtle">➔</span>
              </div>
              <div class="text-ink text-[11px] mt-0.5 truncate">
                {{ edge.from === selectedNode.id ? edge.to : edge.from }}
              </div>
            </div>
          </div>
        </div>

        <!-- Observations -->
        <div>
          <h5 class="text-xs font-mono font-bold text-ink-muted uppercase tracking-wider mb-2">
            Observations ({{ (selectedNode.observations || []).length }})
          </h5>
          <div v-if="!selectedNode.observations || selectedNode.observations.length === 0" class="text-xs text-ink-subtle italic">
            No observations recorded.
          </div>
          <ul v-else class="space-y-2 max-h-52 overflow-y-auto pr-1">
            <li
              v-for="(obs, idx) in selectedNode.observations"
              :key="idx"
              class="p-2.5 rounded bg-surface-2 border border-hairline text-xs text-ink leading-relaxed"
            >
              {{ obs }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { Network } from 'vis-network';

const networkContainer = ref(null);
const loading = ref(false);
const nodes = ref([]);
const edges = ref([]);
const stats = ref({});
const selectedType = ref('ALL');
const searchQuery = ref('');
const selectedNode = ref(null);

let networkInstance = null;

const typeList = computed(() => {
  const types = new Set();
  nodes.value.forEach(n => {
    if (n.entityType) types.add(n.entityType);
  });
  return Array.from(types).sort();
});

const connectedEdges = computed(() => {
  if (!selectedNode.value) return [];
  const id = selectedNode.value.id;
  return edges.value.filter(e => e.from === id || e.to === id);
});

function getNodeColor(entityType, status) {
  if (status === 'superseded') {
    return {
      background: '#27272a',
      border: '#52525b',
      highlight: { background: '#3f3f46', border: '#71717a' }
    };
  }

  switch ((entityType || '').toLowerCase()) {
    case 'service':
    case 'core':
    case 'architecture':
      return {
        background: '#5e6ad2',
        border: '#4b55b8',
        highlight: { background: '#717de0', border: '#8b96f5' }
      };
    case 'pattern':
    case 'rule':
    case 'guideline':
      return {
        background: '#15803d',
        border: '#22c55e',
        highlight: { background: '#16a34a', border: '#4ade80' }
      };
    case 'module':
    case 'ui':
    case 'component':
      return {
        background: '#b45309',
        border: '#f59e0b',
        highlight: { background: '#d97706', border: '#fbbf24' }
      };
    case 'inferred':
      return {
        background: '#334155',
        border: '#64748b',
        highlight: { background: '#475569', border: '#94a3b8' }
      };
    default:
      return {
        background: '#3f3f46',
        border: '#71717a',
        highlight: { background: '#52525b', border: '#a1a1aa' }
      };
  }
}

async function fetchMemory() {
  loading.value = true;
  try {
    const res = await fetch('/api/memory');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    nodes.value = data.nodes || [];
    edges.value = data.edges || [];
    stats.value = data.stats || {};
    renderGraph();
  } catch (err) {
    console.error('Failed to load memory graph:', err);
  } finally {
    loading.value = false;
  }
}

function renderGraph() {
  if (!networkContainer.value) return;

  const filteredNodes = nodes.value.filter(n => {
    if (selectedType.value !== 'ALL' && n.entityType !== selectedType.value) return false;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchId = (n.id || '').toLowerCase().includes(q);
      const matchLabel = (n.label || '').toLowerCase().includes(q);
      if (!matchId && !matchLabel) return false;
    }
    return true;
  });

  const activeNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.value.filter(e => activeNodeIds.has(e.from) && activeNodeIds.has(e.to));

  const visNodes = filteredNodes.map(n => ({
    id: n.id,
    label: n.label || n.id,
    title: `${n.id} (${n.entityType || 'entity'})`,
    color: getNodeColor(n.entityType, n.status),
    shape: n.status === 'superseded' ? 'box' : 'dot',
    size: Math.max(16, Math.min(32, 16 + (n.accessCount || 0) * 2)),
    font: {
      color: '#f1f3f5',
      face: 'JetBrains Mono, monospace',
      size: 11
    },
    borderWidth: 1.5,
    shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 5 }
  }));

  const visEdges = filteredEdges.map(e => ({
    from: e.from,
    to: e.to,
    label: e.predicate || e.label || '',
    arrows: 'to',
    color: {
      color: 'rgba(255, 255, 255, 0.18)',
      highlight: '#5e6ad2',
      hover: '#717de0'
    },
    font: {
      color: '#9ca3af',
      face: 'JetBrains Mono, monospace',
      size: 9,
      align: 'middle'
    },
    smooth: {
      type: 'continuous'
    }
  }));

  const options = {
    physics: {
      barnesHut: {
        gravitationalConstant: -2500,
        centralGravity: 0.3,
        springLength: 120,
        springConstant: 0.04
      },
      stabilization: { iterations: 100 }
    },
    interaction: {
      hover: true,
      tooltipDelay: 150,
      zoomView: true,
      dragView: true
    }
  };

  if (networkInstance) {
    networkInstance.destroy();
  }

  networkInstance = new Network(networkContainer.value, { nodes: visNodes, edges: visEdges }, options);

  networkInstance.on('click', (params) => {
    if (params.nodes && params.nodes.length > 0) {
      const clickedId = params.nodes[0];
      selectedNode.value = nodes.value.find(n => n.id === clickedId) || null;
    } else {
      selectedNode.value = null;
    }
  });
}

function fitNetwork() {
  if (networkInstance) {
    networkInstance.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
  }
}

watch([selectedType, searchQuery], () => {
  renderGraph();
});

onMounted(() => {
  fetchMemory();
});

onBeforeUnmount(() => {
  if (networkInstance) {
    networkInstance.destroy();
  }
});

defineExpose({
  fetchMemory
});
</script>
