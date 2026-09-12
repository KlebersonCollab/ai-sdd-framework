<template>
  <div
    v-show="isOpen"
    class="fixed bottom-0 left-0 right-0 z-50 bg-surface-1 border-t border-hairline shadow-2xl flex flex-col transition-all duration-200"
    :style="{ height: isMaximized ? '80vh' : '320px' }"
  >
    <!-- Drawer Header -->
    <div class="h-10 px-4 bg-surface-2 border-b border-hairline flex items-center justify-between select-none">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full" :class="connectionStatusColor"></span>
          <span class="text-xs font-mono font-bold text-ink uppercase tracking-wider">AI-SDD Interactive Shell</span>
        </div>
        <span class="text-[11px] font-mono text-ink-muted">
          {{ connectionStatusText }}
        </span>

        <!-- Active OS Terminal Font Badge / Switcher -->
        <button
          type="button"
          @click="promptChangeFont"
          class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-3 hover:bg-surface-4 border border-hairline text-[10px] font-mono text-ink-muted hover:text-white transition-colors ml-2"
          title="Fonte do Terminal detectada no SO. Clique para alterar."
        >
          <span class="text-ink-subtle uppercase">Font:</span>
          <span class="text-primary-hover font-semibold truncate max-w-[170px]">{{ terminalFont }}</span>
        </button>
      </div>

      <!-- Shortcut Action Buttons -->
      <div class="flex items-center gap-2">
        <span class="text-[10px] uppercase font-mono text-ink-subtle hidden sm:inline">Sensors:</span>
        <button
          type="button"
          @click="sendCommand('npm run check-drift\r')"
          class="px-2 py-1 bg-surface-3 hover:bg-surface-4 border border-hairline rounded text-[11px] font-mono text-primary-hover transition-colors flex items-center gap-1"
          title="Run Spec Drift Sensor"
        >
          <span>🔍</span>
          <span>Drift Check</span>
        </button>

        <button
          type="button"
          @click="sendCommand('npm test\r')"
          class="px-2 py-1 bg-surface-3 hover:bg-surface-4 border border-hairline rounded text-[11px] font-mono text-semantic-success transition-colors flex items-center gap-1"
          title="Run Framework Test Suite"
        >
          <span>🧪</span>
          <span>npm test</span>
        </button>

        <button
          type="button"
          @click="clearTerminal"
          class="px-2 py-1 bg-surface-3 hover:bg-surface-4 border border-hairline rounded text-[11px] font-mono text-ink-muted transition-colors"
          title="Clear screen"
        >
          Clear
        </button>

        <div class="h-4 w-px bg-hairline mx-1"></div>

        <!-- Maximize / Restore -->
        <button
          type="button"
          @click="isMaximized = !isMaximized"
          class="p-1 hover:text-white text-ink-muted rounded transition-colors text-xs"
          :title="isMaximized ? 'Restore height' : 'Maximize terminal'"
        >
          {{ isMaximized ? '🗗' : '🗖' }}
        </button>

        <!-- Close Drawer -->
        <button
          type="button"
          @click="$emit('close')"
          class="p-1 hover:text-semantic-danger text-ink-muted rounded transition-colors text-xs font-bold"
          title="Close terminal drawer"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Terminal Container -->
    <div
      ref="terminalRef"
      @click="focusTerminal"
      class="flex-1 w-full bg-[#0a0b0e] p-2 overflow-hidden cursor-text"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const terminalRef = ref(null);
const isMaximized = ref(false);
const connectionStatus = ref('disconnected'); // 'connecting' | 'connected' | 'disconnected' | 'error'
const terminalFont = ref(localStorage.getItem('sdd_terminal_font') || 'JetBrainsMonoNL Nerd Font Mono');

const computedFontFamily = computed(() => {
  return `"${terminalFont.value}", "JetBrainsMonoNL Nerd Font Mono", "JetBrainsMono Nerd Font", "JetBrains Mono NL", "JetBrains Mono", Menlo, Monaco, Consolas, "Courier New", monospace`;
});

function applyFont(newFont) {
  if (!newFont) return;
  terminalFont.value = newFont;
  localStorage.setItem('sdd_terminal_font', newFont);
  if (term) {
    term.options.fontFamily = computedFontFamily.value;
    if (fitAddon) {
      setTimeout(() => {
        try { fitAddon.fit(); } catch {}
      }, 50);
    }
  }
}

function promptChangeFont() {
  const input = window.prompt('Informe a fonte do terminal (ex: JetBrainsMonoNL Nerd Font Mono):', terminalFont.value);
  if (input && input.trim()) {
    applyFont(input.trim());
  }
}

async function loadTerminalConfig() {
  try {
    const res = await fetch('/api/terminal-config');
    if (res.ok) {
      const data = await res.json();
      if (data.fontFamily && !localStorage.getItem('sdd_terminal_font')) {
        terminalFont.value = data.fontFamily;
        if (term) {
          term.options.fontFamily = computedFontFamily.value;
          if (fitAddon) fitAddon.fit();
        }
      }
    }
  } catch (e) {}
}

let term = null;
let fitAddon = null;
let socket = null;
let resizeObserver = null;
let currentLine = '';
const commandHistory = [];
let historyIndex = -1;

function focusTerminal() {
  if (term) term.focus();
}

const connectionStatusColor = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'bg-semantic-success shadow-[0_0_8px_rgba(74,222,128,0.5)]';
    case 'connecting': return 'bg-semantic-warning animate-pulse';
    case 'error': return 'bg-semantic-danger';
    default: return 'bg-ink-subtle';
  }
});

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'WS: Connected';
    case 'connecting': return 'WS: Connecting...';
    case 'error': return 'WS: Connection Error';
    default: return 'WS: Disconnected';
  }
});

