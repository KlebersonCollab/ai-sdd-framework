<template>
  <div>
    <!-- Search / Filter Bar -->
    <div class="flex flex-wrap justify-between items-center gap-3 mb-5">
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Active Specifications (.specs/features)
        </h3>
        <p class="text-xs text-ink-subtle mt-0.5">
          Hierarchical SDD Cascade: Strategic Plan → User Stories → BDD Criteria → Atomic Execution Matrix
        </p>
      </div>
      <div class="w-72">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search features or tasks..."
          class="w-full bg-surface-1 border border-hairline rounded-md px-3 py-1.5 text-xs text-white placeholder-ink-subtle focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
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
          <div class="flex items-center gap-3 flex-wrap">
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

            <!-- Next Actionable Task Pill in Header -->
            <span
              v-if="getNextTask(feature)"
              class="px-2 py-0.5 rounded text-[11px] font-mono bg-primary/20 text-primary-hover border border-primary/40 font-semibold animate-pulse flex items-center gap-1"
              title="Next Actionable Task ready to execute"
            >
              ⚡ Próxima: {{ getNextTask(feature).id }}
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

            <div v-show="expandedSubs[feature.id + '-us'] !== false" class="p-4 space-y-3">
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
                <span class="text-[10px] text-ink-subtle font-normal lowercase">(clique em um critério para rastrear tarefas)</span>
              </div>
              <span class="text-xs font-mono text-ink-muted">Toggle</span>
            </div>

            <div v-show="expandedSubs[feature.id + '-bdd'] !== false" class="p-4 space-y-3">
              <div
                v-for="(ac, idx) in (feature.acceptanceCriteria || [])"
                :key="idx"
                @click="toggleAcHighlight(feature.id, ac.id)"
                :class="[
                  'border rounded bg-surface-2 overflow-hidden cursor-pointer transition-all',
                  activeAcFilter[feature.id] === ac.id
                    ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10'
                    : 'border-hairline hover:border-hairline-strong'
                ]"
              >
                <div class="px-3 py-2 bg-surface-3 border-b border-hairline flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded font-mono bg-primary text-white font-bold">{{ ac.id }}</span>
                    <span class="font-semibold text-white">{{ ac.title }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="activeAcFilter[feature.id] === ac.id" class="text-[10px] font-mono text-primary-hover">● Rastreando</span>
                    <span class="text-ink-muted font-mono text-[10px] uppercase">{{ ac.category }}</span>
                  </div>
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

          <!-- STEP 4: Unified Atomic Task Execution Cascade (MetaGPT SOP) -->
          <div class="border border-hairline rounded-md bg-surface-1 overflow-hidden">
            <div
              @click="toggleSub(feature.id, 'tasks')"
              class="px-4 py-2.5 bg-surface-3/80 border-b border-hairline flex items-center justify-between cursor-pointer select-none"
            >
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                <span class="px-1.5 py-0.5 rounded text-xs font-mono bg-primary/20 text-primary-hover border border-primary/30">04</span>
                <span>Unified Task Execution Matrix ({{ feature.tasks?.length || 0 }} tasks)</span>
              </div>
              <span class="text-xs font-mono text-ink-muted">Toggle</span>
            </div>

            <div v-show="expandedSubs[feature.id + '-tasks'] !== false">
              
              <!-- Task Filter & Metrics Bar -->
              <div class="p-3 border-b border-hairline bg-surface-2/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <!-- Status & Quick Filters -->
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[11px] font-mono font-semibold uppercase text-ink-muted">Filtros:</span>
                  
                  <button
                    type="button"
                    @click="setFilterStatus(feature.id, 'ALL')"
                    :class="[
                      'px-2 py-0.5 rounded text-[11px] font-mono border transition-colors',
                      getFilter(feature.id).status === 'ALL'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-3 text-ink-muted border-hairline hover:text-white'
                    ]"
                  >
                    Todas ({{ getResolvedTasks(feature).length }})
                  </button>

                  <button
                    type="button"
                    @click="setFilterStatus(feature.id, 'READY')"
                    :class="[
                      'px-2 py-0.5 rounded text-[11px] font-mono border transition-colors flex items-center gap-1',
                      getFilter(feature.id).status === 'READY'
                        ? 'bg-primary/30 text-primary-hover border-primary font-bold'
                        : 'bg-surface-3 text-ink-muted border-hairline hover:text-white'
                    ]"
                  >
                    <span>⚡ Prontas</span>
                    <span>({{ countReady(feature) }})</span>
                  </button>

                  <button
                    type="button"
                    @click="setFilterStatus(feature.id, 'BLOCKED')"
                    :class="[
                      'px-2 py-0.5 rounded text-[11px] font-mono border transition-colors flex items-center gap-1',
                      getFilter(feature.id).status === 'BLOCKED'
                        ? 'bg-semantic-warning/20 text-semantic-warning border-semantic-warning font-bold'
                        : 'bg-surface-3 text-ink-muted border-hairline hover:text-white'
                    ]"
                  >
                    <span>🔒 Bloqueadas</span>
                    <span>({{ countBlocked(feature) }})</span>
                  </button>

                  <button
                    type="button"
                    @click="setFilterStatus(feature.id, 'DONE')"
                    :class="[
                      'px-2 py-0.5 rounded text-[11px] font-mono border transition-colors flex items-center gap-1',
                      getFilter(feature.id).status === 'DONE'
                        ? 'bg-semantic-success/20 text-semantic-success border-semantic-success font-bold'
                        : 'bg-surface-3 text-ink-muted border-hairline hover:text-white'
                    ]"
                  >
                    <span>✓ Concluídas</span>
                    <span>({{ countDone(feature) }})</span>
                  </button>

                  <!-- Active AC Filter reset if active -->
                  <button
                    v-if="activeAcFilter[feature.id]"
                    type="button"
                    @click="activeAcFilter[feature.id] = null"
                    class="px-2 py-0.5 rounded text-[11px] font-mono bg-primary/20 text-primary-hover border border-primary/40 flex items-center gap-1 hover:bg-primary/30"
                  >
                    <span>Filtro {{ activeAcFilter[feature.id] }}</span>
                    <span>✕</span>
                  </button>
                </div>

                <!-- Type Filter -->
                <div class="flex items-center gap-2">
                  <select
                    v-model="getFilter(feature.id).type"
                    class="bg-surface-3 border border-hairline rounded px-2 py-0.5 text-[11px] font-mono text-ink focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">Todos os Tipos</option>
                    <option value="feat">feat</option>
                    <option value="test">test</option>
                    <option value="refactor">refactor</option>
                    <option value="fix">fix</option>
                    <option value="docs">docs</option>
                    <option value="review">review</option>
                  </select>
                </div>
              </div>

              <!-- Tasks Table -->
              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left">
                  <thead class="bg-surface-3/60 text-ink-muted font-mono uppercase text-[10px] border-b border-hairline">
                    <tr>
                      <th class="py-2.5 px-3 w-14 text-center">Status</th>
                      <th class="py-2.5 px-3 w-28">ID & State</th>
                      <th class="py-2.5 px-3 w-16">Type</th>
                      <th class="py-2.5 px-3">Description</th>
                      <th class="py-2.5 px-3">Target Files</th>
                      <th class="py-2.5 px-3 w-36">Dependencies</th>
                      <th class="py-2.5 px-3">Evidence</th>
                      <th class="py-2.5 px-3 w-28 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-hairline">
                    <tr
                      v-for="t in getFilteredTasks(feature)"
                      :key="t.id"
                      :id="`task-row-${feature.id}-${t.id}`"
                      :class="[
                        'transition-all duration-300',
                        activeTargetTaskId === t.id
                          ? 'bg-primary/20 ring-2 ring-primary ring-inset'
                          : isTaskMatchedWithAc(feature.id, t)
                          ? 'bg-primary/10 border-l-2 border-primary'
                          : t.isNextActionable
                          ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary'
                          : t.isBlocked
                          ? 'opacity-70 hover:opacity-100 hover:bg-surface-2/40'
                          : 'hover:bg-surface-2/40'
                      ]"
                    >
                      <!-- Status Icon -->
                      <td class="py-2.5 px-3 text-center font-mono font-bold">
                        <span v-if="t.isDone" class="text-semantic-success text-sm" title="Tarefa Concluída">✓</span>
                        <span v-else-if="t.isNextActionable" class="text-primary-hover animate-pulse text-sm" title="Próxima Tarefa Pronta">⚡</span>
                        <span v-else-if="t.isBlocked" class="text-semantic-warning text-xs" title="Bloqueada por dependências">🔒</span>
                        <span v-else class="text-ink-subtle text-xs" title="Pendente / Pronta">○</span>
                      </td>

                      <!-- ID & Readiness Badge -->
                      <td class="py-2.5 px-3 font-mono">
                        <div class="flex flex-col gap-1">
                          <span class="font-bold text-white">{{ t.id }}</span>
                          <span
                            v-if="t.isNextActionable"
                            class="px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider bg-primary/20 text-primary-hover border border-primary/40 font-bold inline-block text-center animate-pulse"
                          >
                            PRÓXIMA
                          </span>
                          <span
                            v-else-if="t.isBlocked"
                            class="px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/30 inline-block text-center"
                            :title="'Bloqueada por: ' + t.unmetDeps.join(', ')"
                          >
                            BLOQUEADA
                          </span>
                          <span
                            v-else-if="t.isReady"
                            class="px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider bg-surface-3 text-ink-muted border border-hairline inline-block text-center"
                          >
                            PRONTA
                          </span>
                        </div>
                      </td>

                      <!-- Type -->
                      <td class="py-2.5 px-3">
                        <span class="px-1.5 py-0.5 rounded font-mono text-[10px] bg-surface-3 text-ink-muted border border-hairline">
                          {{ t.type }}
                        </span>
                      </td>

                      <!-- Description -->
                      <td class="py-2.5 px-3 text-ink">
                        <div class="space-y-1">
                          <p class="leading-relaxed">{{ t.description }}</p>
                          <!-- Reversion note if any -->
                          <div v-if="t.evidence && t.evidence.includes('[Reverted]')" class="text-[10px] font-mono text-semantic-danger bg-semantic-danger/10 border border-semantic-danger/20 px-1.5 py-0.5 rounded">
                            {{ t.evidence }}
                          </div>
                        </div>
                      </td>

                      <!-- Target Files Chips -->
                      <td class="py-2.5 px-3">
                        <div v-if="t.targetFiles && t.targetFiles !== '-'" class="flex flex-wrap gap-1">
                          <span
                            v-for="file in splitFiles(t.targetFiles)"
                            :key="file"
                            @click="copyFilePath(file)"
                            class="text-[10px] font-mono text-primary-hover bg-surface-3 hover:bg-surface-4 px-1.5 py-0.5 rounded border border-hairline cursor-pointer inline-flex items-center gap-1 group transition-colors"
                            :title="'Clique para copiar: ' + file"
                          >
                            <span class="truncate max-w-[140px]">{{ file }}</span>
                            <span class="opacity-0 group-hover:opacity-100 text-[9px] text-ink-muted">📋</span>
                          </span>
                        </div>
                        <span v-else class="text-ink-subtle font-mono text-[10px]">-</span>
                      </td>

                      <!-- Reactive Dependency Badges -->
                      <td class="py-2.5 px-3 font-mono">
                        <div v-if="t.depList && t.depList.length > 0" class="flex flex-wrap gap-1">
                          <button
                            v-for="depId in t.depList"
                            :key="depId"
                            type="button"
                            @click="scrollToTask(feature.id, depId)"
                            :class="[
                              'px-1.5 py-0.5 rounded text-[10px] border flex items-center gap-1 transition-all',
                              isDepDone(feature, depId)
                                ? 'bg-semantic-success/15 text-semantic-success border-semantic-success/30 hover:bg-semantic-success/25'
                                : 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30 hover:bg-semantic-warning/25'
                            ]"
                            :title="isDepDone(feature, depId) ? `Dependência ${depId} satisfeita` : `Dependência ${depId} pendente (clique para ir)`"
                          >
                            <span>{{ depId }}</span>
                            <span>{{ isDepDone(feature, depId) ? '✓' : '○' }}</span>
                          </button>
                        </div>
                        <span v-else class="text-ink-subtle text-[11px]">None</span>
                      </td>

                      <!-- Evidence -->
                      <td class="py-2.5 px-3 font-mono text-ink-muted text-[11px] truncate max-w-xs">
                        <span v-if="t.evidence" class="text-semantic-success bg-semantic-success/10 px-1.5 py-0.5 rounded border border-semantic-success/20 truncate block" :title="t.evidence">
                          {{ t.evidence }}
                        </span>
                        <span v-else class="text-ink-subtle">-</span>
                      </td>

                      <!-- Actions -->
                      <td class="py-2.5 px-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <!-- Delegar Prompt Button -->
                          <button
                            v-if="!t.isDone"
                            type="button"
                            @click="dispatchToAgent(feature, t)"
                            class="px-2 py-1 rounded text-[11px] font-mono font-semibold bg-primary/20 hover:bg-primary/30 text-primary-hover border border-primary/30 flex items-center gap-1 transition-colors"
                            title="Copiar prompt de delegação desta tarefa para o agente"
                          >
                            ⚡ Delegar
                          </button>

                          <!-- Manual Concluir Button (for human verified tasks) -->
                          <button
                            v-if="!t.isDone"
                            type="button"
                            @click="markTaskDone(feature, t)"
                            class="p-1 rounded text-[11px] font-mono text-ink-muted hover:text-semantic-success hover:bg-semantic-success/10 border border-hairline transition-colors"
                            title="Marcar manualmente como Concluída"
                          >
                            ✓
                          </button>

                          <!-- Rejeitar / Reverter Button (for completed tasks) -->
                          <button
                            v-if="t.isDone"
                            type="button"
                            @click="openRejectModal(feature, t)"
                            class="px-2 py-1 rounded text-[10px] font-mono text-semantic-danger hover:bg-semantic-danger/10 border border-semantic-danger/30 transition-colors"
                            title="Reverter tarefa para pendente com feedback"
                          >
                            ↩ Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
          Ao reverter a tarefa para <strong>Pendente</strong>, descreva o que o agente precisa corrigir.
          Esse feedback será gravado no <code>tasks.md</code> e ficará imediatamente visível para a IA.
        </p>

        <div>
          <label class="block text-xs uppercase font-mono font-semibold text-ink-muted mb-1.5">
            Motivo da Rejeição / Instrução de Ajuste:
          </label>
          <textarea
            v-model="rejectionFeedback"
            rows="3"
            placeholder="Ex: O teste de regressão falhou; precisa validar argumentos nulos antes de processar..."
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
            Gravar & Mover para Pendente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  features: { type: Array, default: () => [] }
});

