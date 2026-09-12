<template>
  <div>
    <!-- Search / Filter Bar -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Active Specifications (.specs/features)
      </h3>
      <div class="w-72">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search features..."
          class="w-full bg-surface-1 border border-hairline rounded-md px-3 py-1.5 text-xs text-white placeholder-ink-subtle focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredFeatures.length === 0" class="bg-surface-1 border border-hairline rounded-lg p-12 text-center text-ink-muted">
      <h4 class="text-base font-semibold text-white mb-1">No features found</h4>
      <p class="text-xs font-mono">Create new specifications under <code>.specs/features/</code> using <code>sdd-planner</code>.</p>
    </div>

    <!-- Features Accordion Cards -->
    <div class="space-y-4">
      <div
        v-for="feature in filteredFeatures"
        :key="feature.id"
        class="bg-surface-1 border border-hairline rounded-lg overflow-hidden transition-colors hover:border-hairline-strong"
      >
        <!-- Feature Header -->
        <div
          @click="toggleFeature(feature.id)"
          class="p-4 flex items-center justify-between cursor-pointer select-none bg-surface-1 hover:bg-surface-2/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="font-bold text-white text-sm">{{ feature.title || feature.id }}</span>
            <span class="px-2 py-0.5 rounded text-xs font-mono bg-surface-3 text-ink-muted border border-hairline">
              {{ feature.id }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 rounded text-xs font-semibold uppercase font-mono border',
                feature.completionRate === 100 ? 'bg-semantic-success/15 text-semantic-success border-semantic-success/30' :
                feature.completionRate > 0 ? 'bg-primary/15 text-primary-hover border-primary/30' :
                'bg-surface-4 text-ink-muted border-hairline'
              ]"
            >
              {{ feature.completionRate === 100 ? 'DONE' : feature.completionRate > 0 ? 'IN PROGRESS' : 'PENDING' }}
            </span>
          </div>

          <div class="flex items-center gap-4">
            <div class="w-32 hidden sm:block">
              <div class="flex justify-between text-xs font-mono text-ink-muted mb-1">
                <span>{{ feature.completedTasks }}/{{ feature.totalTasks }}</span>
                <span>{{ feature.completionRate }}%</span>
              </div>
              <div class="h-1.5 w-full bg-surface-4 border border-hairline rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="feature.completionRate === 100 ? 'bg-semantic-success' : 'bg-primary'"
                  :style="{ width: feature.completionRate + '%' }"
                ></div>
              </div>
            </div>

            <!-- Chevron icon -->
            <svg
              :class="['w-4 h-4 text-ink-muted transition-transform duration-200', expandedFeatures[feature.id] ? 'rotate-180' : '']"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <!-- Vertical Cascade Body -->
        <div v-show="expandedFeatures[feature.id]" class="p-5 border-t border-hairline bg-surface-2/40 space-y-4">
          
          <!-- STEP 1: Strategic Plan & Boundaries -->
          <div class="border border-hairline rounded-md bg-surface-1 overflow-hidden">
            <div
              @click="toggleSub(feature.id, 'plan')"
              class="px-4 py-2.5 bg-surface-3/80 border-b border-hairline flex items-center justify-between cursor-pointer select-none"
            >
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                <span class="px-1.5 py-0.5 rounded text-xs font-mono bg-primary/20 text-primary-hover border border-primary/30">01</span>
                <span>Strategic Plan & Boundaries (plan.md)</span>
              </div>
              <span class="text-xs font-mono text-ink-muted">Toggle</span>
            </div>

            <div v-show="expandedSubs[feature.id + '-plan'] !== false" class="p-4 space-y-4 text-xs">
              <!-- Problem Statement -->
              <div v-if="feature.plan?.problemStatement || feature.problemStatement" class="p-3 rounded bg-surface-2 border-l-4 border-primary">
                <span class="text-ink-muted font-semibold uppercase tracking-wider block mb-1">Problem Statement & Motivation</span>
                <div class="text-ink leading-relaxed" v-html="renderMd(feature.plan?.problemStatement || feature.problemStatement)"></div>
              </div>

              <!-- Scope Boxes -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="p-3 rounded bg-surface-2 border border-hairline">
                  <span class="inline-block px-2 py-0.5 rounded text-xs font-mono bg-semantic-success/15 text-semantic-success border border-semantic-success/30 font-semibold mb-2">
                    ✓ IN SCOPE
                  </span>
                  <ul class="space-y-1.5 text-ink-muted">
                    <li v-for="(item, idx) in (feature.plan?.inScope || [])" :key="idx" class="flex items-start gap-1.5">
                      <span class="text-semantic-success">✓</span>
                      <span class="text-white">{{ item }}</span>
                    </li>
                    <li v-if="!feature.plan?.inScope?.length" class="text-ink-subtle italic">No declared items</li>
                  </ul>
                </div>

                <div class="p-3 rounded bg-surface-2 border border-hairline">
                  <span class="inline-block px-2 py-0.5 rounded text-xs font-mono bg-surface-4 text-ink-muted border border-hairline font-semibold mb-2">
                    ✕ OUT OF SCOPE
                  </span>
                  <ul class="space-y-1.5 text-ink-muted">
                    <li v-for="(item, idx) in (feature.plan?.outOfScope || [])" :key="idx" class="flex items-start gap-1.5">
                      <span class="text-ink-subtle">✕</span>
                      <span>{{ item }}</span>
                    </li>
                    <li v-if="!feature.plan?.outOfScope?.length" class="text-ink-subtle italic">No declared items</li>
                  </ul>
                </div>
              </div>

              <!-- High-level Approach -->
              <div v-if="feature.plan?.approach" class="p-3 rounded bg-surface-2 border border-hairline">
                <span class="text-ink-muted font-semibold uppercase tracking-wider block mb-1">High-Level Approach</span>
                <div class="text-ink leading-relaxed" v-html="renderMd(feature.plan.approach)"></div>
              </div>

              <!-- ADRs -->
              <div v-if="feature.plan?.adrs?.length" class="flex items-center gap-2 flex-wrap pt-2">
                <span class="text-ink-muted font-semibold uppercase tracking-wider">ADRs:</span>
                <span
                  v-for="(adr, idx) in feature.plan.adrs"
                  :key="idx"
                  class="px-2 py-0.5 rounded text-xs font-mono bg-surface-3 text-primary-hover border border-hairline"
                >
                  {{ adr.title }}
                </span>
              </div>
            </div>
          </div>

          <!-- STEP 2: User Stories -->
          <div class="border border-hairline rounded-md bg-surface-1 overflow-hidden">
            <div
              @click="toggleSub(feature.id, 'us')"
              class="px-4 py-2.5 bg-surface-3/80 border-b border-hairline flex items-center justify-between cursor-pointer select-none"
            >
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                <span class="px-1.5 py-0.5 rounded text-xs font-mono bg-primary/20 text-primary-hover border border-primary/30">02</span>
                <span>User Stories ({{ feature.userStories?.length || 0 }})</span>
              </div>
              <span class="text-xs font-mono text-ink-muted">Toggle</span>
            </div>

            <div v-show="expandedSubs[feature.id + '-us'] !== false" class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="(us, idx) in (feature.userStories || [])"
                  :key="idx"
                  class="p-3 rounded bg-surface-2 border border-hairline flex flex-col justify-between"
                >
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="px-1.5 py-0.5 rounded text-xs font-mono bg-primary/15 text-primary-hover border border-primary/20 font-bold">
                        {{ us.id || ('US-' + (idx + 1)) }}
                      </span>
                      <span class="px-1.5 py-0.5 rounded text-xs font-mono bg-surface-4 text-ink-muted border border-hairline">
                        Role: {{ us.role || 'User' }}
                      </span>
                    </div>
                    <p class="text-xs text-ink mb-2">
                      <span class="text-ink-muted">I want to:</span> <strong>{{ us.action }}</strong>
                    </p>
                  </div>
                  <div v-if="us.benefit" class="pt-2 border-t border-hairline text-xs text-ink-muted">
                    <span>So that:</span> {{ us.benefit }}
                  </div>
                </div>
              </div>
              <p v-if="!feature.userStories?.length" class="text-xs text-ink-subtle italic">No user stories found in spec.md.</p>
            </div>
          </div>

          <!-- STEP 3: Acceptance Criteria (BDD) -->
          <div class="border border-hairline rounded-md bg-surface-1 overflow-hidden">
            <div
              @click="toggleSub(feature.id, 'bdd')"
              class="px-4 py-2.5 bg-surface-3/80 border-b border-hairline flex items-center justify-between cursor-pointer select-none"
            >
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                <span class="px-1.5 py-0.5 rounded text-xs font-mono bg-primary/20 text-primary-hover border border-primary/30">03</span>
                <span>BDD Acceptance Criteria ({{ feature.acceptanceCriteria?.length || 0 }})</span>
              </div>
              <span class="text-xs font-mono text-ink-muted">Toggle</span>
            </div>

            <div v-show="expandedSubs[feature.id + '-bdd'] !== false" class="p-4 space-y-3">
              <div
                v-for="(ac, idx) in (feature.acceptanceCriteria || [])"
                :key="idx"
                class="border border-hairline rounded bg-surface-2 overflow-hidden"
              >
                <div class="px-3 py-2 bg-surface-3 border-b border-hairline flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded font-mono bg-primary text-white font-bold">{{ ac.id }}</span>
                    <span class="font-semibold text-white">{{ ac.title }}</span>
                  </div>
                  <span class="text-ink-muted font-mono text-[10px] uppercase">{{ ac.category }}</span>
                </div>

                <div class="p-3 space-y-1.5 text-xs">
                  <div v-for="(clause, cIdx) in (ac.clauses || [])" :key="cIdx" class="flex items-baseline gap-2">
                    <span
                      :class="[
                        'font-mono text-[10px] font-bold px-1.5 py-0.5 rounded w-14 text-center inline-block',
                        clause.keyword === 'GIVEN' ? 'bg-semantic-info/15 text-semantic-info border border-semantic-info/30' :
                        clause.keyword === 'WHEN' ? 'bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/30' :
                        clause.keyword === 'THEN' ? 'bg-semantic-success/15 text-semantic-success border border-semantic-success/30' :
                        'bg-surface-4 text-ink-muted border border-hairline'
                      ]"
                    >
                      {{ clause.keyword }}
                    </span>
                    <span class="text-ink">{{ clause.text }}</span>
                  </div>
                </div>
              </div>
              <p v-if="!feature.acceptanceCriteria?.length" class="text-xs text-ink-subtle italic">No BDD acceptance criteria found in spec.md.</p>
            </div>
          </div>

          <!-- STEP 4: Atomic Tasks Execution (MetaGPT SOP) -->
          <div class="border border-hairline rounded-md bg-surface-1 overflow-hidden">
            <div
              @click="toggleSub(feature.id, 'tasks')"
              class="px-4 py-2.5 bg-surface-3/80 border-b border-hairline flex items-center justify-between cursor-pointer select-none"
            >
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                <span class="px-1.5 py-0.5 rounded text-xs font-mono bg-primary/20 text-primary-hover border border-primary/30">04</span>
                <span>Task Execution Table ({{ feature.tasks?.length || 0 }} tasks)</span>
              </div>
              <span class="text-xs font-mono text-ink-muted">Toggle</span>
            </div>

            <div v-show="expandedSubs[feature.id + '-tasks'] !== false" class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-surface-3/60 text-ink-muted font-mono uppercase text-[10px] border-b border-hairline">
                  <tr>
                    <th class="py-2.5 px-3 w-12 text-center">Status</th>
                    <th class="py-2.5 px-3 w-20">ID</th>
                    <th class="py-2.5 px-3 w-16">Type</th>
                    <th class="py-2.5 px-3">Description</th>
                    <th class="py-2.5 px-3">Target Files</th>
                    <th class="py-2.5 px-3 w-24">Dependencies</th>
                    <th class="py-2.5 px-3">Evidence</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-hairline">
                  <tr v-for="t in (feature.tasks || [])" :key="t.id" class="hover:bg-surface-2/40 transition-colors">
                    <td class="py-2 px-3 text-center font-mono font-bold">
                      <span v-if="t.status === 'done'" class="text-semantic-success">✓</span>
                      <span v-else-if="t.status === 'in_progress'" class="text-primary-hover animate-pulse">▶</span>
                      <span v-else class="text-ink-subtle">○</span>
                    </td>
                    <td class="py-2 px-3 font-mono font-semibold text-white">{{ t.id }}</td>
                    <td class="py-2 px-3">
                      <span class="px-1.5 py-0.5 rounded font-mono text-[10px] bg-surface-3 text-ink-muted border border-hairline">
                        {{ t.type }}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-ink">{{ t.description }}</td>
                    <td class="py-2 px-3">
                      <code class="text-[11px] font-mono text-primary-hover bg-surface-3/50 px-1 py-0.5 rounded border border-hairline/50">
                        {{ t.targetFiles }}
                      </code>
                    </td>
                    <td class="py-2 px-3 font-mono text-ink-muted text-[11px]">{{ t.dependencies }}</td>
                    <td class="py-2 px-3 font-mono text-ink-muted text-[11px] truncate max-w-xs">{{ t.evidence || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  features: { type: Array, default: () => [] }
});

const searchQuery = ref('');
const expandedFeatures = ref({});
const expandedSubs = ref({});

// Auto-expand the first feature when features load or update
watch(() => props.features, (newVal) => {
  if (newVal && newVal.length > 0) {
    const hasAnyExpanded = Object.values(expandedFeatures.value).some(Boolean);
    if (!hasAnyExpanded) {
      expandedFeatures.value[newVal[0].id] = true;
    }
  }
}, { immediate: true, deep: true });

const filteredFeatures = computed(() => {
  if (!searchQuery.value.trim()) return props.features;
  const q = searchQuery.value.toLowerCase();
  return props.features.filter(f =>
    (f.id && f.id.toLowerCase().includes(q)) ||
    (f.title && f.title.toLowerCase().includes(q))
  );
});

function toggleFeature(id) {
  expandedFeatures.value[id] = !expandedFeatures.value[id];
}

function toggleSub(featureId, subName) {
  const key = featureId + '-' + subName;
  expandedSubs.value[key] = expandedSubs.value[key] === false ? true : false;
}

function renderMd(text) {
  if (!text) return '';
  try {
    return marked.parse(text);
  } catch (e) {
    return text;
  }
}
</script>
