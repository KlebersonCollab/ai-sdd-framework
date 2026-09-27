<template>
  <div class="space-y-4">
    <!-- Header with Sub-tabs and Search Bar -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-surface-1 border border-hairline p-3 rounded-lg">
      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          v-for="tab in subTabs"
          :key="tab.id"
          @click="activeSubTab = tab.id"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors border',
            activeSubTab === tab.id
              ? 'bg-surface-3 text-white border-hairline-strong shadow-sm'
              : 'text-ink-muted hover:text-white border-transparent hover:bg-surface-2'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="w-full md:w-64">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full bg-surface-2 border border-hairline rounded-md px-3 py-1.5 text-xs text-white placeholder-ink-subtle focus:outline-none focus:border-primary font-mono"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-surface-1 border border-hairline rounded-lg p-12 text-center text-ink-muted">
      <p class="text-xs font-mono animate-pulse">Loading specifications and architectural maps...</p>
    </div>

    <!-- TAB 1: ARCHITECTURE & CODEBASE -->
    <div v-else-if="activeSubTab === 'architecture'" class="space-y-4">
      <div class="grid grid-cols-1 gap-4">
        <!-- Technical Map -->
        <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Consolidated Technical Map (TECHNICAL-MAP.md)</span>
            <span class="text-[11px] font-mono text-ink-muted">Reality Baseline</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(codebase.technicalMap)"></div>
        </div>

        <!-- Architecture & Mermaid Diagrams -->
        <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">System Architecture (ARCHITECTURE.md)</span>
            <span class="text-[11px] font-mono text-ink-muted">Directory & Boundaries</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" ref="architectureContainer" v-html="renderMd(codebase.architecture)"></div>
        </div>

        <!-- Stack & Conventions Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Stack & Tooling (STACK.md)</span>
            </div>
            <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(codebase.stack)"></div>
          </div>

          <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Conventions & Idioms (CONVENTIONS.md)</span>
            </div>
            <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(codebase.conventions)"></div>
          </div>
        </div>

        <!-- Concerns & Technical Debt -->
        <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-semantic-warning uppercase tracking-wider">Critical Risks & Technical Debt (CONCERNS.md)</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(codebase.concerns)"></div>
        </div>
      </div>
    </div>

    <!-- TAB 2: ADR DECISION HUB -->
    <div v-else-if="activeSubTab === 'adrs'" class="space-y-4">
      <!-- Status Filters -->
      <div class="flex items-center gap-2">
        <button
          v-for="st in adrStatusFilters"
          :key="st.id"
          @click="selectedAdrStatus = st.id"
          :class="[
            'px-2.5 py-1 rounded text-xs font-mono border transition-colors',
            selectedAdrStatus === st.id
              ? 'bg-primary/20 text-primary-hover border-primary/40 font-semibold'
              : 'bg-surface-2 text-ink-muted border-hairline hover:text-white'
          ]"
        >
          {{ st.label }} ({{ getAdrCount(st.id) }})
        </button>
      </div>

      <!-- ADR Cards List -->
      <div v-if="filteredAdrs.length === 0" class="bg-surface-1 border border-hairline rounded-lg p-8 text-center text-ink-muted">
        <p class="text-xs font-mono">No ADRs matching the selected filter.</p>
      </div>

      <div class="space-y-3">
        <div
          v-for="adr in filteredAdrs"
          :key="adr.id"
          class="bg-surface-1 border border-hairline rounded-lg overflow-hidden transition-colors hover:border-hairline-strong"
        >
          <div
            @click="toggleAdr(adr.id)"
            class="p-4 flex items-center justify-between cursor-pointer select-none bg-surface-1 hover:bg-surface-2/60 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase border',
                  adr.status === 'accepted' ? 'bg-semantic-success/15 text-semantic-success border-semantic-success/30' :
                  adr.status === 'superseded' ? 'bg-surface-3 text-ink-muted border-hairline' :
                  adr.status === 'proposed' ? 'bg-primary/15 text-primary-hover border-primary/30' :
                  'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30'
                ]"
              >
                {{ adr.status }}
              </span>
              <span class="font-bold text-white text-sm">{{ adr.title }}</span>
              <span class="text-xs font-mono text-ink-subtle hidden sm:inline">{{ adr.id }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="adr.date" class="text-xs font-mono text-ink-muted">{{ adr.date }}</span>
              <svg
                :class="['w-4 h-4 text-ink-muted transition-transform duration-200', expandedAdrs[adr.id] ? 'rotate-180' : '']"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          <!-- ADR Details -->
          <div v-show="expandedAdrs[adr.id]" class="p-5 border-t border-hairline bg-surface-2/30 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(adr.content)"></div>
        </div>
      </div>
    </div>

    <!-- TAB 3: DOMAIN GLOSSARY & VISION -->
    <div v-else-if="activeSubTab === 'glossary'" class="space-y-4">
      <div class="grid grid-cols-1 gap-4">
        <!-- Vision & North Star -->
        <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Project Vision (PROJECT.md)</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(project.project)"></div>
        </div>

        <!-- Roadmap -->
        <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Strategic Roadmap (ROADMAP.md)</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(project.roadmap)"></div>
        </div>

        <!-- Domain Glossary -->
        <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-primary-hover uppercase tracking-wider">Domain Glossary & Ubiquitous Language (CONTEXT.md)</span>
            <span class="text-[11px] font-mono text-ink-muted">Canonical Terms</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(project.context)"></div>
        </div>

        <!-- State & Memory -->
        <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Operational State & Blockers (STATE.md)</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(project.state)"></div>
        </div>
      </div>
    </div>

    <!-- TAB 4: GOVERNANCE & RULES -->
    <div v-else-if="activeSubTab === 'rules'" class="space-y-4">
      <div class="grid grid-cols-1 gap-4">
        <!-- Tier 1 Prohibitions -->
        <div class="bg-surface-1 border border-semantic-warning/30 rounded-lg overflow-hidden shadow-sm">
          <div class="px-4 py-2.5 bg-semantic-warning/10 border-b border-semantic-warning/20 flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-semantic-warning uppercase tracking-wider">Tier 1 Absolute Prohibitions (TIER1_PROHIBITIONS.md)</span>
            <span class="text-[11px] font-mono text-semantic-warning font-semibold">Highest Precedence Gate</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(rules.prohibitions)"></div>
        </div>

        <!-- Quality Enforcement -->
        <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Quality Enforcement (QUALITY_ENFORCEMENT.md)</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(rules.quality)"></div>
        </div>

        <!-- Token Optimization -->
        <div class="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Token Optimization (TOKEN_OPTIMIZATION.md)</span>
          </div>
          <div class="p-4 text-xs text-ink prose prose-invert max-w-none" v-html="renderMd(rules.tokenOptimization)"></div>
        </div>
      </div>
    </div>

    <!-- TAB 5: KNOWLEDGE BASE -->
    <div v-else-if="activeSubTab === 'knowledge'" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Curated Patterns -->
        <div class="bg-surface-1 border border-hairline rounded-lg p-4">
          <h4 class="text-xs font-mono font-bold text-semantic-success uppercase tracking-wider mb-2">Curated Patterns</h4>
          <div v-if="!knowledge.patterns?.length" class="text-xs text-ink-muted italic">
            No patterns registered in .specs/knowledge/patterns/ yet.
          </div>
          <div v-else class="space-y-2">
            <div v-for="p in knowledge.patterns" :key="p.id" class="p-2 bg-surface-2 border border-hairline rounded text-xs">
              <span class="font-bold text-white block">{{ p.id }}</span>
              <div v-html="renderMd(p.content)"></div>
            </div>
          </div>
        </div>

        <!-- Anti-Patterns -->
        <div class="bg-surface-1 border border-hairline rounded-lg p-4">
          <h4 class="text-xs font-mono font-bold text-semantic-warning uppercase tracking-wider mb-2">Known Anti-Patterns</h4>
          <div v-if="!knowledge.antiPatterns?.length" class="text-xs text-ink-muted italic">
            No anti-patterns registered in .specs/knowledge/anti-patterns/ yet.
          </div>
          <div v-else class="space-y-2">
            <div v-for="ap in knowledge.antiPatterns" :key="ap.id" class="p-2 bg-surface-2 border border-hairline rounded text-xs">
              <span class="font-bold text-white block">{{ ap.id }}</span>
              <div v-html="renderMd(ap.content)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { marked } from 'marked';

const subTabs = [
  { id: 'architecture', label: '🏛️ Architecture & System' },
  { id: 'adrs', label: '📜 ADR Decision Hub' },
  { id: 'glossary', label: '📖 Domain & Vision' },
  { id: 'rules', label: '🛡️ Rules & Quality' },
  { id: 'knowledge', label: '🧠 Knowledge Base' }
];

const activeSubTab = ref('architecture');
const searchQuery = ref('');
const loading = ref(true);

const project = ref({ project: '', roadmap: '', state: '', context: '', adrs: [] });
const codebase = ref({ stack: '', architecture: '', conventions: '', concerns: '', technicalMap: '' });
const rules = ref({ prohibitions: '', quality: '', tokenOptimization: '' });
const knowledge = ref({ patterns: [], antiPatterns: [] });

const selectedAdrStatus = ref('all');
const expandedAdrs = ref({});
const architectureContainer = ref(null);

const adrStatusFilters = [
  { id: 'all', label: 'All' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'superseded', label: 'Superseded' },
  { id: 'proposed', label: 'Proposed' }
];

const searchPlaceholder = computed(() => {
  if (activeSubTab.value === 'adrs') return 'Filter ADR decisions...';
  if (activeSubTab.value === 'glossary') return 'Search domain terms...';
  return 'Search documentation...';
});

function getAdrCount(status) {
  if (status === 'all') return (project.value.adrs || []).length;
  return (project.value.adrs || []).filter(a => a.status === status).length;
}

const filteredAdrs = computed(() => {
  const adrs = project.value.adrs || [];
  const q = searchQuery.value.toLowerCase().trim();

  return adrs.filter(adr => {
    const matchesStatus = selectedAdrStatus.value === 'all' || adr.status === selectedAdrStatus.value;
    const matchesQuery = !q ||
      adr.title.toLowerCase().includes(q) ||
      adr.id.toLowerCase().includes(q) ||
      adr.content.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });
});

function toggleAdr(id) {
  expandedAdrs.value[id] = !expandedAdrs.value[id];
}

function renderMd(text) {
  if (!text) return '';
  return marked.parse(text);
}

async function renderMermaidDiagrams() {
  await nextTick();
  try {
    if (!window.mermaid) {
      const mermaidModule = await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs');
      window.mermaid = mermaidModule.default;
      window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    }
    const blocks = document.querySelectorAll('pre code.language-mermaid');
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const pre = block.parentElement;
      const code = block.textContent;
      const id = 'mermaid-svg-' + i;
      const { svg } = await window.mermaid.render(id, code);
      const div = document.createElement('div');
      div.className = 'mermaid-rendered-container my-3 overflow-x-auto';
      div.innerHTML = svg;
      pre.replaceWith(div);
    }
  } catch (err) {
    // Graceful fallback to code block on network error
  }
}

async function fetchDocs() {
  loading.value = true;
  try {
    const [pRes, cRes, rRes, kRes] = await Promise.all([
      fetch('/api/project').then(r => r.ok ? r.json() : {}),
      fetch('/api/codebase').then(r => r.ok ? r.json() : {}),
      fetch('/api/rules').then(r => r.ok ? r.json() : {}),
      fetch('/api/knowledge').then(r => r.ok ? r.json() : {})
    ]);

    project.value = pRes || {};
    codebase.value = cRes || {};
    rules.value = rRes || {};
    knowledge.value = kRes || {};

    renderMermaidDiagrams();
  } catch (err) {
    console.error('Failed to load documentation:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchDocs();
});

defineExpose({
  fetchDocs
});
</script>