const emit = defineEmits(['update-task', 'dispatch-agent']);

const searchQuery = ref('');
const expandedFeatures = ref({});
const expandedSubs = ref({});
const activeTargetTaskId = ref(null);

// Per-feature task filter state
const taskFilters = ref({});
// Per-feature active BDD AC filter
const activeAcFilter = ref({});

// Modal state
const isRejectModalOpen = ref(false);
const activeTaskForModal = ref(null);
const rejectionFeedback = ref('');

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
  return props.features.filter(f => {
    const matchId = f.id && f.id.toLowerCase().includes(q);
    const matchTitle = f.title && f.title.toLowerCase().includes(q);
    const matchTask = (f.tasks || []).some(t =>
      (t.id && t.id.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
    return matchId || matchTitle || matchTask;
  });
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

function splitFiles(filesStr) {
  if (!filesStr || filesStr === '-') return [];
  return filesStr.split(',').map(s => s.trim().replace(/^`|`$/g, '')).filter(Boolean);
}

function copyFilePath(path) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(path).catch(() => {});
  }
}

// -------------------------------------------------------------
// Topological Dependency Resolution Logic (MetaGPT SOP DAG)
// -------------------------------------------------------------
function getResolvedTasks(feature) {
  const tasks = feature.tasks || [];
  if (!tasks.length) return [];

  const taskMap = new Map();
  tasks.forEach(t => taskMap.set(t.id, t));

  const resolved = [];
  let foundNext = false;

  for (const t of tasks) {
    const isDone = t.status === 'done';
    const isInProgress = t.status === 'in_progress';

    // Parse dependencies
    let depList = [];
    if (t.dependencies && t.dependencies !== 'None' && t.dependencies.trim() !== '') {
      depList = t.dependencies.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Check if blocked by pending dependencies
    const unmetDeps = [];
    for (const depId of depList) {
      const dep = taskMap.get(depId);
      if (!dep || dep.status !== 'done') {
        unmetDeps.push(depId);
      }
    }

    const isBlocked = !isDone && unmetDeps.length > 0;
    const isReady = !isDone && unmetDeps.length === 0;

    let isNextActionable = false;
    if (isReady && !foundNext) {
      isNextActionable = true;
      foundNext = true;
    }

    resolved.push({
      ...t,
      depList,
      unmetDeps,
      isDone,
      isInProgress,
      isBlocked,
      isReady,
      isNextActionable
    });
  }

  return resolved;
}

function getNextTask(feature) {
  const tasks = getResolvedTasks(feature);
  return tasks.find(t => t.isNextActionable) || null;
}

function countReady(feature) {
  return getResolvedTasks(feature).filter(t => t.isReady).length;
}

function countBlocked(feature) {
  return getResolvedTasks(feature).filter(t => t.isBlocked).length;
}

function countDone(feature) {
  return getResolvedTasks(feature).filter(t => t.isDone).length;
}

function isDepDone(feature, depId) {
  const tasks = feature.tasks || [];
  const dep = tasks.find(t => t.id === depId);
  return dep && dep.status === 'done';
}

function getFilter(featureId) {
  if (!taskFilters.value[featureId]) {
    taskFilters.value[featureId] = {
      status: 'ALL',
      type: 'ALL'
    };
  }
  return taskFilters.value[featureId];
}

function setFilterStatus(featureId, status) {
  getFilter(featureId).status = status;
}

function toggleAcHighlight(featureId, acId) {
  if (activeAcFilter.value[featureId] === acId) {
    activeAcFilter.value[featureId] = null;
  } else {
    activeAcFilter.value[featureId] = acId;
    // Auto-open tasks section
    expandedSubs.value[featureId + '-tasks'] = true;
  }
}

function isTaskMatchedWithAc(featureId, task) {
  const activeAc = activeAcFilter.value[featureId];
  if (!activeAc) return false;
  const desc = (task.description || '').toLowerCase();
  const evidence = (task.evidence || '').toLowerCase();
  const acLower = activeAc.toLowerCase();
  return desc.includes(acLower) || evidence.includes(acLower);
}

function getFilteredTasks(feature) {
  const allResolved = getResolvedTasks(feature);
  const filter = getFilter(feature.id);
  const activeAc = activeAcFilter.value[feature.id];

  return allResolved.filter(t => {
    // AC filter
    if (activeAc && !isTaskMatchedWithAc(feature.id, t)) {
      return false;
    }

    // Status filter
    if (filter.status === 'READY' && !t.isReady) return false;
    if (filter.status === 'BLOCKED' && !t.isBlocked) return false;
    if (filter.status === 'DONE' && !t.isDone) return false;

    // Type filter
    if (filter.type !== 'ALL' && t.type !== filter.type) return false;

    return true;
  });
}

// -------------------------------------------------------------
// Interactive Navigation & Actions
// -------------------------------------------------------------
function scrollToTask(featureId, taskId) {
  expandedFeatures.value[featureId] = true;
  expandedSubs.value[featureId + '-tasks'] = true;
  activeTargetTaskId.value = taskId;

  nextTick(() => {
    const el = document.getElementById(`task-row-${featureId}-${taskId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        if (activeTargetTaskId.value === taskId) {
          activeTargetTaskId.value = null;
        }
      }, 2500);
    }
  });
}

function dispatchToAgent(feature, task) {
  const prompt = `[SDD ATOMIC TASK DELEGATION]\nFeature: ${feature.id} (${feature.title || feature.id})\nTask: ${task.id} [${task.type}]\nDescription: ${task.description}\nTarget Files: ${task.targetFiles || 'N/A'}\nDependencies: ${task.dependencies || 'None'}\n\nExecute atomicamente esta tarefa seguindo o ciclo TDD (sdd-executor) e registre as evidências no tasks.md.`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(prompt).catch(() => {});
  }

  emit('dispatch-agent', {
    ...task,
    featureId: feature.id,
    featureTitle: feature.title
  });
}

function openRejectModal(feature, task) {
  activeTaskForModal.value = { ...task, featureId: feature.id };
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
  emit('update-task', {
    featureId: task.featureId,
    taskId: task.id,
    status: 'pending',
    feedback: rejectionFeedback.value.trim() || 'Needs revision'
  });
  closeRejectModal();
}

function markTaskDone(feature, task) {
  emit('update-task', {
    featureId: feature.id,
    taskId: task.id,
    status: 'done'
  });
}
</script>