function initTerminal() {
  if (!terminalRef.value || term) return;

  term = new Terminal({
    convertEol: true,
    cursorBlink: true,
    cursorStyle: 'bar',
    fontFamily: computedFontFamily.value,
    fontSize: 13,
    lineHeight: 1.2,
    letterSpacing: 0,
    scrollback: 5000,
    theme: {
      background: '#0a0b0e',
      foreground: '#d1d5db',
      cursor: '#5e6ad2',
      cursorAccent: '#ffffff',
      selectionBackground: 'rgba(94, 106, 210, 0.35)',
      black: '#1f242d',
      red: '#f87171',
      green: '#4ade80',
      yellow: '#fbbf24',
      blue: '#60a5fa',
      magenta: '#c084fc',
      cyan: '#38bdf8',
      white: '#f3f4f6',
      brightBlack: '#4b5563',
      brightRed: '#ef4444',
      brightGreen: '#22c55e',
      brightYellow: '#f59e0b',
      brightBlue: '#3b82f6',
      brightMagenta: '#a855f7',
      brightCyan: '#06b6d4',
      brightWhite: '#ffffff'
    }
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(terminalRef.value);

  setTimeout(() => {
    try { fitAddon.fit(); } catch {}
  }, 50);
  setTimeout(() => {
    try { fitAddon.fit(); } catch {}
  }, 250);

  term.onResize(({ cols, rows }) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
  });

  term.onData((data) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    if (data === '\r') {
      // Enter: execute command line
      const cmd = currentLine;
      currentLine = '';
      historyIndex = -1;
      if (cmd.trim()) {
        commandHistory.push(cmd);
      }
      term.write('\r');
      socket.send(cmd + '\r\n');
    } else if (data === '\u007f' || data === '\b') {
      // Backspace: erase character locally
      if (currentLine.length > 0) {
        currentLine = currentLine.slice(0, -1);
        term.write('\b \b');
      }
    } else if (data === '\u0003') {
      // Ctrl+C: Cancel current input
      currentLine = '';
      historyIndex = -1;
      term.write('^C\r\n');
      socket.send('\r\n');
    } else if (data === '\u001b[A') {
      // Up Arrow: History previous
      if (commandHistory.length > 0) {
        if (historyIndex === -1) {
          historyIndex = commandHistory.length - 1;
        } else if (historyIndex > 0) {
          historyIndex--;
        }
        while (currentLine.length > 0) {
          term.write('\b \b');
          currentLine = currentLine.slice(0, -1);
        }
        currentLine = commandHistory[historyIndex] || '';
        term.write(currentLine);
      }
    } else if (data === '\u001b[B') {
      // Down Arrow: History next
      if (historyIndex !== -1) {
        while (currentLine.length > 0) {
          term.write('\b \b');
          currentLine = currentLine.slice(0, -1);
        }
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          currentLine = commandHistory[historyIndex] || '';
          term.write(currentLine);
        } else {
          historyIndex = -1;
          currentLine = '';
        }
      }
    } else if (!data.startsWith('\u001b')) {
      // Printable characters
      currentLine += data;
      term.write(data);
    }
  });

  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      if (props.isOpen && fitAddon) {
        try {
          fitAddon.fit();
        } catch {
          // ignore layout fits during transition
        }
      }
    });
    resizeObserver.observe(terminalRef.value);
  }

  connectWebSocket();
}

function connectWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  connectionStatus.value = 'connecting';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || 'localhost:3000';
  const wsUrl = `${protocol}//${host}/api/terminal`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      connectionStatus.value = 'connected';
      if (term) {
        if (fitAddon) {
          try { fitAddon.fit(); } catch {}
        }
        socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };

    socket.onmessage = (event) => {
      if (term) {
        term.write(event.data);
      }
    };

    socket.onerror = () => {
      connectionStatus.value = 'error';
    };

    socket.onclose = () => {
      connectionStatus.value = 'disconnected';
      if (term) {
        term.write('\r\n\x1b[38;2;248;113;113m[AI-SDD Shell Connection Closed]\x1b[0m\r\n');
      }
    };
  } catch (err) {
    connectionStatus.value = 'error';
  }
}

function sendCommand(cmd) {
  const cleanCmd = (cmd || '').replace(/[\r\n]+$/, '').trim();
  if (!cleanCmd) return;

  // Clear any incomplete input locally
  if (currentLine.length > 0) {
    while (currentLine.length > 0) {
      term.write('\b \b');
      currentLine = currentLine.slice(0, -1);
    }
  }

  term.write(cleanCmd + '\r\n');
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(cleanCmd + '\r\n');
    if (term) term.focus();
  } else {
    connectWebSocket();
    setTimeout(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(cleanCmd + '\r\n');
        if (term) term.focus();
      }
    }, 500);
  }
}

function clearTerminal() {
  currentLine = '';
  if (term) {
    term.clear();
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (!term) {
        initTerminal();
      } else {
        if (!socket || socket.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
        setTimeout(() => {
          if (fitAddon) {
            try { fitAddon.fit(); } catch {}
          }
          if (term) term.focus();
        }, 50);
        setTimeout(() => {
          if (fitAddon) {
            try { fitAddon.fit(); } catch {}
          }
        }, 250);
      }
    });
  }
});

watch(isMaximized, () => {
  setTimeout(() => {
    if (fitAddon) {
      try { fitAddon.fit(); } catch {}
    }
  }, 100);
  setTimeout(() => {
    if (fitAddon) {
      try { fitAddon.fit(); } catch {}
    }
  }, 250);
});

onMounted(() => {
  loadTerminalConfig();
  if (props.isOpen) {
    initTerminal();
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (socket) {
    socket.close();
  }
  if (term) {
    term.dispose();
  }
});
</script>
